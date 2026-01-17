from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging
from app.models.base import Base
import importlib
import pkgutil
import app.models
import os

# Configure logging
logger = logging.getLogger(__name__)
from dotenv import load_dotenv
load_dotenv()
# Create database URL for SQLAlchemy
# Add default values and type conversion for port
db_port = int(os.getenv('db_port', '5432'))  # Default to 5432 if not set
SQLALCHEMY_DATABASE_URL = (
    f"postgresql://"
    f"{os.getenv('db_user')}:{os.getenv('db_password')}@"
    f"{os.getenv('db_host')}:{db_port}/"
    f"{os.getenv('db_name')}"
)
# Create SQLAlchemy engine with connection pool settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dynamically load all model modules
for _, module_name, _ in pkgutil.walk_packages(app.models.__path__, app.models.__name__ + "."):
    importlib.import_module(module_name)
    
# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def drop_all_tables():
    Base.metadata.drop_all(bind=engine)
    logger.info("All database tables dropped successfully") 
