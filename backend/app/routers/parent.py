from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.parent import Parent
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