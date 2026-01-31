from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
from ..models.fee import Fee
from pydantic import BaseModel
import logging
from uuid import uuid4
from dotenv import load_dotenv

from ..services.fees_service import calculate_fees as calculate_fees_service
from ..schemas.fees import DetailedFeeCalculationResponse

load_dotenv()

router = APIRouter()

# Setup logger
logger = logging.getLogger(__name__)

class FeesBase(BaseModel):
    # Dynamic mapping of fee code -> amount, e.g. {"TUITION": 100.0, "SPORTS": 50.0}
    fees: Dict[str, float]


class FeesResponse(BaseModel):
    fees: Dict[str, float]
    total: float


class CalculateFeesRequest(BaseModel):
    student_ids: List[str]


@router.get("/", response_model=FeesResponse)
async def get_fees(db: Session = Depends(get_db)):
    logger.info("Fetching current fees")
    try:
        # Return canonical set of fee rows as a mapping code -> amount
        fee_rows = db.query(Fee).all()
        if not fee_rows:
            raise HTTPException(status_code=404, detail="Fees not found")

        mapping = {f.code.upper(): f.amount for f in fee_rows}
        total = sum(mapping.values())

        return FeesResponse(fees=mapping, total=total)
    except Exception as e:
        logger.error(f"Error fetching fees: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/update", response_model=FeesResponse)
def update_fees(fee_updates: Dict[str, float], db: Session = Depends(get_db)):
    # Upsert fee components provided as a mapping code->amount in request body
    try:
        created_or_updated = []
        for code, amount in fee_updates.items():
            code_up = code.upper()
            # Derive a friendly name from the code if name isn't provided
            friendly_name = code_up.replace("_", " ").title()
            fee_row = db.query(Fee).filter(Fee.code == code_up).first()
            if fee_row:
                fee_row.amount = amount
                fee_row.name = friendly_name
            else:
                fee_row = Fee(
                    id=str(uuid4()),
                    code=code_up,
                    name=friendly_name,
                    amount=amount,
                )
                db.add(fee_row)
            created_or_updated.append(fee_row)

        db.commit()

        # Return the current mapping after update
        fee_rows = db.query(Fee).all()
        mapping = {f.code.upper(): f.amount for f in fee_rows}
        total = sum(mapping.values())
        return FeesResponse(fees=mapping, total=total)
    except Exception as e:
        logger.error(f"Error updating fees: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while updating fees")

@router.post("/calculate-fees", response_model=DetailedFeeCalculationResponse)
async def calculate_fees_endpoint(
    request: CalculateFeesRequest,
    db: Session = Depends(get_db)
):
    try:
        return await calculate_fees_service(
            student_ids=request.student_ids,
            db=db,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating fees: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while calculating fees"
        )

