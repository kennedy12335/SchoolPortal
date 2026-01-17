# Payment System Setup Guide

This guide explains how to configure the centralized payment system that handles both school fees and exam payments with automatic splitting to different subaccounts.

## Overview

The payment system now uses a centralized service (`backend/app/services/payment_service.py`) that handles:

1. **School Fees Payments**: Split between tuition and club accounts
2. **Exam Fees Payments**: Split between different exam-specific accounts

## Environment Configuration

Add the following environment variables to your `.env` file:

### Paystack Configuration
```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

### Callback URLs
```env
school_fees_success_callback_url=https://yourdomain.com/payment-success
exam_success_callback_url=https://yourdomain.com/exam-payment-success
```

### School Fees Subaccounts
```env
tuition_account=ACCT_tuition_subaccount_code
club_account=ACCT_club_subaccount_code
```

### Exam Fees Subaccounts
The system supports 4 specific exam types with hardcoded account mapping:
```env
# Hardcoded exam accounts (based on exam name matching)
igcse_account=ACCT_igcse_subaccount_code
checkpoint_account=ACCT_checkpoint_subaccount_code
sat_account=ACCT_sat_subaccount_code
ielts_account=ACCT_ielts_subaccount_code

# Default exam account (fallback if exam name doesn't match any of the above)
exam_account=ACCT_default_exam_subaccount_code
```

**Note**: The system automatically determines which subaccount to use based on the exam name:
- Exams containing "igcse" → uses `igcse_account`
- Exams containing "checkpoint" → uses `checkpoint_account`  
- Exams containing "sat" → uses `sat_account`
- Exams containing "ielts" → uses `ielts_account`
- All other exams → uses `exam_account` (default)

## How It Works

### School Fees Payment Flow

1. **Payment Initialization**: The `/api/payment/initialize` endpoint receives payment data
2. **Amount Calculation**: The system calculates the split between tuition and club fees
3. **Paystack Split**: Creates a split payment with Paystack using the configured subaccounts
4. **Database Records**: Creates payment and payer info records
5. **Club Memberships**: Updates student club memberships

### Exam Fees Payment Flow

1. **Payment Initialization**: The `/api/exams/pay-for-exam` endpoint receives payment data
2. **Exam Details**: Fetches exam details to calculate proportional splits
3. **Amount Distribution**: Distributes payment amount proportionally based on exam costs
4. **Paystack Split**: Creates a split payment with exam-specific subaccounts
5. **Database Records**: Creates exam payment records for each exam

## Payment Splitting Logic

### School Fees
- **Tuition Share**: `(tuition_amount / total_amount) * net_amount_after_fees`
- **Club Share**: `(club_amount / total_amount) * net_amount_after_fees`

### Exam Fees
- **Per Exam Share**: `(exam_cost / total_exam_costs) * net_amount_after_fees`
- Each exam gets a proportional share based on its cost

## Paystack Fee Handling

The system automatically:
1. Calculates Paystack transaction fees (1.5% + ₦100, capped at ₦2000)
2. Deducts fees from the total before splitting
3. Uses `bearer_type: "account"` so the main account bears the transaction fee
4. Stores fee information in payment metadata

## API Changes

### School Fees Endpoint
- **Endpoint**: `POST /api/payment/initialize`
- **No changes** to the request/response format
- **Internal**: Now uses centralized payment service

### Exam Fees Endpoint
- **Endpoint**: `POST /api/exams/pay-for-exam`
- **No changes** to the request/response format
- **Internal**: Now uses centralized payment service with splitting

## Error Handling

The system handles various error scenarios:

1. **Missing Subaccounts**: Returns 500 error if required subaccount environment variables are not set
2. **Exam Not Found**: Returns 404 error if exam ID doesn't exist
3. **Paystack Errors**: Returns 400 error with Paystack error message
4. **Database Errors**: Automatic rollback and 500 error response

## Testing

To test the payment system:

1. **Set up test subaccounts** in your Paystack dashboard
2. **Configure environment variables** with test subaccount codes
3. **Use test API keys** for Paystack
4. **Test both payment types** to ensure splitting works correctly

## Migration Notes

- **Backward Compatibility**: Old functions are marked as deprecated but still available
- **No Breaking Changes**: Existing API endpoints work the same way
- **Database**: No schema changes required
- **Frontend**: No changes needed to frontend code

## Monitoring

The system logs detailed information about:
- Payment initialization requests
- Split payment creation
- Subaccount configurations
- Error scenarios

Check your application logs for payment-related activities. 