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
    payment_method: str
    parent_id: str
    # Make student_fee_ids present by default (empty list) so callers can rely on it.
    student_fee_ids: List[str] = []
    description: str | None = None


class PaymentCreate(PaymentBase):
    payment_method: str
    parent_id: str
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


# ---------- Receipt Schemas ----------

class ReceiptFee(BaseModel):
    code: str
    name: str
    amount: float


class SchoolReceiptStudent(BaseModel):
    student_id: str
    name: str
    year_group: str | None = None
    class_name: str | None = None
    fees: List[ReceiptFee] = []
    total: float


class SchoolPaymentReceipt(BaseModel):
    reference: str
    amount: float
    payment_method: str | None = None
    payer_name: str | None = None
    payer_email: str | None = None
    payer_phone: str | None = None
    students: List[SchoolReceiptStudent]
    created_at: str | None = None


class ExamReceiptStudent(BaseModel):
    student_id: str
    name: str


class ExamReceiptBreakdown(BaseModel):
    exam_id: str
    exam_name: str
    amount_paid: float
    includes_textbook: bool = False
    textbook_cost: float = 0.0


class ExamPaymentReceipt(BaseModel):
    reference: str
    amount: float
    payment_method: str | None = None
    payer_name: str | None = None
    payer_email: str | None = None
    payer_phone: str | None = None
    student: ExamReceiptStudent
    examBreakdown: List[ExamReceiptBreakdown] = []
    created_at: str | None = None