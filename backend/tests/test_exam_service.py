from app.services.exam_service import create_exam, populate_student_exam_fees
from app.models.student_exam_fee import StudentExamFee
from app.models.classes import YearGroup
from app.models.student import Student
from app.models.fees import ExamFees
from fastapi import HTTPException


def test_populate_student_exam_fees_creates_rows(test_db, mock_student, mock_student_2, mock_exam_fees):
    # Use the mock exam already created by mock_exam_fees fixture
    exam = mock_exam_fees

    # Make sure no StudentExamFee rows exist yet
    sefs_before = test_db.query(StudentExamFee).filter(StudentExamFee.exam_fee_id == exam.id).all()
    assert len(sefs_before) == 0

    created = populate_student_exam_fees(test_db, exam)
    assert created == 2

    sefs_after = test_db.query(StudentExamFee).filter(StudentExamFee.exam_fee_id == exam.id).all()
    assert len(sefs_after) == 2


def test_populate_student_exam_fees_invalid_grade_raises(test_db):
    exam = ExamFees(
        exam_name="Bad Exam",
        amount=1000.0,
        extra_fees=0.0,
        allows_installments=False,
        applicable_grades=["YEAR_99"]
    )
    test_db.add(exam)
    test_db.commit()
    test_db.refresh(exam)

    try:
        populate_student_exam_fees(test_db, exam)
        assert False, "Expected HTTPException for invalid grade"
    except Exception as e:
        assert isinstance(e, HTTPException)
        assert "Invalid grade" in str(e.detail)


def test_create_exam_service_populates(test_db, mock_student, mock_student_2):
    class Payload:
        exam_name = "Service Created Exam"
        amount = 2000.0
        extra_fees = 0.0
        allows_installments = False
        applicable_grades = ["YEAR_10", "YEAR_11"]

    payload = Payload()
    exam = create_exam(test_db, payload)

    assert exam is not None
    sefs = test_db.query(StudentExamFee).filter(StudentExamFee.exam_fee_id == exam.id).all()
    assert len(sefs) == 2