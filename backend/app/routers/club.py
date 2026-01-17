from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.club import Club, ClubMembership
from pydantic import BaseModel

router = APIRouter()

class ClubBase(BaseModel):
    name: str
    description: str | None = None
    price: float
    capacity: int | None = None

class ClubCreate(ClubBase):
    pass

class ClubResponse(ClubBase):
    id: str

    class Config:
        from_attributes = True

class ClubMembershipBase(BaseModel):
    student_id: str
    club_id: str
    status: str = "active"

class ClubMembershipCreate(ClubMembershipBase):
    pass

class ClubMembershipResponse(ClubMembershipBase):
    id: str

    class Config:
        from_attributes = True

@router.post("/", response_model=ClubResponse)
def create_club(club: ClubCreate, db: Session = Depends(get_db)):
    db_club = Club(**club.model_dump())
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    return db_club

@router.get("/", response_model=List[ClubResponse])
def get_clubs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clubs = db.query(Club).offset(skip).limit(limit).all()
    return clubs

@router.get("/{club_id}", response_model=ClubResponse)
def get_club(club_id: str, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id == club_id).first()
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    return club

@router.put("/{club_id}", response_model=ClubResponse)
def update_club(club_id: str, club: ClubCreate, db: Session = Depends(get_db)):
    db_club = db.query(Club).filter(Club.id == club_id).first()
    if db_club is None:
        raise HTTPException(status_code=404, detail="Club not found")

    for key, value in club.model_dump().items():
        setattr(db_club, key, value)

    db.commit()
    db.refresh(db_club)
    return db_club

@router.delete("/{club_id}")
def delete_club(club_id: str, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id == club_id).first()
    if club is None:
        raise HTTPException(status_code=404, detail="Club not found")

    db.delete(club)
    db.commit()
    return {"message": "Club deleted successfully"}

@router.post("/memberships", response_model=ClubMembershipResponse)
def create_club_membership(membership: ClubMembershipCreate, db: Session = Depends(get_db)):
    db_membership = ClubMembership(**membership.model_dump())
    db.add(db_membership)
    db.commit()
    db.refresh(db_membership)
    return db_membership

@router.get("/memberships", response_model=List[ClubMembershipResponse])
def get_club_memberships(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    memberships = db.query(ClubMembership).offset(skip).limit(limit).all()
    return memberships 