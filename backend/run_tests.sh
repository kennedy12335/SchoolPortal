#!/bin/bash

# Test runner script for payment service and router tests
# Works with both conda and virtualenv

echo "=== Payment Service and Router Test Suite ==="
echo ""

# Install dependencies if needed
echo "Checking dependencies..."
pip list | grep -q pytest || pip install pytest pytest-asyncio pytest-cov pytest-mock httpx

echo ""
echo "Running tests with coverage..."
echo ""

# Run tests with coverage
python -m pytest tests/test_payment_service.py tests/test_payment_router.py \
    -v \
    --cov=app.services.payment_service \
    --cov=app.routers.payment \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-branch \
    -x

echo ""
echo "=== Test run complete ==="
echo "Coverage report saved to htmlcov/index.html"
