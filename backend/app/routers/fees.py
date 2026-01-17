from ..models.club import Club
from ..models.student import Student
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.fees import Fees
from pydantic import BaseModel
import logging
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Setup logger
logger = logging.getLogger(__name__)

class FeesBase(BaseModel):
    tuition: float
    boarding: float
    utility: float
    prize_giving_day: float
    year_book: float
    offering_and_hairs: float

class FeesResponse(FeesBase):
    total: float

class ClubInfo(BaseModel):
    id: int
    name: str
    price: float

class StudentFeeCalculation(BaseModel):
    student_id: str
    student_name: str
    subtotal: float
    final_amount: float
    clubs: List[ClubInfo]

class FeeCalculationResponse(BaseModel):
    total_amount: float
    student_fees: List[StudentFeeCalculation]

class FeeBreakdown(BaseModel):
    tuition: float
    boarding: float
    utility: float
    prize_giving_day: float
    year_book: float
    offering_and_hairs: float
    club_fees: List[ClubInfo]  # List of selected clubs and their fees
    subtotal: float
    final_amount: float

class StudentFeeDetail(BaseModel):
    student_id: str
    student_name: str
    fee_breakdown: FeeBreakdown

class DetailedFeeCalculationResponse(BaseModel):
    total_amount: float
    student_fees: List[StudentFeeDetail]

@router.get("/", response_model=FeesResponse)
async def get_fees(db: Session = Depends(get_db)):
    logger.info("Fetching current fees")
    try:
        fees = db.query(Fees).first()
        if not fees:
            raise HTTPException(status_code=404, detail="Fees not found")
        return fees
    except Exception as e:
        logger.error(f"Error fetching fees: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update", response_model=FeesResponse)
def update_fees(fees: FeesBase, db: Session = Depends(get_db)):
    db_fees = Fees(**fees.model_dump())
    db.add(db_fees)
    db.commit() 
    db.refresh(db_fees)
    return db_fees

@router.post("/calculate-fees", response_model=DetailedFeeCalculationResponse)
async def calculate_fees(
    student_ids: List[str],
    student_club_ids: dict[str, List[str]],
    db: Session = Depends(get_db)
):
    try:
        # Get base fees
        base_fees = db.query(Fees).first()
        if not base_fees:
            raise HTTPException(status_code=404, detail="Base fees not found")

        total_amount = 0
        student_fees: List[StudentFeeDetail] = []

        for student_id in student_ids:
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                raise HTTPException(
                    status_code=404,
                    detail=f"Student with id {student_id} not found"
                )

            # Get clubs for this student
            club_list = []
            club_fees_total = 0
            student_club_ids_str = str(student_id)
            if student_club_ids_str in student_club_ids:
                for club_id in student_club_ids[student_club_ids_str]:
                    club = db.query(Club).filter(Club.id == club_id).first()
                    if club:
                        club_fees_total += club.price
                        club_list.append(ClubInfo(
                            id=club.id,
                            name=club.name,
                            price=club.price
                        ))

            # Calculate subtotal (base fees + club fees)
            subtotal = (
                base_fees.tuition +
                base_fees.boarding +
                base_fees.utility +
                base_fees.prize_giving_day +
                base_fees.year_book +
                base_fees.offering_and_hairs +
                club_fees_total
            )

            # Calculate discounts (removed as student model no longer has discount fields)
            discount_amount = 0
            discount_percentage = 0
            percentage_discount_amount = 0

            # Calculate final amount
            final_amount = subtotal

            # Create fee breakdown
            fee_breakdown = FeeBreakdown(
                tuition=base_fees.tuition,
                boarding=base_fees.boarding,
                utility=base_fees.utility,
                prize_giving_day=base_fees.prize_giving_day,
                year_book=base_fees.year_book,
                offering_and_hairs=base_fees.offering_and_hairs,
                club_fees=club_list,
                subtotal=subtotal,
                final_amount=final_amount
            )

            student_fees.append(StudentFeeDetail(
                student_id=student.id,
                student_name=f"{student.first_name} {student.last_name}",
                fee_breakdown=fee_breakdown
            ))

            total_amount += final_amount

        return DetailedFeeCalculationResponse(
            total_amount=total_amount,
            student_fees=student_fees
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating fees: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while calculating fees"
        )

