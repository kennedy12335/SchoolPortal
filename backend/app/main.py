from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, get_db, init_db, drop_all_tables
from .routers import parent, student, payment, fees, exams, admin_analytics
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends
from dotenv import load_dotenv
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()
# Create database tables
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Set up logging first
    logger.info("Starting application...")
    
    # Initialize database
    init_db()
    # drop_all_tables()
    logger.info("Database initialized")
    
    yield
    
    logger.info("Shutting down application...")

app = FastAPI(title="BSC School Payment Portal API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("local_frontend_url"),
        os.getenv("zrok_frontend_url"),
        os.getenv("frontend_url"),
        "https://hyperrhythmical-gabriela-unpoutingly.ngrok-free.dev",
        "http://192.168.1.149:3000"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(parent.router, prefix="/api/parents", tags=["parents"])
app.include_router(student.router, prefix="/api/students", tags=["students"])
app.include_router(payment.router, prefix="/api/payments", tags=["payments"])
app.include_router(fees.router, prefix="/api/fees", tags=["fees"])
app.include_router(exams.router, prefix="/api/exams", tags=["exams"])
app.include_router(admin_analytics.router, prefix="/api/admin", tags=["admin-analytics"])

@app.get("/")
async def root():
    return {"message": "Welcome to BSC School Payment Portal API"}

@app.get("/test-db")
async def test_db(db: Session = Depends(get_db)):
    try:
        # Test the connection
        db.execute(text("SELECT 1"))
        # Get list of tables
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        tables = [row[0] for row in result]
        return {"status": "connected", "tables": tables}
    except Exception as e:
        return {"status": "error", "detail": str(e)} 