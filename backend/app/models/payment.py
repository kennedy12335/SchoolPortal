from sqlalchemy import Column, String, Integer, Float, ForeignKey, Enum, JSON, Boolean, DateTime
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel
from datetime import datetime

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentType(enum.Enum):
    SCHOOL_FEES = "school_fees"
    POCKET_MONEY = "pocket_money"

class Payment(BaseModel):
    __tablename__ = "payments"

    student_ids = Column(JSON, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_reference = Column(String, unique=True)
    payment_method = Column(String)
    description = Column(String)
    # payment_type = Column(Enum(PaymentType))

    payer_id = Column(String, ForeignKey("parents.id"))
    payer = relationship("Parent", back_populates="payment")
    
    date_created = Column(DateTime, default=datetime.now)
    date_updated = Column(DateTime, default=datetime.now)


class ExamPayment(BaseModel):
    __tablename__ = "exam_payments"

    exam_id = Column(String, ForeignKey("exam_fees.id"))
    exam = relationship("ExamFees", back_populates="exam_payment")

    student_id = Column(String, ForeignKey("students.id"))
    student = relationship("Student", back_populates="exam_payment")

    amount_paid = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_reference = Column(String)
    payment_method = Column(String)
    
    payer_id = Column(String, ForeignKey("parents.id"))
    payer = relationship("Parent", back_populates="exam_payment")

    date_created = Column(DateTime, default=datetime.now)
    date_updated = Column(DateTime, default=datetime.now)

class StudentExamPaymentStatus(BaseModel):
    __tablename__ = "student_exam_payment_status"

    student_id = Column(String, ForeignKey("students.id"))
    student = relationship("Student", back_populates="student_exam_payment_status")

    exam_id = Column(String, ForeignKey("exam_fees.id"))
    exam_fee = relationship("ExamFees", back_populates="student_exam_payment_status")

    amount_due = Column(Float, nullable=False)
    is_fully_paid = Column(Boolean, default=False)
    
    