import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from app.models.base import Base
from app.models.payment import Payment, PaymentStatus, ExamPayment
from app.models.student import Student
from app.models.parent import Parent
from app.models.club import Club, ClubMembership
from app.models.fees import ExamFees
from app.models.fee import Fee
from app.models.student_fee import StudentFee
from app.models.student_exam_fee import StudentExamFee
from app.models.classes import YearGroup
import os


@pytest.fixture(scope="function")
def test_db():
    """Create a test database and return a session"""
    # Create an in-memory SQLite database for testing
    # check_same_thread=False allows the db to be used across threads in tests
    # StaticPool keeps the same connection for all threads
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def mock_parent(test_db: Session):
    """Create a mock parent for testing"""
    parent = Parent(
        id="parent-123",
        auth_id="auth",
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        phone="+2348012345678"
    )
    test_db.add(parent)
    test_db.commit()
    test_db.refresh(parent)
    return parent


@pytest.fixture
def mock_student(test_db: Session):
    """Create a mock student for testing"""
    from app.models.classes import YearGroup, ClassName
    student = Student(
        id="student-123",
        reg_number="123",
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@example.com",
        year_group=YearGroup.YEAR_10,
        class_name=ClassName.AMBER
    )
    test_db.add(student)
    test_db.commit()
    test_db.refresh(student)
    return student


@pytest.fixture
def mock_student_2(test_db: Session):
    """Create a second mock student for testing"""
    from app.models.classes import YearGroup, ClassName
    student = Student(
        id="student-456",
        reg_number="456",
        first_name="Jack",
        last_name="Smith",
        email="jack.smith@example.com",
        year_group=YearGroup.YEAR_11,
        class_name=ClassName.EMERALD
    )
    test_db.add(student)
    test_db.commit()
    test_db.refresh(student)
    return student


@pytest.fixture
def mock_club(test_db: Session):
    """Create a mock club for testing"""
    club = Club(
        id="club-123",
        name="Chess Club",
        description="Learn to play chess",
        price=50.0
    )
    test_db.add(club)
    test_db.commit()
    test_db.refresh(club)
    return club


@pytest.fixture
def mock_exam_fees(test_db):
    """Create mock exam fees for testing"""
    from app.models.fees import ExamFees
    exams = [
        ExamFees(
            id="exam-igcse-123",
            exam_name="IGCSE Mathematics",
            amount=150000.0,
            extra_fees=10000.0,
            allows_installments=False,
            applicable_grades=["YEAR_10", "YEAR_11"]
        ),
        ExamFees(
            id="exam-sat-456",
            exam_name="SAT Reasoning Test",
            amount=200000.0,
            extra_fees=15000.0,
            allows_installments=True,
            applicable_grades=["YEAR_12"]
        )
    ]
    for exam in exams:
        test_db.add(exam)
    test_db.commit()
    return exams[0]  # Return first exam as default


@pytest.fixture
def mock_fees(test_db: Session):
    """Create mock base fees for testing"""
    fees_data = [
        {"code": "TUITION", "name": "Tuition", "amount": 500000.0},
        {"code": "BOARDING", "name": "Boarding", "amount": 200000.0},
        {"code": "UTILITY", "name": "Utility", "amount": 50000.0},
        {"code": "PRIZE_GIVING", "name": "Prize Giving Day", "amount": 15000.0},
        {"code": "YEAR_BOOK", "name": "Year Book", "amount": 10000.0},
        {"code": "OFFERING_HAIRS", "name": "Offering & Hairs", "amount": 5000.0},
    ]
    
    fees = []
    for fee_data in fees_data:
        fee = Fee(
            id=f"fee-{fee_data['code'].lower()}",
            code=fee_data["code"],
            name=fee_data["name"],
            amount=fee_data["amount"],
        )
        test_db.add(fee)
        fees.append(fee)
    
    test_db.commit()
    for fee in fees:
        test_db.refresh(fee)
    return fees


@pytest.fixture
def mock_student_fees(test_db: Session, mock_student: Student, mock_fees: list):
    """Create mock student fees for testing"""
    student_fees = []
    for fee in mock_fees:
        student_fee = StudentFee(
            id=f"sf-{mock_student.id}-{fee.code}",
            student_id=mock_student.id,
            fee_id=fee.id,
            amount=fee.amount,
            paid=False,
        )
        test_db.add(student_fee)
        student_fees.append(student_fee)
    
    test_db.commit()
    for sf in student_fees:
        test_db.refresh(sf)
    return student_fees


@pytest.fixture
def mock_paystack_init_success():
    """Mock successful Paystack initialization response"""
    return {
        "status": True,
        "message": "Authorization URL created",
        "data": {
            "authorization_url": "https://checkout.paystack.com/test123",
            "access_code": "test_access_code",
            "reference": "test_ref_123456789"
        }
    }


@pytest.fixture
def mock_paystack_verify_success():
    """Mock successful Paystack verification response"""
    return {
        "status": True,
        "message": "Verification successful",
        "data": {
            "id": 987654321,
            "domain": "test",
            "status": "success",
            "reference": "test_ref_123456789",
            "amount": 50000,
            "message": None,
            "gateway_response": "Successful",
            "paid_at": "2024-01-15T12:30:00.000Z",
            "created_at": "2024-01-15T12:25:00.000Z",
            "channel": "card",
            "currency": "NGN",
            "metadata": {
                "payment_type": "school_fees",
                "parent_id": "parent-123"
            }
        }
    }


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set up mock environment variables"""
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", "sk_test_mock_secret_key")
    monkeypatch.setenv("tuition_account", "ACCT_tuition123")
    monkeypatch.setenv("club_account", "ACCT_club456")
    monkeypatch.setenv("exam_account", "ACCT_exam789")
    monkeypatch.setenv("sat_account", "ACCT_sat101")
    monkeypatch.setenv("school_fees_success_callback_url", "https://example.com/callback/school-fees")
    monkeypatch.setenv("exam_success_callback_url", "https://example.com/callback/exam-fees")


@pytest.fixture
def mock_exam(test_db):
    """Create a single mock exam fee for testing"""
    from app.models.fees import ExamFees
    exam = ExamFees(
        id="exam-igcse-123",
        exam_name="IGCSE Mathematics",
        amount=150000.0,
        extra_fees=10000.0,
        allows_installments=False,
        applicable_grades=["YEAR_10", "YEAR_11"]
    )
    test_db.add(exam)
    test_db.commit()
    test_db.refresh(exam)
    return exam
