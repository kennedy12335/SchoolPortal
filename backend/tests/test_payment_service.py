import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from app.services.payment_service import (
    initialize_payment,
    _create_school_fees_records,
    _create_exam_fees_records,
    PAYSTACK_INITIALIZE_URL
)
from app.schemas.payment import (
    PaymentType,
    SchoolFeesPaymentData,
    ExamFeesPaymentData,
    ExamPaymentDetails
)
from app.models.payment import PaymentStatus, Payment, ExamPayment
from app.models.student_exam_fee import StudentExamFee


class TestInitializePayment:
    """Test suite for initialize_payment function"""

    @patch('app.services.payment_service.requests.post')
    def test_initialize_school_fees_payment_success(self, mock_post, test_db, mock_parent, mock_student, mock_env_vars):
        """Test successful school fees payment initialization"""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {
            "status": True,
            "message": "Authorization URL created",
            "data": {
                "authorization_url": "https://checkout.paystack.com/test123",
                "access_code": "test_access_code",
                "reference": "test_ref_123"
            }
        }
        mock_post.return_value = mock_response

        payment_data = SchoolFeesPaymentData(
            student_ids=["student-123"],
            amount=500.0,
                                                                     123",
            student_fee_ids=[],
            description="School fees payment"
        )

        result = initialize_payment(
            payment_type=PaymentType.SCHOOL_FEES,
            payment_            payment_            payment_            payment_            payment_            payment_            paymentlt            payment_            payment_            payment_f tes            payment_      t_not            payment_          _v            payment_            payment_is n            payment_     nt_data = SchoolFeesPaymentData(
            student_ids=["student-123"],
                                                                               re                                            dent_fe                                          fe          "
        )

                                             exc_                                                                                     _F                        ment_data=payment_data,
                db=test_db
            )

        ass        ass        ass         == 404
        assert "Parent" in str(exc_info.value.detail)


class TestCreateSchoolFeesRecords:
    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fee      """Test suite for _create_school  des    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_rec(Payment).fil    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_fees_recor    """Test suite for _create_school_feNDIN    """Test suite for _creesRecords:
    "    "    "    "    "    "    "    "    "    "  tion"""

    def test_create_exam_fees_records_success(self, test_db, mock_parent, mock_student, mock_exam_fees):
        """Test successful creation of exam fees payment records"""
        payment_data = ExamFeesPaymentData(
            exam_payments=[
                ExamPaymentDetails(exam_id="exam-igcse-123", amount_paid=150.0)
            ],
            student_id="student-123",
            amount=150.0,
            payment_method="paystack",
            parent_id="parent-123"
        )

        _create_exam_fees_records(payment_data, "test_ref_456", test_db)

        # Verify exam payment was created
        exam_payment = test_db.query(ExamPayment).filter(
            ExamPayment.payment_reference == "test_ref_456"
        ).first()
        assert exam_payment is not None
        assert exam_payment.amount_paid == 150.0
        assert exam_payment.status == PaymentStatus.PENDING
