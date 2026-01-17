from sqlalchemy import Column, String, Integer, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel

class Club(BaseModel):
    __tablename__ = "clubs"

    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    capacity = Column(Integer)

    # Relationships
    memberships = relationship("ClubMembership", back_populates="club")

class ClubMembership(BaseModel):
    __tablename__ = "club_memberships"

    student_id = Column(String, ForeignKey("students.id"))
    club_id = Column(String, ForeignKey("clubs.id"))
    payment_confirmed = Column(Boolean, default=False)
    status = Column(String, default="active")  # active, inactive
    
    # Relationships
    student = relationship("Student", back_populates="club_memberships")
    club = relationship("Club", back_populates="memberships") 