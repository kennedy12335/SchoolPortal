from uuid import uuid4
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from app.routers.payment import router, verify_payment
from app.schemas.payment import PaymentCreate, PaymentInitializationResult
from app.models.payment import Payment, PaymentStatus, ExamPayment
from app.routers.payment import router as payment_router
from app.database import get_db
import json
import hmac
import hashlib


@pytest.fixture
def app():
    """Create a FastAPI test application"""
    app = FastAPI()
    app.include_router(router, prefix="/payments")
    return app


@pytest.fixture
def client(app):
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def mock_get_db(test_db):
    """Mock the get_db dependency"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    return override_get_db


class TestInitializePaymentEndpoint:
    """Test suite for /initialize endpoint"""

    @patch('app.routers.payment.calculate_fees')
    @patch('app.routers.payment.initialize_payment')
    def test_initialize_payment_success(
        self, mock_init_payment, mock_calc_fees, client, test_db, mock_parent, mock_student, mock_env_vars
    ):
        """Test successful payment initialization"""


        # Override the dependency
        payment_router.dependency_overrides = {}

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        payment_router.dependency_overrides[get_db] = override_get_db

        # Mock fee calculation
        mock_fee_response = Mock()
        mock_fee_response.total_amount = 500.0
        mock_calc_fees.return_value = mock_fee_response

        # Mock payment initialization
        mock_init_payment.return_value = PaymentInitializationResult(
            status=True,
            message="Payment initialized successfully",
            data={
                "authorization_url": "https://checkout.paystack.com/test123",
                "access_code": "test_access",
                "reference": "test_ref_123"
            }
        )

        payment_data = {
            "student_ids": ["student-123"],
            "amount": 500.0,
            "club_amount": 50.0,
            "payment_method": "paystack",
            "parent_id": "parent-123",
            "student_club_ids": {"student-123": ["club-1"]},
            "description": "School fees payment"
        }

        response = client.post("/payments/initialize", json=payment_data)

        assert response.status_code == 200
        data = response.json()
        assert "authorization_url" in data
        assert data["reference"] == "test_ref_123"

    @patch('app.routers.payment.calculate_fees')
    def test_initialize_payment_amount_mismatch(
        self, mock_calc_fees, client, test_db, mock_parent, mock_student
    ):
        """Test payment initialization with mismatched amount"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        payment_router.dependency_overrides[get_db] = override_get_db

        # Mock fee calculation with different amount
        mock_fee_response = Mock()
        mock_fee_response.total_amount = 600.0  # Different from submitted amount
        mock_calc_fees.return_value = mock_fee_response

        payment_data = {
            "student_ids": ["student-123"],
            "amount": 500.0,  # Submitted amount
            "club_amount": 50.0,
            "payment_method": "paystack",
            "parent_id": "parent-123",
            "student_club_ids": {"student-123": ["club-1"]},
            "description": "School fees payment"
        }

        response = client.post("/payments/initialize", json=payment_data)

        assert response.status_code == 400
        assert "Invalid amount" in response.json()["detail"]

    @patch('app.routers.payment.calculate_fees')
    @patch('app.routers.payment.initialize_payment')
    def test_initialize_payment_service_error(
        self, mock_init_payment, mock_calc_fees, client, test_db, mock_parent
    ):
        """Test payment initialization when service returns error"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        payment_router.dependency_overrides[get_db] = override_get_db

        mock_fee_response = Mock()
        mock_fee_response.total_amount = 500.0
        mock_calc_fees.return_value = mock_fee_response

        # Mock initialization failure
        mock_init_payment.return_value = PaymentInitializationResult(
            status=False,
            message="Payment initialization failed",
            data=None
        )

        payment_data = {
            "student_ids": ["student-123"],
            "amount": 500.0,
            "club_amount": 50.0,
            "payment_method": "paystack",
            "parent_id": "parent-123",
            "student_club_ids": {},
            "description": "School fees"
        }

        response = client.post("/payments/initialize", json=payment_data)

        assert response.status_code == 400
        assert "Payment initialization failed" in response.json()["detail"]


class TestGetPayments:
    """Test suite for GET /payments endpoint"""

    def test_get_payments_with_data(self, app, client, test_db, mock_parent):
        """Test getting payments with existing data"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db

        # Create test payments
        payment1 = Payment(
            student_ids=["student-123"],
            amount=500.0,
            payment_reference="ref_001",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.PENDING,
            description="Test payment 1"
        )
        payment2 = Payment(
            student_ids=["student-456"],
            amount=300.0,
            payment_reference="ref_002",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.COMPLETED,
            description="Test payment 2"
        )
        test_db.add(payment1)
        test_db.add(payment2)
        test_db.commit()

        response = client.get("/payments/")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

class TestGetPayment:
    """Test suite for GET /payments/{payment_id} endpoint"""

    def test_get_payment_success(self, app, client, test_db, mock_parent):
        """Test getting a specific payment"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db

        # Create test payment
        payment = Payment(
            student_ids=["student-123"],
            amount=500.0,
            payment_reference="ref_test",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.PENDING,
            description="Test payment"
        )
        test_db.add(payment)
        test_db.commit()
        test_db.refresh(payment)

        response = client.get(f"/payments/{payment.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["payment_reference"] == "ref_test"
        assert data["amount"] == 500.0


class TestVerifyPaymentStatus:
    """Test suite for POST /verify/{payment_reference} endpoint"""

    @patch('app.routers.payment.verify_payment')
    def test_verify_payment_completed(self, mock_verify, app, client, test_db, mock_parent):
        """Test verifying a completed payment"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db

        # Create test payment
        payment = Payment(
            student_ids=["student-123"],
            amount=500.0,
            payment_reference="ref_verify_test",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.PENDING
        )
        test_db.add(payment)
        test_db.commit()

        # Mock Paystack verification
        mock_verify.return_value = {
            "status": True,
            "data": {"status": "success"}
        }

        response = client.post("/payments/verify/ref_verify_test")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"

        # Verify payment status was updated
        test_db.refresh(payment)
        assert payment.status == PaymentStatus.COMPLETED

    @patch('app.routers.payment.verify_payment')
    def test_verify_payment_pending(self, mock_verify, app, client, test_db, mock_parent):
        """Test verifying a pending payment"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db

        payment = Payment(
            student_ids=["student-123"],
            amount=500.0,
            payment_reference="ref_pending",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.PENDING
        )
        test_db.add(payment)
        test_db.commit()

        mock_verify.return_value = {
            "status": True,
            "data": {"status": "pending"}
        }

        response = client.post("/payments/verify/ref_pending")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"

    def test_verify_payment_not_found(self, client, test_db):
        """Test verifying a non-existent payment"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        payment_router.dependency_overrides[get_db] = override_get_db

        response = client.post("/payments/verify/non_existent_ref")

        assert response.status_code == 404
        assert "Payment not found" in response.json()["detail"]

    @patch('app.routers.payment.verify_payment')
    def test_verify_payment_api_error_fallback(self, mock_verify, app, client, test_db, mock_parent):
        """Test fallback to local status when Paystack verification fails"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db

        payment = Payment(
            student_ids=["student-123"],
            amount=500.0,
            payment_reference="ref_fallback",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.COMPLETED
        )
        test_db.add(payment)
        test_db.commit()

        # Mock Paystack verification failure
        mock_verify.side_effect = Exception("API error")

        response = client.post("/payments/verify/ref_fallback")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"


class TestPaystackWebhook:
    """Test suite for POST /webhook endpoint"""

    @patch('app.routers.payment.verify_payment')
    @patch('app.routers.payment.update_payment_records')
    def test_webhook_school_fees_success(
        self, mock_update_payment, mock_verify, app, client, test_db, mock_parent, mock_student, mock_env_vars
    ):
        """Test successful webhook for school fees payment"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db

        # Create test payment
        payment = Payment(
            student_ids=["student-123"],
            amount=500.0,
            payment_reference="webhook_ref_123",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.PENDING
        )
        test_db.add(payment)
        test_db.commit()

        # Mock verification
        mock_verify.return_value = {
            "status": True,
            "data": {"status": "success"}
        }

        # Mock update function
        mock_update_payment.return_value = None

        # Prepare webhook payload
        payload = {
            "event": "charge.success",
            "data": {
                "reference": "webhook_ref_123",
                "amount": 50000,
                "metadata": {
                    "payment_type": "school_fees",
                    "parent_id": "parent-123"
                }
            }
        }

        payload_json = json.dumps(payload)
        signature = hmac.new(
            "sk_test_mock_secret_key".encode('utf-8'),
            payload_json.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()

        response = client.post(
            "/payments/webhook",
            content=payload_json,
            headers={
                "x-paystack-signature": signature,
                "content-type": "application/json"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    @patch('app.routers.payment.verify_payment')
    @patch('app.routers.payment.update_exam_payment_records')
    def test_webhook_exam_fees_success(
        self, mock_update_exam, mock_verify, client, test_db, mock_parent, mock_student, mock_env_vars
    ):
        """Test successful webhook for exam fees payment"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        payment_router.dependency_overrides[get_db] = override_get_db

        # Create test exam payment
        exam_payment = ExamPayment(
            exam_id="exam-123",
            student_id="student-123",
            amount_paid=150.0,
            payment_reference="exam_webhook_ref",
            payment_method="paystack",
            payer_id="parent-123",
            status=PaymentStatus.PENDING
        )
        test_db.add(exam_payment)
        test_db.commit()

        # Mock verification
        mock_verify.return_value = {
            "status": True,
            "data": {"status": "success"}
        }

        # Mock update function
        mock_update_exam.return_value = None

        # Prepare webhook payload
        payload = {
            "event": "charge.success",
            "data": {
                "reference": "exam_webhook_ref",
                "amount": 15000,
                "metadata": {
                    "payment_type": "exam_fees",
                    "student_id": "student-123"
                }
            }
        }

        payload_json = json.dumps(payload)
        signature = hmac.new(
            "sk_test_mock_secret_key".encode('utf-8'),
            payload_json.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()

        response = client.post(
            "/payments/webhook",
            content=payload_json,
            headers={
                "x-paystack-signature": signature,
                "content-type": "application/json"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_webhook_missing_signature(self, client, test_db, mock_env_vars):
        """Test webhook with missing signature"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        payment_router.dependency_overrides[get_db] = override_get_db

        payload = {
            "event": "charge.success",
            "data": {"reference": "test_ref"}
        }

        response = client.post(
            "/payments/webhook",
            json=payload
        )

        assert response.status_code == 400
        assert "Signature missing" in response.json()["detail"]

    def test_webhook_invalid_signature(self, client, test_db, mock_env_vars):
        """Test webhook with invalid signature"""

        def override_get_db():
            try:
                yield test_db
            finally:
                pass

        payment_router.dependency_overrides[get_db] = override_get_db

        payload = {
            "event": "charge.success",
            "data": {"reference": "test_ref"}
        }

        response = client.post(
            "/payments/webhook",
            json=payload,
            headers={"x-paystack-signature": "invalid_signature"}
        )

        assert response.status_code == 400
        assert "Invalid signature" in response.json()["detail"]


class TestVerifyPaymentFunction:
    """Test suite for verify_payment helper function"""

    @patch('app.routers.payment.requests.get')
    def test_verify_payment_success(self, mock_get, mock_env_vars):
        """Test successful payment verification"""
        mock_response = Mock()
        mock_response.json.return_value = {
            "status": True,
            "message": "Verification successful",
            "data": {
                "status": "success",
                "reference": "test_ref_123"
            }
        }
        mock_get.return_value = mock_response

        result = verify_payment("test_ref_123")

        assert result["status"] is True
        assert result["data"]["status"] == "success"
        mock_get.assert_called_once()

    @patch('app.routers.payment.requests.get')
    def test_verify_payment_with_correct_headers(self, mock_get, mock_env_vars):
        """Test that verify_payment uses correct authorization headers"""
        mock_response = Mock()
        mock_response.json.return_value = {"status": True, "data": {}}
        mock_get.return_value = mock_response

        verify_payment("test_ref")

        # Verify the request was made with correct headers
        call_args = mock_get.call_args
        headers = call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer sk_test_mock_secret_key"
        assert headers["Content-Type"] == "application/json"
