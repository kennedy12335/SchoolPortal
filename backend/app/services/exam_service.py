from typing import Any
from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..models.fees import ExamFees
from ..models.student import Student
from ..models.student_exam_fee import StudentExamFee
from ..models.classes import YearGroup


def populate_student_exam_fees(db: Session, exam: ExamFees) -> int:
    """Associate students in the exam's applicable grades with the exam by creating StudentExamFee rows.

    Returns the number of StudentExamFee rows created.
    Raises HTTPException(400) for invalid grade names.
    """
    if not exam.applicable_grades:
        return 0

    try:
        grade_enums = [getattr(YearGroup, g) for g in exam.applicable_grades]
    except AttributeError as ae:
        raise HTTPException(status_code=400, detail=f"Invalid grade in applicable_grades: {ae}")

    students = db.query(Student).filter(Student.year_group.in_(grade_enums)).all()
    created = 0
    for student in students:
        existing = db.query(StudentExamFee).filter(
            StudentExamFee.student_id == student.id,
            StudentExamFee.exam_fee_id == exam.id
        ).first()
        if existing:
            continue

        sef = StudentExamFee(
            student_id=student.id,
            exam_fee_id=exam.id,
            amount=exam.amount,
            discount_percentage=0.0,
            paid=False
        )
        db.add(sef)
        created += 1

    # Commit the new StudentExamFee rows
    db.commit()
    return created


def create_exam(db: Session, exam_payload: Any) -> ExamFees:
    """Create an ExamFees row and optionally populate StudentExamFee rows for applicable_grades.

    exam_payload can be a Pydantic model or an object with attributes:
    exam_name, amount, extra_fees, allows_installments, applicable_grades
    """
    new_exam = ExamFees(
        exam_name=exam_payload.exam_name,
        amount=exam_payload.amount,
        extra_fees=exam_payload.extra_fees,
        allows_installments=exam_payload.allows_installments,
        applicable_grades=exam_payload.applicable_grades,
    )
    db.add(new_exam)
    # Flush to get new_exam.id
    db.flush()

    # Populate StudentExamFee rows if applicable_grades provided
    if getattr(exam_payload, "applicable_grades", None):
        populate_student_exam_fees(db, new_exam)

    db.commit()
    db.refresh(new_exam)
    return new_exam