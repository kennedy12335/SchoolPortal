from app.routers.exams import create_exam, ExamCreate
from app.models.student_exam_fee import StudentExamFee
from app.models.student import Student
from app.models.classes import YearGroup


def test_create_exam_populates_student_exam_fees(test_db, mock_student, mock_student_2):
    # Create exam for YEAR_10 and YEAR_11
    exam_payload = ExamCreate(
        exam_name="Term Exams",
        amount=1000.0,
        extra_fees=0.0,
        allows_installments=False,
        applicable_grades=["YEAR_10", "YEAR_11"]
    )

    created_exam = create_exam(exam_payload, db=test_db)

    # Ensure the exam was created
    assert created_exam is not None
    assert created_exam.applicable_grades == ["YEAR_10", "YEAR_11"]

    # Query StudentExamFee entries for the created exam
    sefs = test_db.query(StudentExamFee).filter(StudentExamFee.exam_fee_id == created_exam.id).all()
    assert len(sefs) == 2

    student_ids = {s.student_id for s in sefs}
    assert {mock_student.id, mock_student_2.id} == student_ids


def test_create_exam_with_invalid_grade_raises(test_db):
    exam_payload = ExamCreate(
        exam_name="Invalid Grade Exam",
        amount=500.0,
        extra_fees=0.0,
        allows_installments=False,
        applicable_grades=["YEAR_10", "YEAR_99"]
    )

    try:
        create_exam(exam_payload, db=test_db)
        assert False, "Expected HTTPException for invalid grade"
    except Exception as e:
        # Should be an HTTPException for invalid grade
        from fastapi import HTTPException
        assert isinstance(e, HTTPException)
        assert "Invalid grade" in str(e.detail)
