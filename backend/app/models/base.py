from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, DateTime
from datetime import datetime
from uuid import uuid4

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid4()))