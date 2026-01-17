from sqlalchemy import Column, String, Integer, ForeignKey, Boolean, Float, Enum
from sqlalchemy.orm import relationship
from .base import BaseModel
from .parent import parent_student_association
from .classes import YearGroup, ClassName

class Student(BaseModel):
    __tablename__ = "students"

    # first_name = Column(String, nullable=False)
    # middle_name = Column(String, nullable=True)
    # last_name = Column(String, nullable=False)
    # age = Column(Integer)
    # grade = Column(String)
    # parent_id = Column(Integer, ForeignKey("parents.id"))
    # email = Column(String, nullable=True)
    # reg_number = Column(String, nullable=True)
    # discount_percentage = Column(Float, default=0)
    # discount_amount = Column(Float, default=0)
    # school_fees_paid = Column(Boolean, nullable=True, default=False)
    
    # # Relationships
    # parent = relationship("Parent", back_populates="students")
    # club_memberships = relationship("ClubMembership", back_populates="student")
    # exam_payment = relationship("ExamPayment", back_populates="student", cascade="all, delete-orphan")
    # student_exam_payment_status = relationship("StudentExamPaymentStatus", back_populates="student", cascade="all, delete-orphan")

    reg_number = Column(String, nullable=False, unique=True, index=True)
    first_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    last_name = Column(String, nullable=False)
    year_group = Column(Enum(YearGroup), nullable=False)
    class_name = Column(Enum(ClassName), nullable=False)
    email = Column(String, nullable=True, unique=True, index=True)
    outstanding_balance = Column(Float, nullable=True)
        
    # Relationships
    parents = relationship(
        "Parent",
        secondary=parent_student_association,
        back_populates="students"
    )
    club_memberships = relationship("ClubMembership", back_populates="student")
    exam_payment = relationship("ExamPayment", back_populates="student", cascade="all, delete-orphan")
    student_exam_payment_status = relationship("StudentExamPaymentStatus", back_populates="student", cascade="all, delete-orphan")