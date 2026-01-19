from pydantic import BaseModel
from typing import Dict, List


class ClubInfo(BaseModel):
    id: str
    name: str
    price: float


class FeeBreakdown(BaseModel):
    fees: Dict[str, float]
    club_fees: List[ClubInfo]
    subtotal: float
    final_amount: float


class StudentFeeDetail(BaseModel):
    student_id: str
    student_name: str
    fee_breakdown: FeeBreakdown


class DetailedFeeCalculationResponse(BaseModel):
    total_amount: float
    student_fees: List[StudentFeeDetail]
