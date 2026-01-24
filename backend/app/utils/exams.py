from typing import List

from ..models.student import Student
from ..models.fees import ExamFees
from ..models.payment import ExamPayment, Payment, PaymentItem, PaymentStatus, PaymentType
from ..models.student_exam_fee import StudentExamFee
from ..models.classes import YearGroup
from sqlalchemy.orm import Session
import logging

def should_include_exam(student: Student, exam: ExamFees, db: Session) -> bool:
    """
    Check if an exam should be included for a given student based on their year group
    and the exam's applicable grades.
    """
    if not student.year_group:
        return False

    # Get applicable grades for this exam from the JSON column
    applicable_grades = exam.applicable_grades

    # If no applicable grades are configured, exclude the exam
    if not applicable_grades:
        return False

    # Check if student's year group is in the applicable grades
    return student.year_group.name in applicable_grades

async def update_exam_payment_records(db: Session, exam_payments: List[ExamPayment], logger: logging.Logger ) -> None:
    try:
        logger.info(f"Updating exam payment records for exam payment: {exam_payments}")
        for exam_payment in exam_payments:
            exam_payment.status = PaymentStatus.COMPLETED
            
            # Mark the corresponding StudentExamFee as paid
            student_exam_fee = db.query(StudentExamFee).filter(StudentExamFee.id == exam_payment.student_exam_fee_id).first()
            if student_exam_fee:
                student_exam_fee.paid = True
                student_exam_fee.payment_reference = exam_payment.payment_reference
                logger.info(f"Marked StudentExamFee {student_exam_fee.id} as paid")
            else:
                logger.warning(f"StudentExamFee not found for exam payment {exam_payment.id}")
        
        db.commit()
        logger.info(f"Exam payment records updated successfully")
    except Exception as e:
        logger.error(f"Error updating exam payment records: {e}")
        db.rollback()
        raise

def _ensure_payment_items_for_confirmed_payment(
    db: Session,
    payment: Payment,
    logger: logging.Logger,
    metadata: dict | None = None,
) -> None:
    """Create aggregated PaymentItem rows (school fees + clubs) for a completed payment.

    Uses Paystack metadata when available (tuition_share_naira / club_share_naira).
    Idempotent: won't create duplicates for the same payment/type.
    """

    # Prefer Paystack-provided split amounts
    tuition_amount = None
    club_amount = None
    if metadata and isinstance(metadata, dict):
        tuition_amount = metadata.get("tuition_share_naira")
        club_amount = metadata.get("club_share_naira")

    try:
        school_fees_amount = float(tuition_amount) if tuition_amount is not None else float(payment.amount)
    except (TypeError, ValueError):
        school_fees_amount = float(payment.amount)

    try:
        club_fees_amount = float(club_amount) if club_amount is not None else 0.0
    except (TypeError, ValueError):
        club_fees_amount = 0.0

    # Guard against negative amounts
    if school_fees_amount < 0:
        logger.warning("Computed school fees amount < 0; falling back to payment.amount")
        school_fees_amount = float(payment.amount)
    if club_fees_amount < 0:
        logger.warning("Computed club amount < 0; forcing to 0")
        club_fees_amount = 0.0

    # Avoid duplicates
    existing_types = {
        t for (t,) in db.query(PaymentItem.item_type)
        .filter(PaymentItem.payment_id == payment.id)
        .all()
    }

    if PaymentType.SCHOOL_FEES not in existing_types:
        db.add(
            PaymentItem(
                payment_id=payment.id,
                item_type=PaymentType.SCHOOL_FEES,
                amount=school_fees_amount,
            )
        )

    if club_fees_amount > 0 and PaymentType.CLUB_FEES not in existing_types:
        db.add(
            PaymentItem(
                payment_id=payment.id,
                item_type=PaymentType.CLUB_FEES,
                amount=club_fees_amount,
            )
        )


async def update_payment_records(
    db: Session,
    payment: Payment,
    student_ids: List[int],
    logger: logging.Logger,
    metadata: dict | None = None,
) -> None:
    """Update payment status and related records in the database."""
    try:
        logger.info(f"Updating payment records for payment ID: {payment.id}")
        
        # Update payment status
        payment.status = PaymentStatus.COMPLETED
        logger.info(f"Payment status updated to COMPLETED")

        # Create aggregated payment items for analytics (school fees + clubs)
        _ensure_payment_items_for_confirmed_payment(db, payment, logger, metadata)
        # Determine which club memberships to confirm (if metadata includes club selection)
        student_clubs_map = None
        if metadata and isinstance(metadata, dict):
            student_clubs_map = metadata.get("student_clubs")

        # If payment has explicit student_fee_ids, mark those StudentFee rows as paid
        if payment.student_fee_ids:
            logger.info("Marking linked StudentFee rows as paid")
            from ..models.student_fee import StudentFee
            linked_student_ids = set()
            for sf_id in payment.student_fee_ids:
                sf = db.query(StudentFee).filter(StudentFee.id == sf_id).first()
                if sf:
                    sf.paid = True
                    sf.payment_reference = payment.payment_reference
                    linked_student_ids.add(sf.student_id)
            logger.info(f"Marked {len(payment.student_fee_ids)} StudentFee records as paid")

            # Update club memberships and student status for linked students
            for student_id in linked_student_ids:
                logger.info(f"Processing updates for student ID: {student_id}")

                if student_clubs_map and isinstance(student_clubs_map, dict):
                    club_ids = student_clubs_map.get(str(student_id), []) or []
                    if club_ids:
                        club_memberships = db.query(ClubMembership).filter(
                            ClubMembership.student_id == student_id,
                            ClubMembership.club_id.in_(club_ids),
                        ).all()
                    else:
                        club_memberships = []
                else:
                    club_memberships = db.query(ClubMembership).filter(
                        ClubMembership.student_id == student_id
                    ).all()

                for club_membership in club_memberships:
                    club_membership.payment_confirmed = True
                    club_membership.status = "active"
                logger.info(f"Updated {len(club_memberships)} club memberships for student")
                student = db.query(Student).filter(Student.id == student_id).first()
                if student:
                    student.school_fees_paid = True
                    logger.info(f"Updated school fees status for student")
        else:
            # Update club memberships and student status (backwards-compatible)
            for student_id in student_ids:
                logger.info(f"Processing updates for student ID: {student_id}")
                
                # Update club memberships
                if student_clubs_map and isinstance(student_clubs_map, dict):
                    club_ids = student_clubs_map.get(str(student_id), []) or []
                    if club_ids:
                        club_memberships = db.query(ClubMembership).filter(
                            ClubMembership.student_id == student_id,
                            ClubMembership.club_id.in_(club_ids),
                        ).all()
                    else:
                        club_memberships = []
                else:
                    club_memberships = db.query(ClubMembership).filter(
                        ClubMembership.student_id == student_id
                    ).all()
                for club_membership in club_memberships:
                    club_membership.payment_confirmed = True
                    club_membership.status = "active"
                logger.info(f"Updated {len(club_memberships)} club memberships for student")
                
                # Update student payment status
                student = db.query(Student).filter(Student.id == student_id).first()
                if student:
                    student.school_fees_paid = True
                    logger.info(f"Updated school fees status for student")
        
        db.commit()
        logger.info("Successfully committed all database updates")
    except Exception as e:
        logger.error(f"Error updating payment records: {str(e)}")
        db.rollback()
        raise