from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import cast
from sqlalchemy.dialects.postgresql import JSONB
from typing import List, Optional
from ..database import get_db
from ..models.parent import Parent
from ..models.student import Student
from ..models.club import ClubMembership, Club
from ..models.payment import Payment, PaymentStatus
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class ParentBase(BaseModel):
    auth_id: str
    first_name: str
    last_name: str
    email: str | None = None
    phone: str | None = None

class ParentCreate(ParentBase):
    pass

class ParentResponse(ParentBase):
    id: str

    class Config:
        from_attributes = True

@router.post("/", response_model=ParentResponse)
def create_parent(parent: ParentCreate, db: Session = Depends(get_db)):
    db_parent = Parent(**parent.model_dump())
    db.add(db_parent)
    db.commit()
    db.refresh(db_parent)
    return db_parent

@router.get("/", response_model=List[ParentResponse])
def get_parents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    parents = db.query(Parent).offset(skip).limit(limit).all()
    return parents

@router.get("/{parent_id}", response_model=ParentResponse)
def get_parent(parent_id: str, db: Session = Depends(get_db)):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent

@router.get("/email/{email}", response_model=ParentResponse)
def get_parent_by_email(email: str, db: Session = Depends(get_db)):
    print(f"Searching for parent with email: {email}")
    parent = db.query(Parent).filter(Parent.email == email).first()
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")
    return parent

@router.put("/{parent_id}", response_model=ParentResponse)
def update_parent(parent_id: str, parent: ParentCreate, db: Session = Depends(get_db)):
    db_parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if db_parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")

    for key, value in parent.model_dump().items():
        setattr(db_parent, key, value)

    db.commit()
    db.refresh(db_parent)
    return db_parent

@router.delete("/{parent_id}")
def delete_parent(parent_id: str, db: Session = Depends(get_db)):
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")

    db.delete(parent)
    db.commit()
    return {"message": "Parent deleted successfully"}


# Response schemas for parent's students
class ClubInfo(BaseModel):
    id: str
    name: str
    price: float

    class Config:
        from_attributes = True

class ClubMembershipInfo(BaseModel):
    club: ClubInfo
    status: str

    class Config:
        from_attributes = True

class StudentWithStatus(BaseModel):
    id: str
    reg_number: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    year_group: str
    class_name: str
    email: Optional[str] = None
    outstanding_balance: Optional[float] = None
    school_fees_paid: bool
    club_memberships: List[ClubMembershipInfo]

    class Config:
        from_attributes = True

class ParentStudentsResponse(BaseModel):
    parent: ParentResponse
    students: List[StudentWithStatus]


@router.get("/{parent_id}/students", response_model=ParentStudentsResponse)
def get_parent_students(parent_id: str, db: Session = Depends(get_db)):
    """
    Get all students associated with a parent, including their school fees payment status
    and club memberships.
    """
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if parent is None:
        raise HTTPException(status_code=404, detail="Parent not found")

    # Get students with their club memberships
    students = db.query(Student).join(
        Student.parents
    ).filter(
        Parent.id == parent_id
    ).options(
        joinedload(Student.club_memberships).joinedload(ClubMembership.club)
    ).all()

    # Check school fees payment status for each student
    students_with_status = []
    for student in students:
        # UPDATED QUERY: Use cast to ensure PostgreSQL uses the JSONB contains operator (@>)
        payment = db.query(Payment).filter(
            Payment.status == PaymentStatus.COMPLETED,
            cast(Payment.student_ids, JSONB).contains([str(student.id)])
        ).first()

        school_fees_paid = payment is not None

        # Build club membership info
        club_memberships = []
        for membership in student.club_memberships:
            if membership.club:
                club_memberships.append(ClubMembershipInfo(
                    club=ClubInfo(
                        id=str(membership.club.id),
                        name=membership.club.name,
                        price=membership.club.price
                    ),
                    status=membership.status
                ))

        students_with_status.append(StudentWithStatus(
            id=str(student.id),
            reg_number=student.reg_number,
            first_name=student.first_name,
            middle_name=student.middle_name,
            last_name=student.last_name,
            year_group=student.year_group.value if student.year_group else "",
            class_name=student.class_name.value if student.class_name else "",
            email=student.email,
            outstanding_balance=student.outstanding_balance,
            school_fees_paid=school_fees_paid,
            club_memberships=club_memberships
        ))

    return ParentStudentsResponse(
        parent=ParentResponse(
            id=str(parent.id),
            auth_id=parent.auth_id,
            first_name=parent.first_name,
            last_name=parent.last_name,
            email=parent.email,
            phone=parent.phone
        ),
        students=students_with_status
    ) 