from sqlalchemy import Column, Float, String, Boolean, JSON
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from app.models.base import BaseModel

class Fees(BaseModel):
    __tablename__ = "fees"

    tuition = Column(Float, nullable=False)
    boarding = Column(Float, nullable=False)
    utility = Column(Float, nullable=False)
    prize_giving_day = Column(Float, nullable=False)
    year_book = Column(Float, nullable=False)
    offering_and_hairs = Column(Float, nullable=False)
    
    @hybrid_property
    def total(self) -> float:
        return (
            self.tuition +
            self.boarding +
            self.utility +
            self.prize_giving_day +
            self.year_book +
            self.offering_and_hairs
        )

class ExamFees(BaseModel):
    __tablename__ = "exam_fees"

    exam_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    extra_fees = Column(Float, nullable=True)
    allows_installments = Column(Boolean, default=False, nullable=False)
    applicable_grades = Column(JSON, nullable=True)  # Stores list of YearGroup names, e.g. ["YEAR_10", "YEAR_11", "YEAR_12"]

    exam_payment = relationship("ExamPayment", back_populates="exam", cascade="all, delete-orphan")
    student_exam_payment_status = relationship("StudentExamPaymentStatus", back_populates="exam_fee", cascade="all, delete-orphan")
 


