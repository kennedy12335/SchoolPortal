import logging
import os
import asyncio
import time
from tkinter import N

import requests
from ..models.payment import ExamPayment, PaymentStatus, StudentExamPaymentStatus
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..routers.payment import PAYSTACK_INITIALIZE_URL, verify_payment
from ..database import get_db
from dotenv import load_dotenv
from ..models.fees import ExamFees
from datetime import datetime
from ..models.student import Student
from ..models.classes import YearGroup

# Import the centralized payment service and schemas
from ..services.payment_service import (
    initialize_payment,
    PaymentType,
    ExamFeesPaymentData
)
from ..schemas.payment import (
    ExamPaymentDetails
)

load_dotenv()

router = APIRouter()

logger = logging.getLogger(__name__)


class ExamCreate(BaseModel):
    exam_name: str
    amount: float
    extra_fees: float = 0
    allows_installments: bool = False
    applicable_grades: list[str] | None = None  # List of YearGroup enum names e.g. ["YEAR_10", "YEAR_11", "YEAR_12"]

class ExamUpdate(BaseModel):
    id: str
    exam_name: str
    amount: float
    extra_fees: float = 0
    allows_installments: bool = False
    applicable_grades: list[str] | None = None

class ExamResponse(BaseModel):
    id: str
    exam_name: str
    amount: float
    extra_fees: float | None = None
    allows_installments: bool = False
    applicable_grades: list[str] | None = None  # List of YearGroup enum names

class StudentExamPaymentStatusCreate(BaseModel):
    student_id: str
    exam_id: str

class ExamPaymentStatusResponse(BaseModel):
    exam_id: str
    exam_name: str
    exam_price: float
    extra_fees: float | None = None
    amount_paid: float
    amount_due: float
    is_fully_paid: bool

class StudentExamPaymentStatusResponse(BaseModel):
    id: str | None = None
    year_group: str | None = None
    class_name: str | None = None
    student_id: str
    exam_list: List[ExamPaymentStatusResponse] | None = None

class ExamPaymentCreate(BaseModel):
    exam_payments: List[ExamPaymentDetails]
    student_id: str
    amount: float
    payment_method: str
    parent_id: str   

class ExamPaymentResponse(BaseModel):
    id: str
    amount_paid: float
    payment_reference: str | None = None
    


@router.post("/create-exam", response_model=ExamResponse)
def create_exam(exam: ExamCreate, db: Session = Depends(get_db)):
    try:
        new_exam = ExamFees(
            exam_name=exam.exam_name,
            amount=exam.amount,
            extra_fees=exam.extra_fees,
            allows_installments=exam.allows_installments,
            applicable_grades=exam.applicable_grades,
        )
        db.add(new_exam)
        db.commit()
        db.refresh(new_exam)
        return new_exam
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating exam: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/update-exam", response_model=ExamResponse)
def update_exam(exam_data: ExamUpdate, db: Session = Depends(get_db)):
    try:
        exam = db.query(ExamFees).filter(ExamFees.id == exam_data.id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        exam.exam_name = exam_data.exam_name
        exam.amount = exam_data.amount
        exam.extra_fees = exam_data.extra_fees
        exam.allows_installments = exam_data.allows_installments
        exam.applicable_grades = exam_data.applicable_grades
        db.commit()
        db.refresh(exam)
        return exam
    except Exception as e:
        logger.error(f"Error updating exam: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/get-all-exams", response_model=List[ExamResponse])
def get_all_exams(db: Session = Depends(get_db)):
    try:
        exams = db.query(ExamFees).all()
        return exams
    except Exception as e:
        logger.error(f"Error getting all exams: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/get-exam-by-id", response_model=ExamResponse)
def get_exam_by_id(exam_id: str, db: Session = Depends(get_db)):
    try:
        exam = db.query(ExamFees).filter(ExamFees.id == exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        return exam
    except Exception as e:
        logger.error(f"Error getting exam by id: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-exam/{exam_id}")
def delete_exam(exam_id: str, db: Session = Depends(get_db)):
    try:
        exam = db.query(ExamFees).filter(ExamFees.id == exam_id).first()
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        db.delete(exam)
        db.commit()
        return {"message": "Exam deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting exam: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/pay-for-exam", response_model=dict)
def pay_for_exam(exam_payment_obj: ExamPaymentCreate, db: Session = Depends(get_db)):
    logger.info(f"Initializing payment for exams: {exam_payment_obj.exam_payments} for student: {exam_payment_obj.student_id}")

    try:
        # Prepare payment data for the centralized service
        payment_data = ExamFeesPaymentData(
            exam_payments=exam_payment_obj.exam_payments,
            student_id=exam_payment_obj.student_id,
            amount=exam_payment_obj.amount,
            payment_method="online",
            parent_id=exam_payment_obj.parent_id
        )
        
        # Use the centralized payment service
        result = initialize_payment(
            payment_type=PaymentType.EXAM_FEES,
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
        logger.error(f"Error paying for exam: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/verify/{payment_reference}")
async def verify_payment_status(payment_reference: str, db: Session = Depends(get_db)):
    logger.info(f"Verifying payment status for payment reference: {payment_reference}")
    
    try:
        exam_payments = db.query(ExamPayment).filter(ExamPayment.payment_reference == payment_reference).all()
        if not exam_payments:
            raise HTTPException(status_code=404, detail="No exam payment found")
        
        # Check if all payments are completed
        for exam_payment in exam_payments:
            if exam_payment.status != PaymentStatus.COMPLETED:
                return {"status": exam_payment.status.value}
        
        return {"status": "completed"}
        
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-student-exam-list", response_model=StudentExamPaymentStatusResponse)
def get_student_exam_list(student_id: str, db: Session = Depends(get_db)):
    logger.info(f"Getting student exam list for student: {student_id}")
    student_exam_list = db.query(StudentExamPaymentStatus).filter(StudentExamPaymentStatus.student_id == student_id).all()
    if len(student_exam_list) == 0:
        logger.info(f"Student exam list is empty")
        return StudentExamPaymentStatusResponse(
        id=None,
        year_group=None,
        class_name=None,
        student_id=student_id,
        exam_list=[]
    ) 
    
    logger.info(f"Student exam list: {student_exam_list}")
    student = db.query(Student).filter(Student.id == student_id).first()
    logger.info(f"Student: {student}")

    exam_list = []
    for exam in student_exam_list:
        exam_fees = db.query(ExamFees).filter(ExamFees.id == exam.exam_id).first()
        if exam_fees is None:
            raise HTTPException(status_code=404, detail="Exam fees not found")
        logger.info(f"Exam fees: {exam_fees}")
        exam_list.append(ExamPaymentStatusResponse(
            exam_id=exam.exam_id,
            exam_name=exam_fees.exam_name,
            exam_price=exam_fees.amount,
            extra_fees=exam_fees.extra_fees,
            amount_paid=exam_fees.amount-exam.amount_due,
            amount_due=exam.amount_due,
            is_fully_paid=exam.is_fully_paid))
        logger.info(f"Exam list: {exam_list}")
        
    return StudentExamPaymentStatusResponse(
        id=student_exam_list[0].id,
        year_group=student.year_group.value if student.year_group else None,
        class_name=student.class_name.value if student.class_name else None,
        student_id=student_exam_list[0].student_id,
        exam_list=exam_list
    )


        
        
        