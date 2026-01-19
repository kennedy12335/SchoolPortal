import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi import HTTPException
from app.services.payment_service import (
    _initialize_split_payment_kobo,
    _create_school_fees_split,
    _create_exam_fees_split,
    process_exam_fees_split,
    process_school_fees_split,
    initialize_payment,
    _create_school_fees_records,
    _create_exam_fees_records,
    PAYSTACK_INITIALIZE_URL,
    PAYSTACK_SPLIT_URL
)
from app.schemas.payment import (
    PaymentType,
    SchoolFeesPaymentData,
    ExamFeesPaymentData,
    ExamPaymentDetails
)
from app.models.payment import PaymentStatus, Payment, ExamPayment
from app.models.club import ClubMembership
from app.models.student_exam_fee import StudentExamFee


class TestInitializeSplitPayment:
    """Test suite for _initialize_split_payment_kobo function"""

    @patch('app.services.payment_service.requests.post')
    def test_initialize_split_payment_success(self, mock_post, mock_env_vars, mock_paystack_split_success):
        """Test successful split payment initialization"""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = mock_paystack_split_success
        mock_post.return_value = mock_response

        split_config = [
            {"subaccount": "ACCT_tuition123", "share": 40000},
            {"subaccount": "ACCT_club456", "share": 10000}
        ]

        result = _initialize_split_payment_kobo(split_config)

        assert result["status"] is True
        assert "data" in result
        assert result["data"]["split_code"] == "SPL_test123"
        mock_post.assert_called_once()

    @patch('app.services.payment_service.requests.post')
    def test_initialize_split_payment_failure(self, mock_post, mock_env_vars):
        """Test failed split payment initialization"""
        mock_response = Mock()
        mock_response.ok = False
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "status": False,
            "message": "Invalid subaccount"
        }
        mock_post.return_value = mock_response

        split_config = [{"subaccount": "INVALID", "share": 10000}]

        result = _initialize_split_payment_kobo(split_config)

        assert result["status"] is False
        assert "Invalid subaccount" in result["message"]

    @patch('app.services.payment_service.requests.post')
    def test_initialize_split_payment_exception(self, mock_post, mock_env_vars):
        """Test exception handling in split payment initialization"""
        mock_post.side_effect = Exception("Network error")

        split_config = [{"subaccount": "ACCT_test", "share": 10000}]

        result = _initialize_split_payment_kobo(split_config)

        assert result["status"] is False
        assert "Request failed" in result["message"]


class TestCreateSchoolFeesSplit:
    """Test suite for _create_school_fees_split function"""

    def test_create_school_fees_split_success(self, mock_env_vars):
        """Test successful school fees split configuration"""
        tuition_share_kobo = 40000
        club_share_kobo = 10000

        result = _create_school_fees_split(tuition_share_kobo, club_share_kobo)

        assert len(result) == 2
        assert result[0]["subaccount"] == "ACCT_tuition123"
        assert result[0]["share"] == 40000
        assert result[1]["subaccount"] == "ACCT_club456"
        assert result[1]["share"] == 10000

    def test_create_school_fees_split_missing_tuition_account(self, monkeypatch):
        """Test error when tuition account is not configured"""
        monkeypatch.setenv("club_account", "ACCT_club456")
        monkeypatch.delenv("tuition_account", raising=False)

        with pytest.raises(HTTPException) as exc_info:
            _create_school_fees_split(40000, 10000)

        assert exc_info.value.status_code == 500
        assert "Tuition or club subaccount not configured" in str(exc_info.value.detail)

    def test_create_school_fees_split_missing_club_account(self, monkeypatch):
        """Test error when club account is not configured"""
        monkeypatch.setenv("tuition_account", "ACCT_tuition123")
        monkeypatch.delenv("club_account", raising=False)

        with pytest.raises(HTTPException) as exc_info:
            _create_school_fees_split(40000, 10000)

        assert exc_info.value.status_code == 500
        assert "Tuition or club subaccount not configured" in str(exc_info.value.detail)


class TestCreateExamFeesSplit:
    """Test suite for _create_exam_fees_split function"""

    def test_create_exam_fees_split_igcse(self, mock_env_vars):
        """Test exam fees split for IGCSE exam"""
        exam_shares = [
            {"exam_id": "exam-1", "exam_name": "IGCSE Mathematics", "share_kobo": 15000}
        ]

        result = _create_exam_fees_split(exam_shares)

        assert len(result) == 1
        assert result[0]["subaccount"] == "ACCT_exam789"
        assert result[0]["share"] == 15000

    def test_create_exam_fees_split_sat(self, mock_env_vars):
        """Test exam fees split for SAT exam"""
        exam_shares = [
            {"exam_id": "exam-2", "exam_name": "SAT Reasoning Test", "share_kobo": 20000}
        ]

        result = _create_exam_fees_split(exam_shares)

        assert len(result) == 1
        assert result[0]["subaccount"] == "ACCT_sat101"
        assert result[0]["share"] == 20000

    def test_create_exam_fees_split_checkpoint(self, mock_env_vars):
        """Test exam fees split for Checkpoint exam"""
        exam_shares = [
            {"exam_id": "exam-3", "exam_name": "Cambridge Checkpoint Science", "share_kobo": 10000}
        ]

        result = _create_exam_fees_split(exam_shares)

        assert len(result) == 1
        assert result[0]["subaccount"] == "ACCT_exam789"
        assert result[0]["share"] == 10000

    def test_create_exam_fees_split_ielts(self, mock_env_vars):
        """Test exam fees split for IELTS exam"""
        exam_shares = [
            {"exam_id": "exam-4", "exam_name": "IELTS Academic", "share_kobo": 18000}
        ]

        result = _create_exam_fees_split(exam_shares)

        assert len(result) == 1
        assert result[0]["subaccount"] == "ACCT_sat101"
        assert result[0]["share"] == 18000

    def test_create_exam_fees_split_multiple_exams_same_account(self, mock_env_vars):
        """Test exam fees split with multiple exams going to the same account"""
        exam_shares = [
            {"exam_id": "exam-1", "exam_name": "IGCSE Mathematics", "share_kobo": 15000},
            {"exam_id": "exam-2", "exam_name": "Cambridge Checkpoint Science", "share_kobo": 10000}
        ]

        result = _create_exam_fees_split(exam_shares)

        # Both should consolidate to the same account
        assert len(result) == 1
        assert result[0]["subaccount"] == "ACCT_exam789"
        assert result[0]["share"] == 25000

    def test_create_exam_fees_split_multiple_exams_different_accounts(self, mock_env_vars):
        """Test exam fees split with multiple exams going to different accounts"""
        exam_shares = [
            {"exam_id": "exam-1", "exam_name": "IGCSE Mathematics", "share_kobo": 15000},
            {"exam_id": "exam-2", "exam_name": "SAT Reasoning Test", "share_kobo": 20000}
        ]

        result = _create_exam_fees_split(exam_shares)

        assert len(result) == 2
        # Sort to ensure consistent order
        result_sorted = sorted(result, key=lambda x: x["share"])
        assert result_sorted[0]["share"] == 15000
        assert result_sorted[1]["share"] == 20000

    def test_create_exam_fees_split_unknown_exam_type(self, mock_env_vars):
        """Test exam fees split with unknown exam type falls back to default"""
        exam_shares = [
            {"exam_id": "exam-unknown", "exam_name": "Unknown Exam Type", "share_kobo": 12000}
        ]

        result = _create_exam_fees_split(exam_shares)

        assert len(result) == 1
        assert result[0]["subaccount"] == "ACCT_exam789"  # Falls back to default exam account
        assert result[0]["share"] == 12000

    def test_create_exam_fees_split_missing_exam_account(self, monkeypatch):
        """Test error when no exam account is configured"""
        monkeypatch.delenv("exam_account", raising=False)
        monkeypatch.delenv("sat_account", raising=False)

        exam_shares = [
            {"exam_id": "exam-1", "exam_name": "Unknown Exam", "share_kobo": 10000}
        ]

        with pytest.raises(HTTPException) as exc_info:
            _create_exam_fees_split(exam_shares)

        assert exc_info.value.status_code == 500
        assert "No subaccount configured for exam" in str(exc_info.value.detail)


class TestProcessExamFeesSplit:
    """Test suite for process_exam_fees_split function"""

    @patch('app.services.payment_service._initialize_split_payment_kobo')
    def test_process_exam_fees_split_success(
        self, mock_init_split, test_db, mock_parent, mock_student, mock_exam_fees, mock_env_vars
    ):
        """Test successful exam fees split processing"""
        mock_init_split.return_value = {
            "status": True,
            "data": {"split_code": "SPL_exam_123"}
        }

        exam_data = ExamFeesPaymentData(
            exam_payments=[
                ExamPaymentDetails(exam_id="exam-igcse-123", amount_paid=150.0),
                ExamPaymentDetails(exam_id="exam-sat-456", amount_paid=200.0)
            ],
            student_id="student-123",
            amount=350.0,
            payment_method="paystack",
            parent_id="parent-123"
        )

        metadata = {"payment_type": "exam_fees", "parent_id": "parent-123"}
        net_amount_kobo = 35000

        split_code, updated_metadata, callback_url = process_exam_fees_split(
            exam_data, net_amount_kobo, metadata, test_db
        )

        assert split_code == "SPL_exam_123"
        assert "exam_shares" in updated_metadata
        assert len(updated_metadata["exam_shares"]) == 2
        assert updated_metadata["student_id"] == "student-123"
        assert callback_url == "https://example.com/callback/exam-fees"

    @patch('app.services.payment_service._initialize_split_payment_kobo')
    def test_process_exam_fees_split_exam_not_found(
        self, mock_init_split, test_db, mock_parent, mock_student, mock_env_vars
    ):
        """Test error when exam is not found"""
        exam_data = ExamFeesPaymentData(
            exam_payments=[
                ExamPaymentDetails(exam_id="non-existent-exam", amount_paid=150.0)
            ],
            student_id="student-123",
            amount=150.0,
            payment_method="paystack",
            parent_id="parent-123"
        )

        metadata = {"payment_type": "exam_fees"}
        net_amount_kobo = 15000

        with pytest.raises(HTTPException) as exc_info:
            process_exam_fees_split(exam_data, net_amount_kobo, metadata, test_db)

        assert exc_info.value.status_code == 404
        assert "not found" in str(exc_info.value.detail).lower()

    @patch('app.services.payment_service._initialize_split_payment_kobo')
    def test_process_exam_fees_split_paystack_error(
        self, mock_init_split, test_db, mock_parent, mock_student, mock_exam_fees, mock_env_vars
    ):
        """Test error when Paystack split initialization fails"""
        mock_init_split.return_value = {
            "status": False,
            "message": "Invalid split configuration"
        }

        exam_data = ExamFeesPaymentData(
            exam_payments=[
                ExamPaymentDetails(exam_id="exam-igcse-123", amount_paid=150.0)
            ],
            student_id="student-123",
            amount=150.0,
            payment_method="paystack",
            parent_id="parent-123"
        )

        metadata = {"payment_type": "exam_fees"}
        net_amount_kobo = 15000

        with pytest.raises(HTTPException) as exc_info:
            process_exam_fees_split(exam_data, net_amount_kobo, metadata, test_db)

        assert exc_info.value.status_code == 400
        assert "Paystack split error" in str(exc_info.value.detail)


class TestProcessSchoolFeesSplit:
    """Test suite for process_school_fees_split function"""

    @patch('app.services.payment_service._initialize_split_payment_kobo')
    def test_process_school_fees_split_success(self, mock_init_split, mock_env_vars):
        """Test successful school fees split processing"""
        mock_init_split.return_value = {
            "status": True,
            "data": {"split_code": "SPL_school_123"}
        }

        school_data = SchoolFeesPaymentData(
            student_ids=["student-123", "student-456"],
            amount=500.0,
            club_amount=100.0,
            payment_method="paystack",
            parent_id="parent-123",
            student_club_ids={"student-123": ["club-1"], "student-456": ["club-2"]},
            description="School fees payment"
        )

        metadata = {"payment_type": "school_fees", "parent_id": "parent-123"}
        total_amount_kobo = 50000

        split_code, updated_metadata, callback_url = process_school_fees_split(
            school_data, total_amount_kobo, metadata
        )

        assert split_code == "SPL_school_123"
        assert "tuition_share_naira" in updated_metadata
        assert "club_share_naira" in updated_metadata
        assert updated_metadata["tuition_share_naira"] == 400.0
        assert updated_metadata["club_share_naira"] == 100.0
        assert callback_url == "https://example.com/callback/school-fees"

    @patch('app.services.payment_service._initialize_split_payment_kobo')
    def test_process_school_fees_split_paystack_error(self, mock_init_split, mock_env_vars):
        """Test error when Paystack split initialization fails"""
        mock_init_split.return_value = {
            "status": False,
            "message": "Split creation failed"
        }

        school_data = SchoolFeesPaymentData(
            student_ids=["student-123"],
            amount=400.0,
            club_amount=50.0,
            payment_method="paystack",
            parent_id="parent-123",
            student_club_ids={"student-123": ["club-1"]},
            description="School fees"
        )

        metadata = {"payment_type": "school_fees"}
        total_amount_kobo = 40000

        with pytest.raises(HTTPException) as exc_info:
            process_school_fees_split(school_data, total_amount_kobo, metadata)

        assert exc_info.value.status_code == 400
        assert "Paystack split error" in str(exc_info.value.detail)


class TestInitializePayment:
    """Test suite for initialize_payment function"""

    @patch('app.services.payment_service.requests.post')
    @patch('app.services.payment_service.process_school_fees_split')
    def test_initialize_school_fees_payment_success(
        self, mock_process_split, mock_post, test_db, mock_parent, mock_student, mock_env_vars
    ):
        """Test successful school fees payment initialization"""
        mock_process_split.return_value = (
            "SPL_school_123",
            {
                "payment_type": "school_fees",
                "parent_id": "parent-123",
                "student_ids": ["student-123"],
                "tuition_share_naira": 350.0,
                "club_share_naira": 50.0
            },
            "https://example.com/callback/school-fees"
        )

        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "status": True,
            "message": "Authorization URL created",
            "data": {
                "authorization_url": "https://checkout.paystack.com/test123",
                "access_code": "test_access",
                "reference": "test_ref_123"
            }
        }
        mock_post.return_value = mock_response

        payment_data = SchoolFeesPaymentData(
            student_ids=["student-123"],
            amount=400.0,
            club_amount=50.0,
            payment_method="paystack",
            parent_id="parent-123",
            student_club_ids={"student-123": ["club-1"]},
            description="School fees payment"
        )

        result = initialize_payment(PaymentType.SCHOOL_FEES, payment_data, test_db)

        assert result.status is True
        assert result.message == "Payment initialized successfully"
        assert "data" in result.model_dump()
        mock_post.assert_called_once()

    @patch('app.services.payment_service.requests.post')
    @patch('app.services.payment_service.process_exam_fees_split')
    def test_initialize_exam_fees_payment_success(
        self, mock_process_split, mock_post, test_db, mock_parent, mock_student, mock_exam_fees, mock_env_vars
    ):
        """Test successful exam fees payment initialization"""
        mock_process_split.return_value = (
            "SPL_exam_123",
            {
                "payment_type": "exam_fees",
                "parent_id": "parent-123",
                "student_id": "student-123",
                "exam_shares": [{"exam_id": "exam-igcse-123", "share_naira": 150.0}]
            },
            "https://example.com/callback/exam-fees"
        )

        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "status": True,
            "message": "Authorization URL created",
            "data": {
                "authorization_url": "https://checkout.paystack.com/exam123",
                "access_code": "exam_access",
                "reference": "exam_ref_123"
            }
        }
        mock_post.return_value = mock_response

        payment_data = ExamFeesPaymentData(
            exam_payments=[
                ExamPaymentDetails(exam_id="exam-igcse-123", amount_paid=150.0)
            ],
            student_id="student-123",
            amount=150.0,
            payment_method="paystack",
            parent_id="parent-123"
        )

        result = initialize_payment(PaymentType.EXAM_FEES, payment_data, test_db)

        assert result.status is True
        assert result.message == "Payment initialized successfully"
        mock_post.assert_called_once()

    def test_initialize_payment_parent_not_found(self, test_db, mock_env_vars):
        """Test error when parent is not found"""
        payment_data = SchoolFeesPaymentData(
            student_ids=["student-123"],
            amount=400.0,
            club_amount=50.0,
            payment_method="paystack",
            parent_id="non-existent-parent",
            student_club_ids={},
            description="School fees"
        )

        with pytest.raises(HTTPException) as exc_info:
            initialize_payment(PaymentType.SCHOOL_FEES, payment_data, test_db)

        assert exc_info.value.status_code == 404
        assert "Parent" in str(exc_info.value.detail)
        assert "not found" in str(exc_info.value.detail)

    @patch('app.services.payment_service.requests.post')
    @patch('app.services.payment_service.process_school_fees_split')
    def test_initialize_payment_paystack_api_error(
        self, mock_process_split, mock_post, test_db, mock_parent, mock_env_vars
    ):
        """Test error when Paystack API returns an error"""
        mock_process_split.return_value = (
            "SPL_school_123",
            {"payment_type": "school_fees", "parent_id": "parent-123"},
            "https://example.com/callback/school-fees"
        )

        mock_response = Mock()
        mock_response.ok = False
        mock_response.status_code = 400
        mock_response.text = "Invalid API key"
        mock_post.return_value = mock_response

        payment_data = SchoolFeesPaymentData(
            student_ids=["student-123"],
            amount=400.0,
            club_amount=50.0,
            payment_method="paystack",
            parent_id="parent-123",
            student_club_ids={},
            description="School fees"
        )

        with pytest.raises(HTTPException) as exc_info:
            initialize_payment(PaymentType.SCHOOL_FEES, payment_data, test_db)

        assert exc_info.value.status_code == 400
        assert "Failed to initialize payment" in str(exc_info.value.detail)


class TestCreateSchoolFeesRecords:
    """Test suite for _create_school_fees_records function"""

    def test_create_school_fees_records_success(
        self, test_db, mock_parent, mock_student, mock_student_2, mock_club
    ):
        """Test successful creation of school fees payment records"""
        payment_data = SchoolFeesPaymentData(
            student_ids=["student-123", "student-456"],
            amount=500.0,
            club_amount=100.0,
            payment_method="paystack",
            parent_id="parent-123",
            student_club_ids={
                "student-123": ["club-123"],
                "student-456": ["club-123"]
            },
            description="School fees payment"
        )

        _create_school_fees_records(payment_data, "test_ref_123", test_db)

        # Verify payment record was created
        payment = test_db.query(Payment).filter(
            Payment.payment_reference == "test_ref_123"
        ).first()
        assert payment is not None
        assert payment.amount == 500.0
        assert payment.status == PaymentStatus.PENDING
        assert payment.payer_id == "parent-123"

        # Verify club memberships were created
        memberships = test_db.query(ClubMembership).all()
        assert len(memberships) == 2
        assert all(m.payment_confirmed is False for m in memberships)

    def test_create_school_fees_records_student_not_found(self, test_db, mock_parent):
        """Test handling when student is not found"""
        payment_data = SchoolFeesPaymentData(
            student_ids=["non-existent-student"],
            amount=400.0,
            club_amount=50.0,
            payment_method="paystack",
            parent_id="parent-123",
            student_club_ids={"non-existent-student": ["club-1"]},
            description="School fees"
        )

        # Should not raise an error, just log a warning
        _create_school_fees_records(payment_data, "test_ref_456", test_db)

        # Payment record should still be created
        payment = test_db.query(Payment).filter(
            Payment.payment_reference == "test_ref_456"
        ).first()
        assert payment is not None


class TestCreateExamFeesRecords:
    """Test suite for _create_exam_fees_records function"""

    def test_create_exam_fees_records_success(
        self, test_db, mock_student, mock_exam
    ):
        """Test creating exam fees records successfully"""
        payment_data = ExamFeesPaymentData(
            exam_payments=[ExamPaymentDetails(exam_id=mock_exam.id, amount_paid=150000.0)],
            student_id=mock_student.id,
            amount=150000.0,
            payment_method="paystack",
            parent_id="parent_123"
        )

        _create_exam_fees_records(payment_data, "exam_ref_123", test_db)
        
        # Verify StudentExamFee was created
        student_exam_fee = test_db.query(StudentExamFee).filter_by(
            student_id=mock_student.id,
            exam_fee_id=mock_exam.id
        ).first()
        assert student_exam_fee is not None
        assert student_exam_fee.amount == 150000.0
        
        # Verify ExamPayment was created
        exam_payment = test_db.query(ExamPayment).filter_by(
            payment_reference="exam_ref_123"
        ).first()
        assert exam_payment is not None
        assert exam_payment.student_exam_fee_id == student_exam_fee.id
        assert exam_payment.amount_paid == 150000.0
        assert exam_payment.status == PaymentStatus.PENDING

    def test_create_exam_fees_records_single_exam(
        self, test_db, mock_student, mock_exam
    ):
        """Test creating exam fees records for a single exam"""
        payment_data = ExamFeesPaymentData(
            exam_payments=[ExamPaymentDetails(exam_id=mock_exam.id, amount_paid=75000.0)],
            student_id=mock_student.id,
            amount=75000.0,
            payment_method="paystack",
            parent_id="parent_456"
        )

        _create_exam_fees_records(payment_data, "exam_ref_456", test_db)
        
        # Verify records
        student_exam_fee = test_db.query(StudentExamFee).filter_by(
            student_id=mock_student.id,
            exam_fee_id=mock_exam.id
        ).first()
        assert student_exam_fee is not None
        
        exam_payment = test_db.query(ExamPayment).filter_by(
            payment_reference="exam_ref_456"
        ).first()
        assert exam_payment is not None
        assert exam_payment.student_exam_fee_id == student_exam_fee.id
