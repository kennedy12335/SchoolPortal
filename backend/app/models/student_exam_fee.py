from sqlalchemy import Column, Float, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class StudentExamFee(BaseModel):
    __tablename__ = "student_exam_fee"

    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    exam_fee_id = Column(String, ForeignKey("exam_fees.id"), nullable=False)
    amount = Column(Float, nullable=False)
    discount_percentage = Column(Float, default=0.0)
    paid = Column(Boolean, default=False, nullable=False)
    payment_reference = Column(String, nullable=True)
    due_date = Column(String, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="student_exam_fees")
    exam_fee = relationship("ExamFees", back_populates="student_exam_fees")
    exam_payments = relationship("ExamPayment", back_populates="student_exam_fee", cascade="all, delete-orphan")
