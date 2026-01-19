from typing import List, Dict, Optional
from enum import Enum
from pydantic import BaseModel


class PaymentType(str, Enum):
    SCHOOL_FEES = "school_fees"
    EXAM_FEES = "exam_fees"
    POCKET_MONEY = "pocket_money"


# class PayerInfoBase(BaseModel):
#     name: str
#     email: str | None = None
#     phone: str | None = None
#     relationship: str


class PaymentBase(BaseModel):
    student_ids: List[str]
    amount: float
    description: str | None = None


class SchoolFeesPaymentData(BaseModel):
    student_ids: List[str]
    amount: float
    club_amount: float
    payment_method: str
    parent_id: str
    student_club_ids: Dict[str, List[str]]
    # Make student_fee_ids present by default (empty list) so callers can rely on it.
    student_fee_ids: List[str] = []
    description: str | None = None


class PaymentCreate(PaymentBase):
    club_amount: float | None = None
    payment_method: str
    parent_id: str
    student_club_ids: dict[str, List[str]]
    student_fee_ids: List[str] = []


class PaymentResponse(PaymentBase):
    id: str
    status: str
    payment_reference: str | None = None

    class Config:
        from_attributes = True


class ExamPaymentDetails(BaseModel):
    exam_id: str
    amount_paid: float


class ExamFeesPaymentData(BaseModel):
    exam_payments: List[ExamPaymentDetails]
    student_id: str
    amount: float
    payment_method: str
    parent_id: str


class PaymentInitializationResult(BaseModel):
    status: bool
    message: str
    data: Dict | None = None


class PaystackResponse(BaseModel):
    status: bool
    message: str
    data: dict | None = None 