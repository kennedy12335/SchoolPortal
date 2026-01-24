from typing import Dict, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.fee import Fee
from ..models.student import Student
from ..schemas.fees import (
    FeeBreakdown,
    StudentFeeDetail,
    DetailedFeeCalculationResponse,
)


async def calculate_fees(
    *,
    student_ids: List[str],
    student_club_ids: Dict[str, List[str]],  # Keep for compatibility but ignore
    db: Session,
) -> DetailedFeeCalculationResponse:
    fee_rows = db.query(Fee).all()
    if not fee_rows:
        raise HTTPException(status_code=404, detail="Base fees not found")

    fees_mapping = {f.code.upper(): float(f.amount) for f in fee_rows}
    base_fees_total = sum(fees_mapping.values())

    students = db.query(Student).filter(Student.id.in_(student_ids)).all()
    students_by_id = {s.id: s for s in students}

    for sid in student_ids:
        if sid not in students_by_id:
            raise HTTPException(status_code=404, detail=f"Student with id {sid} not found")

    total_amount = 0.0
    student_fees: List[StudentFeeDetail] = []

    for student_id in student_ids:
        student = students_by_id[student_id]

        # No club fees anymore
        subtotal = base_fees_total
        final_amount = subtotal

        student_fees.append(
            StudentFeeDetail(
                student_id=student.id,
                student_name=f"{student.first_name} {student.last_name}",
                fee_breakdown=FeeBreakdown(
                    fees=fees_mapping,
                    subtotal=subtotal,
                    final_amount=final_amount,
                ),
            )
        )
        total_amount += final_amount

    return DetailedFeeCalculationResponse(total_amount=total_amount, student_fees=student_fees)
