from typing import List

from fastapi import HTTPException
from ..models.club import ClubMembership
from ..models.student import Student
from ..models.fees import ExamFees
from ..models.payment import ExamPayment, Payment, PaymentStatus, StudentExamPaymentStatus
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
        db.commit()
        logger.info(f"Exam payment records updated successfully")

        for exam_payment in exam_payments:
            logger.info(f"Updating student exam payment status for student: {exam_payment.student_id} and exam: {exam_payment.exam_id}")
            student_exam_payment_status = db.query(StudentExamPaymentStatus).filter(StudentExamPaymentStatus.student_id == exam_payment.student_id, StudentExamPaymentStatus.exam_id == exam_payment.exam_id).first()
            if student_exam_payment_status is None:
                raise HTTPException(status_code=404, detail="Student exam payment status not found")
            logger.info(f"Student exam payment status found: {student_exam_payment_status}")
            if exam_payment.amount_paid >= student_exam_payment_status.amount_due:
                logger.info(f"Student exam payment status is fully paid")
                student_exam_payment_status.is_fully_paid = True
                student_exam_payment_status.amount_due = 0
            else:
                logger.info(f"Student exam payment status is not fully paid")
                student_exam_payment_status.amount_due -= exam_payment.amount_paid
                if student_exam_payment_status.amount_due <= 0:
                    student_exam_payment_status.is_fully_paid = True
                    student_exam_payment_status.amount_due = 0
                    logger.info(f"Student exam payment status is now fully paid")
                logger.info(f"Updated student exam payment status: {student_exam_payment_status}")
            db.commit()
    except Exception as e:
        logger.error(f"Error updating exam payment records: {e}")
        db.rollback()
        raise

async def update_payment_records(db: Session, payment: Payment, student_ids: List[int], logger: logging.Logger) -> None:
    """Update payment status and related records in the database."""
    try:
        logger.info(f"Updating payment records for payment ID: {payment.id}")
        
        # Update payment status
        payment.status = PaymentStatus.COMPLETED
        logger.info(f"Payment status updated to COMPLETED")
        
        # Update club memberships and student status
        for student_id in student_ids:
            logger.info(f"Processing updates for student ID: {student_id}")
            
            # Update club memberships
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