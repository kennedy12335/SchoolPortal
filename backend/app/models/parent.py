from sqlalchemy import Column, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import BaseModel, Base

# Association table for many-to-many relationship between Parent and Student
parent_student_association = Table(
    'parent_student',
    Base.metadata,
    Column('parent_id', String, ForeignKey('parents.id'), primary_key=True),
    Column('student_id', String, ForeignKey('students.id'), primary_key=True)
)

class Parent(BaseModel):
    __tablename__ = "parents"

    # name = Column(String, nullable=False)
    # email = Column(String, unique=True, nullable=True)
    # phone = Column(String, nullable=True)
    # address = Column(String, nullable=True)
    
    # # Relationships
    # students = relationship("Student", back_populates="parent")

    auth_id = Column(String, nullable=False, unique=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True, index=True)
    phone = Column(String, nullable=True, unique=True, index=True)
    
    # Relationships
    students = relationship(
        "Student",
        secondary=parent_student_association,
        back_populates="parents"
    )
    payment = relationship("Payment", back_populates="payer")
    exam_payment = relationship("ExamPayment", back_populates="payer")
