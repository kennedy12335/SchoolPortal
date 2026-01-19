from sqlalchemy import Column, Float, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class StudentFee(BaseModel):
    __tablename__ = "student_fee"

    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    fee_id = Column(String, ForeignKey("fee.id"), nullable=False)
    amount = Column(Float, nullable=False)
    discount_percentage = Column(Float, default=0.0)
    paid = Column(Boolean, default=False, nullable=False)
    payment_reference = Column(String, nullable=True)
    due_date = Column(String, nullable=True)

    # Relationships
    fee = relationship("Fee", back_populates="student_fees")
    student = relationship("Student", back_populates="student_fees")
