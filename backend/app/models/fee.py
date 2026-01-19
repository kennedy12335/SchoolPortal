from sqlalchemy import Column, Float, String, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Fee(BaseModel):
    __tablename__ = "fee"

    name = Column(String, nullable=False)
    code = Column(String, nullable=False, unique=True)  # e.g. "TUITION", "BOARDING"
    amount = Column(Float, nullable=False)
    extra_fees = Column(Float, nullable=True)
    description = Column(String, nullable=True)

    # Relationship to StudentFee
    student_fees = relationship("StudentFee", back_populates="fee", cascade="all, delete-orphan")
