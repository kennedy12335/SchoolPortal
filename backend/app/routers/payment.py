from ..services.fees_service import calculate_fees
from fastapi import APIRouter, Depends, HTTPException, Request
import hmac
import hashlib
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
from ..models.payment import Payment, PaymentStatus, ExamPayment
from ..models.student import Student
from ..models.parent import Parent
from ..models.student_fee import StudentFee
from ..models.fee import Fee
from ..utils.exams import update_payment_records, update_exam_payment_records
import requests
import os
from dotenv import load_dotenv
import logging

# Import the centralized payment service and schemas
from ..services.payment_service import (
    initialize_payment, 
    PaymentType, 
    SchoolFeesPaymentData,
)
from ..schemas.payment import (
    PaymentBase,
    PaymentCreate,
    PaymentResponse,
    PaystackResponse,
    SchoolPaymentReceipt,
    SchoolReceiptStudent,
    ReceiptFee,
)

load_dotenv()

router = APIRouter()
PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize"
PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify/"
PAYSTACK_SPLIT_URL = "https://api.paystack.co/split"

PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")

# Setup logger
logger = logging.getLogger(__name__)

@router.post("/initialize", response_model=dict)
async def initialize_payment_endpoint(payment: PaymentCreate, db: Session = Depends(get_db)):
    logger.info(f"Initializing payment for students: {payment.student_ids}")
    
    try:    
        # Calculate and validate the amount (no clubs)
        fee_calculation = await calculate_fees(
            student_ids=payment.student_ids,
            student_club_ids={},  # No clubs
            db=db
        )
        
        # Validate that the submitted amount matches the calculated amount
        if abs(payment.amount - fee_calculation.total_amount) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid amount. Expected: {fee_calculation.total_amount}, Got: {payment.amount}"
            )
        
        # Prepare payment data for the centralized service
        payment_data = SchoolFeesPaymentData(
            student_ids=payment.student_ids,
            amount=payment.amount,
            payment_method=payment.payment_method,
            parent_id=payment.parent_id,
            student_fee_ids=payment.student_fee_ids,
            description=payment.description
        )
        
        # Use the centralized payment service
        result = initialize_payment(
            payment_type=PaymentType.SCHOOL_FEES,
            payment_data=payment_data,
            db=db
        )
        
        if result.status:
            return result.data
        else:
            raise HTTPException(status_code=400, detail=result.message)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[PaymentResponse])
def get_payments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    payments = db.query(Payment).offset(skip).limit(limit).all()
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.post("/verify/{payment_reference}")
async def verify_payment_status(payment_reference: str, db: Session = Depends(get_db)):
    # First check our local database
    payment = db.query(Payment).filter(Payment.payment_reference == payment_reference).first()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Also verify with Paystack
    try:
        paystack_response = verify_payment(payment_reference)
        if paystack_response["status"] and paystack_response["data"]["status"] == "success":
            # Update local status + related records + create payment items
            await update_payment_records(
                db,
                payment,
                payment.student_ids,
                logger,
                metadata=paystack_response.get("data", {}).get("metadata"),
            )
            return {"status": "completed"}
        elif paystack_response["data"]["status"] == "pending":
            return {"status": "pending"}
        else:
            return {"status": "failed"}
    except Exception as e:
        logger.error(f"Error verifying payment with Paystack: {str(e)}")
        # Fall back to local status if Paystack verification fails
        return {"status": payment.status.value}

@router.post("/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)) -> Dict:
    try:
        logger.info("=============== NEW WEBHOOK REQUEST ===============")
        logger.info(f"Headers: {request.headers}")

        # Verify the request signature
        signature = request.headers.get('x-paystack-signature')
        logger.info(f"Received signature: {signature}")

        if not signature:
            logger.error("Signature missing in request")
            raise HTTPException(status_code=400, detail="Signature missing")

        # Get raw request body
        body = await request.body()
        logger.info(f"Raw body: {body.decode()}")

        # Compute the expected signature
        secret_key = os.getenv("PAYSTACK_SECRET_KEY")
        computed_signature = hmac.new(
            secret_key.encode('utf-8'),
            body,
            hashlib.sha512
        ).hexdigest()
        logger.info(f"Computed signature: {computed_signature}")

        # Compare the signatures
        if not hmac.compare_digest(computed_signature, signature):
            logger.error("Invalid signature")
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Parse the request data
        event = await request.json()
        logger.info(f"Parsed event data: {event}")
        print(event)
        if event['event'] == 'charge.success':
            reference = event['data']['reference']
            logger.info(f"Transaction reference: {reference}")

            response = verify_payment(reference)
            logger.info(f"Verification response: {response}")

            if response["data"]["status"] == "success":
                logger.info(f"Payment status is success")
                if event['data']['metadata']['payment_type'] == 'school_fees':
                    logger.info(f"Payment type is school fees")
                    payment = db.query(Payment).filter(Payment.payment_reference == reference).first()
                    if payment:
                        logger.info(f"Payment found")
                        await update_payment_records(
                            db,
                            payment,
                            payment.student_ids,
                            logger,
                            metadata=response.get("data", {}).get("metadata"),
                        )
                        return {"status": "success"}

                elif event['data']['metadata']['payment_type'] == 'exam_fees':
                    logger.info(f"Payment type is exam fees")
                    exam_payments = db.query(ExamPayment).filter(ExamPayment.payment_reference == reference)
                    if exam_payments:
                        logger.info(f"Exam payment found")
                        await update_exam_payment_records(db, exam_payments, logger)
                        return {"status": "success"}
        return {"status": "failed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def verify_payment(payment_reference: str):
    secret_key = os.getenv("PAYSTACK_SECRET_KEY")
    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{PAYSTACK_VERIFY_URL}{payment_reference}", headers=headers)
    return response.json()


@router.get("/receipt/{payment_reference}", response_model=SchoolPaymentReceipt)
def get_payment_receipt(payment_reference: str, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.payment_reference == payment_reference).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    parent = payment.payer
    students = db.query(Student).filter(Student.id.in_(payment.student_ids)).all()
    student_map = {s.id: s for s in students}

    # Fetch fee rows linked to this payment. Fall back to student_id filter if list is empty.
    if payment.student_fee_ids:
        fee_rows = db.query(StudentFee).filter(StudentFee.id.in_(payment.student_fee_ids)).all()
    else:
        fee_rows = db.query(StudentFee).filter(StudentFee.student_id.in_(payment.student_ids)).all()

    # Preload fees
    fee_ids = {row.fee_id for row in fee_rows}
    fees_by_id = {f.id: f for f in db.query(Fee).filter(Fee.id.in_(fee_ids)).all()} if fee_ids else {}

    students_receipts: list[SchoolReceiptStudent] = []
    for student_id in payment.student_ids:
        student = student_map.get(student_id)
        if not student:
            continue

        student_fee_rows = [fr for fr in fee_rows if fr.student_id == student_id]
        receipt_fees: list[ReceiptFee] = []
        for fr in student_fee_rows:
            fee_obj = fees_by_id.get(fr.fee_id)
            amount = float(fr.amount)
            if fr.discount_percentage:
                amount = round(amount * (1 - (fr.discount_percentage / 100)), 2)
            receipt_fees.append(
                ReceiptFee(
                    code=fee_obj.code if fee_obj else "UNKNOWN",
                    name=fee_obj.name if fee_obj else "Fee",
                    amount=amount,
                )
            )

        student_total = round(sum(f.amount for f in receipt_fees), 2)

        students_receipts.append(
            SchoolReceiptStudent(
                student_id=student.id,
                name=f"{student.first_name} {student.last_name}",
                year_group=student.year_group.name if student.year_group else None,
                class_name=student.class_name.name if student.class_name else None,
                fees=receipt_fees,
                total=student_total,
            )
        )

    return SchoolPaymentReceipt(
        reference=payment.payment_reference,
        amount=float(payment.amount),
        payment_method=payment.payment_method,
        payer_name=f"{parent.first_name} {parent.last_name}" if parent else None,
        payer_email=parent.email if parent else None,
        payer_phone=parent.phone if parent else None,
        students=students_receipts,
        created_at=payment.date_created.isoformat() if payment.date_created else None,
    )
