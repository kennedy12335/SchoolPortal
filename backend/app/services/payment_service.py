import logging
import os
import requests
from typing import List, Dict, Optional, Union
from sqlalchemy.orm import Session
from ..models.payment import Payment, PaymentStatus, ExamPayment
from ..models.student import Student
from ..models.club import ClubMembership
from ..models.fees import ExamFees
from ..models.parent import Parent
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
PAYSTACK_SPLIT_URL = "https://api.paystack.co/split"
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")

def _initialize_split_payment_kobo(split_config: List[Dict]) -> Dict:
    """Initialize split payment with Paystack"""
    logger.info(f"Initializing split payment with {len(split_config)} subaccounts")
    logger.debug(f"Split configuration: {split_config}")
    
    headers = {
        "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "name": f"Payment Split - {len(split_config)} accounts",
        "type": "flat",
        "currency": "NGN",
        "bearer_type": "all",  # Main account bears the transaction fee
        "subaccounts": split_config
    }
    
    logger.info(f"Sending request to Paystack split API")
    logger.debug(f"Split payload: {payload}")
    
    try:
        response = requests.post(PAYSTACK_SPLIT_URL, headers=headers, json=payload)
        response_data = response.json()
        
        if response.ok and response_data.get("status", False):
            logger.info(f"Split payment initialized successfully. Split code: {response_data.get('data', {}).get('split_code', 'N/A')}")
        else:
            logger.error(f"Split payment initialization failed. Status: {response.status_code}, Response: {response_data}")
            
        return response_data
    except Exception as e:
        logger.error(f"Exception occurred during split payment initialization: {e}")
        return {"status": False, "message": f"Request failed: {str(e)}"}

def _create_school_fees_split(tuition_share_kobo: int, club_share_kobo: int) -> List[Dict]:
    """Create split configuration for school fees (tuition + clubs)"""
    logger.info(f"Creating school fees split - Tuition: {tuition_share_kobo} kobo, Club: {club_share_kobo} kobo")
    
    tuition_account = os.getenv("tuition_account")
    club_account = os.getenv("club_account")
    
    logger.debug(f"Tuition account: {tuition_account}, Club account: {club_account}")
    
    if not tuition_account or not club_account:
        logger.error("Missing subaccount configuration - tuition_account or club_account not set")
        raise HTTPException(status_code=500, detail="Tuition or club subaccount not configured")
    
    split_config = [
        {
            "subaccount": tuition_account,
            "share": tuition_share_kobo
        },
        {
            "subaccount": club_account,
            "share": club_share_kobo
        }
    ]
    
    logger.info(f"School fees split configuration created successfully with {len(split_config)} accounts")
    logger.debug(f"Split configuration: {split_config}")
    
    return split_config

def _create_exam_fees_split(exam_shares: List[Dict]) -> List[Dict]:
    """Create split configuration for exam fees (hardcoded for 4 specific exams)"""
    logger.info(f"Creating exam fees split for {len(exam_shares)} exam shares")
    logger.debug(f"Exam shares input: {exam_shares}")
    
    # Hardcoded exam account mapping
    exam_account_mapping = {
        "exam": os.getenv("exam_account"), 
        "sat": os.getenv("sat_account"),
    }
    
    logger.debug(f"Exam account mapping: {exam_account_mapping}")
    
    # Dictionary to consolidate amounts by account
    account_totals = {}
    
    for i, exam_share in enumerate(exam_shares):
        exam_name = exam_share['exam_name'].lower()
        logger.debug(f"Processing exam share {i+1}/{len(exam_shares)}: {exam_name}")
        
        exam_account = None
        # Determine which account to use based on exam name
        if "igcse" in exam_name:
            exam_account = exam_account_mapping["exam"]
            logger.debug(f"Exam '{exam_name}' mapped to IGCSE account: {exam_account}")
        elif "checkpoint" in exam_name:
            exam_account = exam_account_mapping["exam"]
            logger.debug(f"Exam '{exam_name}' mapped to Checkpoint account: {exam_account}")
        elif "sat" in exam_name:
            exam_account = exam_account_mapping["sat"]
            logger.debug(f"Exam '{exam_name}' mapped to SAT account: {exam_account}")
        elif "ielts" in exam_name:
            exam_account = exam_account_mapping["sat"]
            logger.debug(f"Exam '{exam_name}' mapped to IELTS account: {exam_account}")
        
        # Fallback to default exam account if specific account not found
        if not exam_account:
            exam_account = os.getenv("exam_account")
            logger.warning(f"No specific account found for exam '{exam_name}', using default exam account: {exam_account}")
            if not exam_account:
                logger.error(f"No subaccount configured for exam: {exam_share['exam_name']}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"No subaccount configured for exam: {exam_share['exam_name']}"
                )
        
        # Add to account totals (consolidate amounts for same account)
        share_amount = exam_share["share_kobo"]
        if exam_account in account_totals:
            old_total = account_totals[exam_account]
            account_totals[exam_account] += share_amount
            logger.debug(f"Consolidated {share_amount} kobo to existing account {exam_account}: {old_total} -> {account_totals[exam_account]}")
        else:
            account_totals[exam_account] = share_amount
            logger.debug(f"Added new account {exam_account} with {share_amount} kobo")
    
    # Convert consolidated totals to split config
    split_config = []
    for account, total_share in account_totals.items():
        split_config.append({
            "subaccount": account,
            "share": total_share
        })
        logger.debug(f"Final split entry: {account} -> {total_share} kobo")

    logger.info(f"Exam fees split configuration created successfully with {len(split_config)} unique accounts")
    logger.debug(f"Final split config: {split_config}")
    
    return split_config

def process_exam_fees_split(
    exam_data: ExamFeesPaymentData,
    net_amount_kobo: int,
    metadata: dict,
    db: Session
):
    """
    Handles the exam fees splitting logic and returns split_code, updated metadata, and callback_url.
    """
    logger.info(f"Processing exam fees split for student {exam_data.student_id} with {len(exam_data.exam_payments)} exam payments")
    logger.debug(f"Net amount: {net_amount_kobo} kobo, Total amount: {exam_data.amount}")
    
    # Create splits based on the actual payment amounts (let Paystack handle fees)
    exam_shares = []
    
    for i, ep in enumerate(exam_data.exam_payments):
        logger.debug(f"Processing exam payment {i+1}/{len(exam_data.exam_payments)}: Exam ID {ep.exam_id}, Amount: {ep.amount_paid}")
        
        # Fetch exam name from database
        exam_fees = db.query(ExamFees).filter(ExamFees.id == ep.exam_id).first()
        if not exam_fees:
            logger.error(f"Exam with ID {ep.exam_id} not found in database")
            raise HTTPException(status_code=404, detail=f"Exam with ID {ep.exam_id} not found")
        
        logger.debug(f"Found exam: {exam_fees.exam_name} (ID: {ep.exam_id})")
        
        # Use the actual payment amount in kobo (no fee calculations)
        exam_share_kobo = int(ep.amount_paid * 100)
        logger.debug(f"Exam share for {exam_fees.exam_name}: {exam_share_kobo} kobo")
        
        exam_shares.append({
            "exam_id": ep.exam_id,
            "exam_name": exam_fees.exam_name,
            "share_kobo": exam_share_kobo,
        })

    logger.info(f"Created {len(exam_shares)} exam shares for splitting")
    split_config = _create_exam_fees_split(exam_shares)
    
    logger.info("Initializing split payment with Paystack")
    split_response = _initialize_split_payment_kobo(split_config)

    if not split_response.get("status", False):
        error_message = split_response.get("message", "Failed to initialize split payment")
        logger.error(f"Exam fees split initialization failed: {error_message}")
        raise HTTPException(status_code=400, detail=f"Paystack split error: {error_message}")

    split_code = split_response["data"]["split_code"]
    logger.info(f"Exam fees split initialized successfully with split code: {split_code}")

    # Add exam fees specific metadata
    exam_shares_metadata = [
        {
            "exam_id": share["exam_id"],
            "share_naira": round(share["share_kobo"] / 100, 2)
        }
        for share in exam_shares
    ]
    
    metadata.update({
        "student_id": exam_data.student_id,
        "exam_payments": [ep.model_dump() for ep in exam_data.exam_payments],
        "exam_shares": exam_shares_metadata
    })
    
    logger.debug(f"Updated metadata with exam-specific information")

    callback_url = os.getenv("exam_success_callback_url")
    logger.info(f"Exam fees split processing completed. Callback URL: {callback_url}")
    
    return split_code, metadata, callback_url

def process_school_fees_split(
    school_data: SchoolFeesPaymentData,
    total_amount_kobo: int,
    metadata: dict
):
    """
    Handles the school fees splitting logic and returns split_code, updated metadata, and callback_url.
    """
    logger.info(f"Processing school fees split for {len(school_data.student_ids)} students")
    logger.debug(f"Total amount: {total_amount_kobo} kobo, School amount: {school_data.amount}, Club amount: {school_data.club_amount}")
    
    # School fees splitting logic
    gross_tuition_amount = school_data.amount - school_data.club_amount
    logger.debug(f"Calculated gross tuition amount: {gross_tuition_amount} (Total: {school_data.amount} - Club: {school_data.club_amount})")
    
    # Use raw amounts in kobo for splits
    tuition_share_kobo = int(gross_tuition_amount * 100)
    club_share_kobo = int(school_data.club_amount * 100)
    
    logger.info(f"Split amounts - Tuition: {tuition_share_kobo} kobo, Club: {club_share_kobo} kobo")
    
    split_config = _create_school_fees_split(tuition_share_kobo, club_share_kobo)
    
    logger.info("Initializing school fees split payment with Paystack")
    split_response = _initialize_split_payment_kobo(split_config)
    
    if not split_response.get("status", False):
        error_message = split_response.get("message", "Failed to initialize split payment")
        logger.error(f"School fees split initialization failed: {error_message}")
        raise HTTPException(status_code=400, detail=f"Paystack split error: {error_message}")
    
    split_code = split_response["data"]["split_code"]
    logger.info(f"School fees split initialized successfully with split code: {split_code}")
    
    # Add school fees specific metadata
    student_clubs_metadata = {
        str(student_id): school_data.student_club_ids.get(str(student_id), [])
        for student_id in school_data.student_ids
    }
    
    metadata.update({
        "student_ids": school_data.student_ids,
        "student_clubs": student_clubs_metadata,
        "tuition_share_naira": round(tuition_share_kobo / 100, 2),
        "club_share_naira": round(club_share_kobo / 100, 2)
    })
    
    logger.debug(f"Updated metadata with school fees information for students: {school_data.student_ids}")
    
    callback_url = os.getenv("school_fees_success_callback_url")
    logger.info(f"School fees split processing completed. Callback URL: {callback_url}")
    
    return split_code, metadata, callback_url

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

        # Prepare split configuration based on payment type
        split_code = None
        metadata = {
            "payment_type": payment_type.value,
            "parent_id": payment_data.parent_id
        }
        
        logger.info(f"Processing {payment_type.value} specific logic")
        
        if payment_type == PaymentType.SCHOOL_FEES:
            logger.info("Processing school fees payment")
            school_data = payment_data
            split_code, metadata, callback_url = process_school_fees_split(
                school_data, total_amount_kobo, metadata
            )
            
        elif payment_type == PaymentType.EXAM_FEES:
            logger.info("Processing exam fees payment")
            # For exam fees, let Paystack handle fee distribution automatically
            split_code, metadata, callback_url = process_exam_fees_split(
                payment_data, total_amount_kobo, metadata, db
            )
        
        # Prepare Paystack payload
        payload = {
            "email": parent.email,
            "amount": total_amount_kobo,
            "metadata": metadata,
            "callback_url": callback_url
        }
        
        # Add split code if we have splits
        if split_code:
            payload["split_code"] = split_code
            logger.info(f"Added split code to payload: {split_code}")
        else:
            logger.warning("No split code generated - payment will go to main account")
        
        logger.info("Sending payment initialization request to Paystack")
        logger.debug(f"Paystack payload (excluding sensitive data): email={payload['email']}, amount={payload['amount']}, has_split={bool(split_code)}")
        
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
        # Create payment record
        logger.debug("Creating main payment record")
        db_payment = Payment(
            student_ids=payment_data.student_ids,
            amount=payment_data.amount,
            payment_method=None,
            description=payment_data.description,
            payment_reference=payment_reference,
            payer_id=payment_data.parent_id,
            status=PaymentStatus.PENDING
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)

        logger.info(f"Payment record created with ID: {db_payment.id}, linked to parent: {payment_data.parent_id}")

        # Update student club memberships
        total_club_memberships = 0
        for student_id in payment_data.student_ids:
            logger.debug(f"Processing club memberships for student {student_id}")
            student = db.query(Student).filter(Student.id == student_id).first()
            if student:
                club_ids = payment_data.student_club_ids.get(str(student_id), [])
                logger.debug(f"Student {student_id} has {len(club_ids)} club memberships: {club_ids}")
                
                for club_id in club_ids:
                    club_membership = ClubMembership(
                        student_id=student_id,
                        club_id=club_id,
                        payment_confirmed=False  # Will be updated to True when payment is confirmed
                    )
                    db.add(club_membership)
                    total_club_memberships += 1
                    logger.debug(f"Created club membership: Student {student_id} -> Club {club_id}")
            else:
                logger.warning(f"Student with ID {student_id} not found in database")
        
        db.commit()
        logger.info(f"School fees payment record created successfully. Payment ID: {db_payment.id}, Total club memberships: {total_club_memberships}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating school fees records for payment {payment_reference}: {e}")
        raise

def _create_exam_fees_records(payment_data: ExamFeesPaymentData, payment_reference: str, db: Session):
    """Create database records for exam fees payment"""
    logger.info(f"Creating exam fees records for payment reference: {payment_reference}")
    logger.debug(f"Student: {payment_data.student_id}, Total amount: {payment_data.amount}, Exam payments: {len(payment_data.exam_payments)}, Parent ID: {payment_data.parent_id}")

    try:
        # Create exam payment records for each exam
        created_payments = []
        for i, exam_payment_detail in enumerate(payment_data.exam_payments):
            logger.debug(f"Creating exam payment record {i+1}/{len(payment_data.exam_payments)}: Exam {exam_payment_detail.exam_id}, Amount: {exam_payment_detail.amount_paid}")

            db_exam_payment = ExamPayment(
                exam_id=exam_payment_detail.exam_id,
                student_id=payment_data.student_id,
                amount_paid=exam_payment_detail.amount_paid,  # Use the specific amount for this exam
                payment_method=payment_data.payment_method,  # Use the payment method from payment_data
                payment_reference=payment_reference,
                payer_id=payment_data.parent_id,
                status=PaymentStatus.PENDING
            )
            db.add(db_exam_payment)
            db.commit()
            db.refresh(db_exam_payment)

            created_payments.append(db_exam_payment.id)
            logger.info(f"Exam payment record created with ID: {db_exam_payment.id} for exam {exam_payment_detail.exam_id}, linked to parent: {payment_data.parent_id}")

        logger.info(f"Exam fees records created successfully. Payment reference: {payment_reference}, Created {len(created_payments)} exam payment records: {created_payments}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating exam fees records for payment {payment_reference}: {e}")
        raise 