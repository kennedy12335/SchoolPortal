import logging
import os
from uuid import uuid4
import requests
from typing import Any, List, Dict, Optional, Union
from ..models.student_exam_fee import StudentExamFee
from sqlalchemy.orm import Session
from ..models.payment import Payment, PaymentStatus, ExamPayment
from ..models.student import Student
from ..models.fees import ExamFees
from ..models.parent import Parent
from ..models.fee import Fee
from ..models.student_fee import StudentFee
from fastapi import HTTPException
from dotenv import load_dotenv

# Import schemas from centralized location
from ..schemas.payment import (
    PaymentType,
    SchoolFeesPaymentData,
    ExamPaymentDetails,
    ExamFeesPaymentData,
    PaymentInitializationResult
)

load_dotenv()

logger = logging.getLogger(__name__)

PAYSTACK_INITIALIZE_URL = "https://api.paystack.co/transaction/initialize"
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")

def initialize_payment(
    payment_type: PaymentType,
    payment_data: Union[SchoolFeesPaymentData, ExamFeesPaymentData],
    db: Session
) -> PaymentInitializationResult:
    """
    Centralized payment initialization for both school fees and exam fees
    """
    logger.info(f"Initializing {payment_type.value} payment")
    logger.debug(f"Payment amount: {payment_data.amount}, Payment method: {payment_data.payment_method}")

    # Fetch parent information from database
    parent = db.query(Parent).filter(Parent.id == payment_data.parent_id).first()
    if not parent:
        logger.error(f"Parent with ID {payment_data.parent_id} not found")
        raise HTTPException(status_code=404, detail=f"Parent with ID {payment_data.parent_id} not found")

    logger.debug(f"Parent info: {parent.first_name} {parent.last_name} ({parent.email})")

    try:
        headers = {
            "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json"
        }

        # Convert amount to kobo
        total_amount_kobo = int(payment_data.amount * 100)
        logger.debug(f"Converted amount to kobo: {total_amount_kobo}")

        # Prepare metadata based on payment type
        metadata = {
            "payment_type": payment_type.value,
            "parent_id": payment_data.parent_id
        }
        
        logger.info(f"Processing {payment_type.value} specific logic")
        
        if payment_type == PaymentType.SCHOOL_FEES:
            logger.info("Processing school fees payment")
            school_data = payment_data
            metadata.update({
                "student_ids": school_data.student_ids
            })
            callback_url = os.getenv("school_fees_success_callback_url") or "schoolpayment://success"
            
        elif payment_type == PaymentType.EXAM_FEES:
            logger.info("Processing exam fees payment")
            exam_data = payment_data
            metadata.update({
                "student_id": exam_data.student_id,
                "exam_payments": [ep.model_dump() for ep in exam_data.exam_payments]
            })
            callback_url = os.getenv("exam_success_callback_url") or "schoolpayment://exam-success"
        
        # Prepare Paystack payload (no split code)
        payload = {
            "email": parent.email,
            "amount": total_amount_kobo,
            "metadata": metadata,
            "callback_url": callback_url
        }
        
        logger.info("Sending payment initialization request to Paystack")
        logger.debug(f"Paystack payload (excluding sensitive data): email={payload['email']}, amount={payload['amount']}")
        
        response = requests.post(PAYSTACK_INITIALIZE_URL, headers=headers, json=payload)
        
        if not response.ok:
            logger.error(f"Paystack initialization failed. Status: {response.status_code}, Response: {response.text}")
            raise HTTPException(status_code=400, detail="Failed to initialize payment")
        
        response_data = response.json()
        logger.info(f"Paystack payment initialized successfully")
        logger.debug(f"Paystack response status: {response_data.get('status', False)}")
        
        # Create payment records in database
        payment_reference = response_data["data"]["reference"]
        logger.info(f"Creating database records for payment reference: {payment_reference}")
        
        if payment_type == PaymentType.SCHOOL_FEES:
            _create_school_fees_records(payment_data, payment_reference, db)
        elif payment_type == PaymentType.EXAM_FEES:
            _create_exam_fees_records(payment_data, payment_reference, db)
        
        logger.info(f"Payment initialization completed successfully for {payment_type.value}")
        
        return PaymentInitializationResult(
            status=True,
            message="Payment initialized successfully",
            data=response_data
        )
        
    except HTTPException:
        logger.error(f"HTTPException occurred during {payment_type.value} payment initialization")
        raise
    except Exception as e:
        logger.error(f"Unexpected error initializing {payment_type.value} payment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _create_school_fees_records(payment_data: SchoolFeesPaymentData, payment_reference: str, db: Session):
    """Create database records for school fees payment"""
    logger.info(f"Creating school fees records for payment reference: {payment_reference}")
    logger.debug(f"Students: {payment_data.student_ids}, Amount: {payment_data.amount}, Parent ID: {payment_data.parent_id}")

    try:
        # Determine linked_student_fee_ids first to avoid creating a payment with an empty placeholder
        linked_student_fee_ids: List[str] = []
        # Use provided student_fee_ids if available, otherwise fetch base StudentFee rows for each student
        if payment_data.student_fee_ids:
            logger.debug(f"Using provided student_fee_ids: {payment_data.student_fee_ids}")
            linked_student_fee_ids = payment_data.student_fee_ids
        else:
            logger.debug("No student_fee_ids provided, fetching fee rows from DB dynamically")
            # Link all StudentFee rows for the provided student_ids in a single query
            sf_ids_rows = db.query(StudentFee.id).filter(
                StudentFee.student_id.in_(payment_data.student_ids)
            ).all()
            linked_student_fee_ids = [sf_id for (sf_id,) in sf_ids_rows]

        # Create payment record with the computed student_fee_ids
        logger.debug("Creating main payment record with linked student_fee_ids")
        db_payment = Payment(
            student_ids=payment_data.student_ids,
            amount=payment_data.amount,
            payment_method=None,
            description=payment_data.description,
            payment_reference=payment_reference,
            payer_id=payment_data.parent_id,
            student_fee_ids=linked_student_fee_ids,
            status=PaymentStatus.PENDING
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)

        logger.info(f"Payment record created with ID: {db_payment.id}, linked to parent: {payment_data.parent_id}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating school fees records for payment {payment_reference}: {e}")
        raise

def _create_exam_fees_records(payment_data: ExamFeesPaymentData, payment_reference: str, db: Session):
    """Create exam payment records for each exam in the payment data.

    This function expects a typed `ExamFeesPaymentData` object for type safety.
    """
    try:
        # Use the typed schema directly
        exam_payments = [
            {
                "student_id": payment_data.student_id,
                "exam_id": ep.exam_id,
                "amount": ep.amount_paid
            }
            for ep in payment_data.exam_payments
        ]
        payer_id = payment_data.parent_id
        
        for exam_payment in exam_payments:
            exam_id = exam_payment["exam_id"]
            student_id = exam_payment["student_id"]
            amount = exam_payment["amount"]
            
            # Get or create StudentExamFee record
            student_exam_fee = db.query(StudentExamFee).filter_by(
                student_id=student_id,
                exam_fee_id=exam_id
            ).first()
            
            if not student_exam_fee:
                # Create StudentExamFee if it doesn't exist
                exam_fee = db.query(ExamFees).filter_by(id=exam_id).first()
                if not exam_fee:
                        logger.error(f"Exam fee not found: {exam_id}")
                        # Surface the error to the caller so the entire payment fails
                        # and the transaction rolls back, avoiding partial records.
                        raise HTTPException(status_code=404, detail=f"Exam fee not found: {exam_id}")
                    
                student_exam_fee = StudentExamFee(
                    id=str(uuid4()),
                    student_id=student_id,
                    exam_fee_id=exam_id,
                    amount=amount,
                    payment_reference=payment_reference,
                    paid=False
                )
                db.add(student_exam_fee)
                db.flush()
            else:
                # Update existing StudentExamFee
                student_exam_fee.payment_reference = payment_reference
                db.flush()
            
            # Create ExamPayment record
            db_exam_payment = ExamPayment(
                id=str(uuid4()),
                student_exam_fee_id=student_exam_fee.id,
                amount_paid=amount,
                status=PaymentStatus.PENDING,
                payment_reference=payment_reference,
                payer_id=payer_id
            )
            db.add(db_exam_payment)
        
        db.commit()
        logger.info(f"Created exam fees records for payment {payment_reference}")
    except Exception as e:
        logger.error(f"Error creating exam fees records for payment {payment_reference}: {str(e)}")
        db.rollback()
        raise