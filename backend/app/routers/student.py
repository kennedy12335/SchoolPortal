from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.student import Student
from ..models.classes import YearGroup, ClassName
from pydantic import BaseModel
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

class StudentBase(BaseModel):
    reg_number: str
    first_name: str
    middle_name: str | None = None
    last_name: str
    year_group: YearGroup
    class_name: ClassName
    email: str | None = None
    outstanding_balance: float | None = None

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: str

    class Config:
        from_attributes = True
        use_enum_values = True

class StudentIDRequest(BaseModel):
    student_last_name: str
    student_ids: List[str]  # List of student IDs (e.g., ["2023-0001", "2023-0002"])

@router.post("/get-by-last-name-and-id", response_model=List[StudentResponse])
def get_students_by_last_name_and_id(request: StudentIDRequest, db: Session = Depends(get_db)):
    try:
        all_students = db.query(Student).filter(
            Student.reg_number.in_(request.student_ids)
        ).all()
    
        if not all_students:
            raise HTTPException(status_code=404, detail="No students found with the given IDs")
        
        # Debug output
        logger.info(f"Found these students with the given IDs: {[(s.reg_number, s.last_name) for s in all_students]}")
        
        # Filter students by last name (case-insensitive) in Python code
        requested_last_name = request.student_last_name.strip().lower()
        matching_students = [
            student for student in all_students 
            if student.last_name.lower().find(requested_last_name) != -1
        ]
        
        if not matching_students:
            raise HTTPException(status_code=404, detail="No students match the provided last name")
        
        # Check if any student IDs from the request were not found or don't match the last name
        found_ids = {s.reg_number for s in matching_students}
        missing_ids = set(request.student_ids) - found_ids
        
        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"Some student IDs not found or don't match the provided last name: {missing_ids}"
            )
        
        return matching_students
    except Exception as e:
        logger.error(f"Error in get_students_by_last_name_and_id: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.get("/", response_model=List[StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    students = db.query(Student).offset(skip).limit(limit).all()
    return students

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    for key, value in student.model_dump().items():
        setattr(db_student, key, value)

    db.commit()
    db.refresh(db_student)
    return db_student

@router.delete("/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"} 