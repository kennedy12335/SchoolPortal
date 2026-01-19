from typing import Dict, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.club import Club
from ..models.fee import Fee
from ..models.student import Student
from ..schemas.fees import (
    ClubInfo,
    FeeBreakdown,
    StudentFeeDetail,
    DetailedFeeCalculationResponse,
)


async def calculate_fees(
    *,
    student_ids: List[str],
    student_club_ids: Dict[str, List[str]],
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

    all_club_ids: List[str] = []
    for sid in student_ids:
        all_club_ids.extend(student_club_ids.get(str(sid), []) or [])
    unique_club_ids = list(set(all_club_ids))

    clubs_by_id: Dict[str, Club] = {}
    if unique_club_ids:
        clubs = db.query(Club).filter(Club.id.in_(unique_club_ids)).all()
        clubs_by_id = {c.id: c for c in clubs}

    total_amount = 0.0
    student_fees: List[StudentFeeDetail] = []

    for student_id in student_ids:
        student = students_by_id[student_id]

        club_list: List[ClubInfo] = []
        club_fees_total = 0.0
        for club_id in student_club_ids.get(str(student_id), []) or []:
            club = clubs_by_id.get(club_id)
            if club:
                club_price = float(club.price)
                club_fees_total += club_price
                club_list.append(ClubInfo(id=club.id, name=club.name, price=club_price))

        subtotal = base_fees_total + club_fees_total
        final_amount = subtotal

        student_fees.append(
            StudentFeeDetail(
                student_id=student.id,
                student_name=f"{student.first_name} {student.last_name}",
                fee_breakdown=FeeBreakdown(
                    fees=fees_mapping,
                    club_fees=club_list,
                    subtotal=subtotal,
                    final_amount=final_amount,
                ),
            )
        )
        total_amount += final_amount

    return DetailedFeeCalculationResponse(total_amount=total_amount, student_fees=student_fees)
