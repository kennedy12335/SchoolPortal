# Testing Guide

This guide explains how to run tests for the payment service and router.

## Prerequisites

Make sure you have the following dependencies installed:

```bash
pip install pytest pytest-asyncio pytest-cov pytest-mock httpx
```

Or install all test dependencies at once:

```bash
pip install -r requirements-test.txt
```

## Running Tests

### Option 1: Using the test runner script (Recommended)

```bash
chmod +x run_tests.sh
./run_tests.sh
```

### Option 2: Using pytest directly

#### Run all payment tests:
```bash
python -m pytest tests/test_payment_service.py tests/test_payment_router.py -v
```

#### Run with coverage:
```bash
python -m pytest tests/ -v \
    --cov=app.services.payment_service \
    --cov=app.routers.payment \
    --cov-report=term-missing \
    --cov-branch
```

#### Run only service tests:
```bash
python -m pytest tests/test_payment_service.py -v
```

#### Run only router tests:
```bash
python -m pytest tests/test_payment_router.py -v
```

#### Run a specific test class:
```bash
python -m pytest tests/test_payment_service.py::TestInitializePayment -v
```

#### Run a specific test:
```bash
python -m pytest tests/test_payment_service.py::TestInitializePayment::test_initialize_school_fees_payment_success -v
```

### Option 3: Using conda environment

If you're using conda:

```bash
# Activate your conda environment
conda activate your_env_name

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov pytest-mock httpx

# Run tests
python -m pytest tests/ -v --cov=app.services.payment_service --cov=app.routers.payment
```

## Test Coverage

The test suite aims for 100% coverage of:
- `app/services/payment_service.py`
- `app/routers/payment.py`

After running tests with coverage, you can view:
- **Terminal output**: Shows line-by-line coverage
- **HTML report**: Open `htmlcov/index.html` in your browser for detailed coverage

## Test Structure

```
tests/
├── __init__.py
├── conftest.py                    # Shared fixtures and test setup
├── test_payment_service.py        # Payment service tests
└── test_payment_router.py         # Payment router tests
```

## Test Coverage Breakdown

### Payment Service Tests (`test_payment_service.py`)

- **`TestInitializeSplitPayment`**: Tests for `_initialize_split_payment_kobo()`
  - Success and failure scenarios
  - Exception handling

- **`TestCreateSchoolFeesSplit`**: Tests for `_create_school_fees_split()`
  - Valid split configuration
  - Missing account configurations

- **`TestCreateExamFeesSplit`**: Tests for `_create_exam_fees_split()`
  - IGCSE, SAT, Checkpoint, IELTS exams
  - Multiple exams consolidation
  - Unknown exam type handling

- **`TestProcessExamFeesSplit`**: Tests for `process_exam_fees_split()`
  - Successful split processing
  - Exam not found errors
  - Paystack errors

- **`TestProcessSchoolFeesSplit`**: Tests for `process_school_fees_split()`
  - Successful split processing
  - Paystack errors

- **`TestInitializePayment`**: Tests for `initialize_payment()`
  - School fees payment initialization
  - Exam fees payment initialization
  - Parent not found errors
  - Paystack API errors

- **`TestCreateSchoolFeesRecords`**: Tests for `_create_school_fees_records()`
  - Database record creation
  - Student not found handling

- **`TestCreateExamFeesRecords`**: Tests for `_create_exam_fees_records()`
  - Single and multiple exam records

### Payment Router Tests (`test_payment_router.py`)

- **`TestInitializePaymentEndpoint`**: Tests for `/initialize` endpoint
  - Successful initialization
  - Amount mismatch validation
  - Service errors

- **`TestGetPayments`**: Tests for `GET /payments/` endpoint
  - Empty database
  - With data
  - Pagination

- **`TestGetPayment`**: Tests for `GET /payments/{payment_id}` endpoint
  - Success
  - Not found

- **`TestVerifyPaymentStatus`**: Tests for `/verify/{payment_reference}` endpoint
  - Completed payments
  - Pending payments
  - Not found
  - API error fallback

- **`TestPaystackWebhook`**: Tests for `/webhook` endpoint
  - School fees success
  - Exam fees success
  - Missing signature
  - Invalid signature

- **`TestVerifyPaymentFunction`**: Tests for `verify_payment()` helper
  - Success
  - Correct headers

## Fixtures

Key fixtures available in `conftest.py`:

- `test_db`: In-memory SQLite database
- `mock_parent`: Pre-created parent record
- `mock_student`: Pre-created student record
- `mock_club`: Pre-created club record
- `mock_exam_fees`: Pre-created exam fee records (IGCSE, SAT, Checkpoint)
- `mock_paystack_init_success`: Mock Paystack initialization response
- `mock_paystack_split_success`: Mock Paystack split response
- `mock_env_vars`: Mock environment variables

## Troubleshooting

### Import errors
If you get import errors, make sure you're running pytest from the `backend` directory:
```bash
cd /Users/kennedydike/Git\ Projects/SchoolPayment/backend
python -m pytest tests/ -v
```

### Database errors
The tests use an in-memory SQLite database, so no PostgreSQL setup is needed.

### Conda environment issues
If using conda, ensure pytest is installed in your active environment:
```bash
conda list | grep pytest
```

If not installed:
```bash
pip install pytest pytest-asyncio pytest-cov pytest-mock httpx
```
