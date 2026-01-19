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
    CLUB_FEES = "club_fees"
    EXAM_FEES = "exam_fees"


class PaymentItem(BaseModel):
    __tablename__ = "payment_items"

    payment_id = Column(String, ForeignKey("payments.id"), nullable=False, index=True)
    item_type = Column(Enum(PaymentType), nullable=False, index=True)
    amount = Column(Float, nullable=False)

    payment = relationship("Payment", back_populates="payment_items")


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
    # JSON array of StudentFee ID strings for this payment. Make non-nullable with a default empty list.
    student_fee_ids = Column(JSON, nullable=False)
    
    date_created = Column(DateTime, default=datetime.now)
    date_updated = Column(DateTime, default=datetime.now)

    payment_items = relationship(
        "PaymentItem",
        back_populates="payment",
        cascade="all, delete-orphan",
    )


class ExamPayment(BaseModel):
    __tablename__ = "exam_payments"

    student_exam_fee_id = Column(String, ForeignKey("student_exam_fee.id"), nullable=False)
    student_exam_fee = relationship("StudentExamFee", back_populates="exam_payments")

    amount_paid = Column(Float, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_reference = Column(String)
    payment_method = Column(String)
    
    payer_id = Column(String, ForeignKey("parents.id"))
    payer = relationship("Parent", back_populates="exam_payment")

    date_created = Column(DateTime, default=datetime.now)
    date_updated = Column(DateTime, default=datetime.now)
    
    