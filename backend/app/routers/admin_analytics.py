"""
Admin Analytics Router - Provides analytics endpoints for the admin dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case, or_
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models.student import Student
from ..models.payment import Payment, PaymentItem, PaymentStatus, PaymentType, ExamPayment
from ..models.student_exam_fee import StudentExamFee
from ..models.club import Club, ClubMembership
from ..models.fees import ExamFees
from ..models.classes import YearGroup, ClassName
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ============ Response Models ============

class ClassPaymentSummary(BaseModel):
    class_name: str
    total_students: int
    paid_count: int
    unpaid_count: int
    payment_rate: float
    total_collected: float


class YearGroupPaymentSummary(BaseModel):
    year_group: str
    total_students: int
    paid_count: int
    unpaid_count: int
    payment_rate: float
    total_collected: float
    classes: List[ClassPaymentSummary]


class StudentPaymentInfo(BaseModel):
    id: str
    reg_number: str
    first_name: str
    last_name: str
    year_group: str
    class_name: str
    school_fees_paid: bool
    outstanding_balance: float | None


class PaginatedStudentPaymentInfo(BaseModel):
    items: List[StudentPaymentInfo]
    total: int
    limit: int
    offset: int


class SchoolFeesOverview(BaseModel):
    total_students: int
    total_paid: int
    total_unpaid: int
    overall_payment_rate: float
    total_amount_collected: float
    by_year_group: List[YearGroupPaymentSummary]


class ExamPaymentSummary(BaseModel):
    exam_id: str
    exam_name: str
    applicable_grades: List[str] | None
    total_applicable_students: int
    total_registered: int
    fully_paid_count: int
    partially_paid_count: int
    unpaid_count: int
    total_amount_expected: float
    total_amount_collected: float
    collection_rate: float


class StudentExamInfo(BaseModel):
    student_id: str
    reg_number: str
    first_name: str
    last_name: str
    year_group: str
    class_name: str
    amount_due: float
    amount_paid: float
    is_fully_paid: bool


class PaginatedStudentExamInfo(BaseModel):
    items: List[StudentExamInfo]
    total: int
    limit: int
    offset: int


class ExamAnalyticsResponse(BaseModel):
    total_exams: int
    exams: List[ExamPaymentSummary]


class ClubMembershipSummary(BaseModel):
    club_id: str
    club_name: str
    price: float
    capacity: int | None
    total_members: int
    confirmed_members: int
    pending_members: int
    capacity_utilization: float | None
    total_revenue: float


class ClubMemberInfo(BaseModel):
    student_id: str
    reg_number: str
    first_name: str
    last_name: str
    year_group: str
    class_name: str
    payment_confirmed: bool
    status: str


class PaginatedClubMemberInfo(BaseModel):
    items: List[ClubMemberInfo]
    total: int
    limit: int
    offset: int


class ClubAnalyticsResponse(BaseModel):
    total_clubs: int
    total_memberships: int
    total_revenue: float
    clubs: List[ClubMembershipSummary]


class DashboardOverview(BaseModel):
    total_students: int
    school_fees_paid_count: int
    school_fees_unpaid_count: int
    school_fees_collection_rate: float
    total_school_fees_collected: float
    total_exam_registrations: int
    total_exam_fees_collected: float
    total_club_memberships: int
    total_club_revenue: float
    recent_payments_count: int


# ============ School Fees Endpoints ============

@router.get("/school-fees/overview", response_model=SchoolFeesOverview)
def get_school_fees_overview(response: Response, db: Session = Depends(get_db)):
    """Get comprehensive school fees payment analytics by year group and class."""
    try:
        # Get all students with year group and class
        students = db.query(
            Student.id,
            Student.year_group,
            Student.class_name
        ).all()

        # Get count of paid students from completed payments
        completed_payments = db.query(Payment.student_ids).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).all()
        paid_set = set()
        for payment in completed_payments:
            if payment.student_ids:
                # student_ids is stored as JSON, so it's already a list
                if isinstance(payment.student_ids, list):
                    paid_set.update(payment.student_ids)
                else:
                    # Handle case where it might be a single ID
                    paid_set.add(payment.student_ids)

        # Get total collected
        total_collected = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0.0

        # Organize by year group and class
        year_group_data = {}
        for student_id, year_group, class_name in students:
            yg = year_group.value if year_group else "Unknown"
            cn = class_name.value if class_name else "Unknown"

            if yg not in year_group_data:
                year_group_data[yg] = {"classes": {}, "total": 0, "paid": 0}

            if cn not in year_group_data[yg]["classes"]:
                year_group_data[yg]["classes"][cn] = {"total": 0, "paid": 0}

            year_group_data[yg]["total"] += 1
            year_group_data[yg]["classes"][cn]["total"] += 1

            if student_id in paid_set:
                year_group_data[yg]["paid"] += 1
                year_group_data[yg]["classes"][cn]["paid"] += 1

        # Build response
        by_year_group = []
        for yg, data in sorted(year_group_data.items()):
            classes = []
            for cn, class_data in sorted(data["classes"].items()):
                paid = class_data["paid"]
                total = class_data["total"]
                rate = (paid / total * 100) if total > 0 else 0
                classes.append(ClassPaymentSummary(
                    class_name=cn,
                    total_students=total,
                    paid_count=paid,
                    unpaid_count=total - paid,
                    payment_rate=round(rate, 1),
                    total_collected=0
                ))

            yg_paid = data["paid"]
            yg_total = data["total"]
            yg_rate = (yg_paid / yg_total * 100) if yg_total > 0 else 0

            by_year_group.append(YearGroupPaymentSummary(
                year_group=yg,
                total_students=yg_total,
                paid_count=yg_paid,
                unpaid_count=yg_total - yg_paid,
                payment_rate=round(yg_rate, 1),
                total_collected=0,
                classes=classes
            ))

        total_students = len(students)
        total_paid = len(paid_set)
        overall_rate = (total_paid / total_students * 100) if total_students > 0 else 0

        # Cache for 5 minutes on client side
        response.headers["Cache-Control"] = "public, max-age=300"

        return SchoolFeesOverview(
            total_students=total_students,
            total_paid=total_paid,
            total_unpaid=total_students - total_paid,
            overall_payment_rate=round(overall_rate, 1),
            total_amount_collected=total_collected,
            by_year_group=by_year_group
        )
    except Exception as e:
        logger.error(f"Error getting school fees overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/school-fees/students", response_model=PaginatedStudentPaymentInfo)
def get_school_fees_students(
    year_group: Optional[str] = None,
    class_name: Optional[str] = None,
    payment_status: Optional[str] = None,  # "paid" or "unpaid"
    search: Optional[str] = None,  # Search by name or reg number
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get list of students with their school fees payment status, with optional filters and pagination."""
    try:
        # Get paid student IDs first (needed for filtering)
        completed_payments = db.query(Payment.student_ids).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).all()

        paid_student_ids = set()
        for payment in completed_payments:
            if payment.student_ids:
                if isinstance(payment.student_ids, list):
                    paid_student_ids.update(payment.student_ids)
                else:
                    paid_student_ids.add(payment.student_ids)

        # Build base query
        query = db.query(Student)

        # Apply year group filter at SQL level
        if year_group:
            try:
                yg_enum = YearGroup(year_group)
                query = query.filter(Student.year_group == yg_enum)
            except ValueError:
                pass

        # Apply class name filter at SQL level
        if class_name:
            try:
                cn_enum = ClassName(class_name)
                query = query.filter(Student.class_name == cn_enum)
            except ValueError:
                pass

        # Apply search filter at SQL level
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                (func.lower(Student.first_name).like(search_term)) |
                (func.lower(Student.last_name).like(search_term)) |
                (func.lower(Student.reg_number).like(search_term))
            )

        # Get all matching students
        students = query.all()

        # Apply payment status filter (requires paid_student_ids set)
        if payment_status == "paid":
            students = [s for s in students if s.id in paid_student_ids]
        elif payment_status == "unpaid":
            students = [s for s in students if s.id not in paid_student_ids]

        # Get total count after all filters
        total = len(students)

        # Apply pagination
        paginated_students = students[offset:offset + limit]

        # Build response
        result = []
        for student in paginated_students:
            is_paid = student.id in paid_student_ids
            result.append(StudentPaymentInfo(
                id=student.id,
                reg_number=student.reg_number,
                first_name=student.first_name,
                last_name=student.last_name,
                year_group=student.year_group.value if student.year_group else "Unknown",
                class_name=student.class_name.value if student.class_name else "Unknown",
                school_fees_paid=is_paid,
                outstanding_balance=student.outstanding_balance
            ))

        return PaginatedStudentPaymentInfo(
            items=result,
            total=total,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        logger.error(f"Error getting school fees students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Exam Fees Endpoints ============

@router.get("/exam-fees/overview", response_model=ExamAnalyticsResponse)
def get_exam_fees_overview(response: Response, db: Session = Depends(get_db)):
    """Get comprehensive exam fees analytics."""
    try:
        exams = db.query(ExamFees).all()

        # Get student counts by year group in one query
        students_by_year_group = {}
        year_group_counts = db.query(
            Student.year_group,
            func.count(Student.id).label('count')
        ).group_by(Student.year_group).all()

        for yg, count in year_group_counts:
            if yg:
                students_by_year_group[yg.name] = count

        total_students = db.query(func.count(Student.id)).scalar() or 0
        # Subquery that aggregates completed ExamPayment amounts per StudentExamFee
        payments_subq = db.query(
            ExamPayment.student_exam_fee_id.label('sef_id'),
            func.coalesce(func.sum(ExamPayment.amount), 0).label('paid')
        ).filter(ExamPayment.status == PaymentStatus.COMPLETED).group_by(ExamPayment.student_exam_fee_id).subquery()

        exam_summaries = []
        for exam in exams:
            # Calculate applicable students
            applicable_grades = exam.applicable_grades or []
            if applicable_grades:
                applicable_count = sum(students_by_year_group.get(grade, 0) for grade in applicable_grades)
            else:
                applicable_count = total_students

            # Get payment statistics accounting for partial payments by aggregating ExamPayment amounts
            payment_stats = db.query(
                func.count(StudentExamFee.id).label('total'),
                func.sum(case(
                    (payments_subq.c.paid >= (StudentExamFee.amount * (1 - StudentExamFee.discount_percentage / 100)), 1),
                    else_=0
                )).label('fully_paid'),
                func.sum(case(
                    (and_(payments_subq.c.paid > 0, payments_subq.c.paid < (StudentExamFee.amount * (1 - StudentExamFee.discount_percentage / 100))), 1),
                    else_=0
                )).label('partial'),
                func.coalesce(func.sum(payments_subq.c.paid), 0).label('collected')
            ).outerjoin(payments_subq, payments_subq.c.sef_id == StudentExamFee.id).filter(
                StudentExamFee.exam_fee_id == exam.id
            ).first()

            total_registered = payment_stats.total or 0
            fully_paid = int(payment_stats.fully_paid or 0)
            partially_paid = int(payment_stats.partial or 0)
            unpaid = total_registered - fully_paid - partially_paid
            total_collected = payment_stats.collected or 0.0

            # Compute expected amount as sum of discounted amounts (accounts for per-student discounts)
            total_expected = db.query(
                func.coalesce(func.sum(StudentExamFee.amount * (1 - StudentExamFee.discount_percentage / 100)), 0)
            ).filter(StudentExamFee.exam_fee_id == exam.id).scalar() or 0.0

            collection_rate = (total_collected / total_expected * 100) if total_expected > 0 else 0

            exam_summaries.append(ExamPaymentSummary(
                exam_id=exam.id,
                exam_name=exam.exam_name,
                applicable_grades=applicable_grades,
                total_applicable_students=applicable_count,
                total_registered=total_registered,
                fully_paid_count=fully_paid,
                partially_paid_count=partially_paid,
                unpaid_count=unpaid,
                total_amount_expected=total_expected,
                total_amount_collected=total_collected,
                collection_rate=round(collection_rate, 1)
            ))

        # Cache for 5 minutes on client side
        response.headers["Cache-Control"] = "public, max-age=300"

        return ExamAnalyticsResponse(
            total_exams=len(exams),
            exams=exam_summaries
        )
    except Exception as e:
        logger.error(f"Error getting exam fees overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exam-fees/students/{exam_id}", response_model=PaginatedStudentExamInfo)
def get_exam_students(
    exam_id: str,
    payment_status: Optional[str] = None,  # "paid", "partial", "unpaid"
    year_group: Optional[str] = None,
    search: Optional[str] = None,  # Search by name or reg number
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    try:
        # Aggregate completed payments per StudentExamFee
        payments_subq = db.query(
            ExamPayment.student_exam_fee_id.label("sef_id"),
            func.coalesce(func.sum(ExamPayment.amount), 0).label("paid"),
        ).filter(
            ExamPayment.status == PaymentStatus.COMPLETED
        ).group_by(
            ExamPayment.student_exam_fee_id
        ).subquery()

        discount_pct = func.coalesce(StudentExamFee.discount_percentage, 0)
        amount_due_expr = StudentExamFee.amount * (1 - (discount_pct / 100))
        amount_paid_expr = func.coalesce(payments_subq.c.paid, 0)

        # Base query (join Student + StudentExamFee + aggregated payments)
        query = db.query(
            StudentExamFee,
            Student,
            amount_due_expr.label("amount_due"),
            amount_paid_expr.label("amount_paid"),
        ).join(
            Student, Student.id == StudentExamFee.student_id
        ).outerjoin(
            payments_subq, payments_subq.c.sef_id == StudentExamFee.id
        ).filter(
            StudentExamFee.exam_fee_id == exam_id
        )

        if year_group:
            query = query.filter(Student.year_group == year_group)

        if search:
            like = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Student.first_name.ilike(like),
                    Student.last_name.ilike(like),
                    Student.reg_number.ilike(like),
                )
            )

        # Payment status filter using the same due/paid logic as overview
        if payment_status == "paid":
            query = query.filter(amount_paid_expr >= amount_due_expr)
        elif payment_status == "partial":
            query = query.filter(and_(amount_paid_expr > 0, amount_paid_expr < amount_due_expr))
        elif payment_status == "unpaid":
            query = query.filter(amount_paid_expr <= 0)

        total = query.count()
        rows = query.offset(offset).limit(limit).all()

        items = []
        for sef, student, amount_due, amount_paid in rows:
            items.append(StudentExamInfo(
                student_id=student.id,
                reg_number=student.reg_number,
                first_name=student.first_name,
                last_name=student.last_name,
                year_group=student.year_group.value if student.year_group else "Unknown",
                class_name=student.class_name.value if student.class_name else "Unknown",
                amount_due=float(amount_due or 0.0),
                amount_paid=float(amount_paid or 0.0),
                is_fully_paid=(float(amount_paid or 0.0) >= float(amount_due or 0.0)),
            ))

        return PaginatedStudentExamInfo(items=items, total=total, limit=limit, offset=offset)

    except Exception as e:
        logger.error(f"Error getting exam students: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Club Analytics Endpoints ============

@router.get("/clubs/overview", response_model=ClubAnalyticsResponse)
def get_clubs_overview(response: Response, db: Session = Depends(get_db)):
    """Get comprehensive club membership analytics."""
    try:
        clubs = db.query(Club).all()

        # Get all membership stats in one query
        club_stats = db.query(
            ClubMembership.club_id,
            func.count(ClubMembership.id).label('total_members'),
            func.sum(case((ClubMembership.payment_confirmed == True, 1), else_=0)).label('confirmed')
        ).group_by(ClubMembership.club_id).all()

        stats_map = {stat[0]: {'total': stat[1], 'confirmed': stat[2] or 0} for stat in club_stats}

        club_summaries = []
        total_memberships = 0
        total_revenue = 0.0

        for club in clubs:
            stats = stats_map.get(club.id, {'total': 0, 'confirmed': 0})
            total_members = stats['total']
            confirmed = stats['confirmed']
            pending = total_members - confirmed

            capacity_util = None
            if club.capacity and club.capacity > 0:
                capacity_util = round(total_members / club.capacity * 100, 1)

            revenue = confirmed * club.price

            club_summaries.append(ClubMembershipSummary(
                club_id=club.id,
                club_name=club.name,
                price=club.price,
                capacity=club.capacity,
                total_members=total_members,
                confirmed_members=confirmed,
                pending_members=pending,
                capacity_utilization=capacity_util,
                total_revenue=revenue
            ))

            total_memberships += total_members
            total_revenue += revenue

        # Cache for 5 minutes on client side
        response.headers["Cache-Control"] = "public, max-age=300"

        return ClubAnalyticsResponse(
            total_clubs=len(clubs),
            total_memberships=total_memberships,
            total_revenue=total_revenue,
            clubs=club_summaries
        )
    except Exception as e:
        logger.error(f"Error getting clubs overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clubs/members/{club_id}", response_model=PaginatedClubMemberInfo)
def get_club_members(
    club_id: str,
    payment_status: Optional[str] = None,  # "confirmed" or "pending"
    year_group: Optional[str] = None,
    search: Optional[str] = None,  # Search by name or reg number
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get list of members for a specific club with pagination."""
    try:
        club = db.query(Club).filter(Club.id == club_id).first()
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")

        # Build query with JOIN to get student data efficiently
        query = db.query(ClubMembership, Student).join(
            Student, ClubMembership.student_id == Student.id
        ).filter(
            ClubMembership.club_id == club_id
        )

        # Apply year group filter at SQL level
        if year_group:
            try:
                yg_enum = YearGroup(year_group)
                query = query.filter(Student.year_group == yg_enum)
            except ValueError:
                pass

        # Apply payment status filter at SQL level
        if payment_status == "confirmed":
            query = query.filter(ClubMembership.payment_confirmed == True)
        elif payment_status == "pending":
            query = query.filter(ClubMembership.payment_confirmed == False)

        # Apply search filter at SQL level
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                (func.lower(Student.first_name).like(search_term)) |
                (func.lower(Student.last_name).like(search_term)) |
                (func.lower(Student.reg_number).like(search_term))
            )

        # Get total count
        total = query.count()

        # Apply pagination at SQL level
        records = query.offset(offset).limit(limit).all()

        # Build response
        result = []
        for membership, student in records:
            result.append(ClubMemberInfo(
                student_id=student.id,
                reg_number=student.reg_number,
                first_name=student.first_name,
                last_name=student.last_name,
                year_group=student.year_group.value if student.year_group else "Unknown",
                class_name=student.class_name.value if student.class_name else "Unknown",
                payment_confirmed=membership.payment_confirmed,
                status=membership.status or "active"
            ))

        return PaginatedClubMemberInfo(
            items=result,
            total=total,
            limit=limit,
            offset=offset
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting club members: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Dashboard Overview Endpoint ============

@router.get("/dashboard/overview", response_model=DashboardOverview)
def get_dashboard_overview(response: Response, db: Session = Depends(get_db)):
    """Get high-level dashboard overview metrics."""
    try:
        # Get all counts in efficient queries
        total_students = db.query(func.count(Student.id)).scalar() or 0

        # School fees - count payments and sum SCHOOL_FEES payment items (avoids counting club share)
        school_fees_stats = db.query(
            func.count(Payment.id).label('payment_count')
        ).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).first()

        total_school_fees = (
            db.query(func.coalesce(func.sum(PaymentItem.amount), 0.0))
            .join(Payment, Payment.id == PaymentItem.payment_id)
            .filter(
                Payment.status == PaymentStatus.COMPLETED,
                PaymentItem.item_type == PaymentType.SCHOOL_FEES,
            )
            .scalar()
        )

        # Count distinct students who paid by collecting from all completed payments
        completed_payments = db.query(Payment.student_ids).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).all()
        paid_students_set = set()
        for payment in completed_payments:
            if payment.student_ids:
                if isinstance(payment.student_ids, list):
                    paid_students_set.update(payment.student_ids)
                else:
                    paid_students_set.add(payment.student_ids)
        paid_students = len(paid_students_set)

        school_fees_rate = (paid_students / total_students * 100) if total_students > 0 else 0

        # Exam fees - query StudentExamFee for registrations and payments
        exam_stats = db.query(
            func.count(func.distinct(StudentExamFee.student_id)).label('registrations'),
            func.coalesce(func.sum(case((StudentExamFee.paid == True, StudentExamFee.amount * (1 - StudentExamFee.discount_percentage / 100)), else_=0)), 0).label('total_collected')
        ).first()

        total_exam_registrations = exam_stats.registrations or 0
        total_exam_fees = exam_stats.total_collected or 0.0

        # Club revenue: sum CLUB_FEES payment items (accurate split from combined payments)
        club_revenue = (
            db.query(func.coalesce(func.sum(PaymentItem.amount), 0.0))
            .join(Payment, Payment.id == PaymentItem.payment_id)
            .filter(
                Payment.status == PaymentStatus.COMPLETED,
                PaymentItem.item_type == PaymentType.CLUB_FEES,
            )
            .scalar()
        )

        # Membership count still comes from club memberships
        total_club_memberships = db.query(func.count(func.distinct(ClubMembership.id))).filter(
            ClubMembership.payment_confirmed == True
        ).scalar() or 0

        # Cache for 5 minutes on client side
        response.headers["Cache-Control"] = "public, max-age=300"

        return DashboardOverview(
            total_students=total_students,
            school_fees_paid_count=paid_students,
            school_fees_unpaid_count=total_students - paid_students,
            school_fees_collection_rate=round(school_fees_rate, 1),
            total_school_fees_collected=total_school_fees,
            total_exam_registrations=total_exam_registrations,
            total_exam_fees_collected=total_exam_fees,
            total_club_memberships=total_club_memberships,
            total_club_revenue=club_revenue,
            recent_payments_count=school_fees_stats.payment_count or 0
        )
    except Exception as e:
        logger.error(f"Error getting dashboard overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))
