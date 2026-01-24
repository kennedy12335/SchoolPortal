import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { config } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import LoadingSpinner from './shared/LoadingSpinner';
import { CheckCircle, XCircle, Home, Printer } from 'lucide-react';
import { FeeBreakdown } from '../types/types';

interface StudentPayment {
  name: string;
  amount: number;
  fee_breakdown: FeeBreakdown;
}

interface PaymentDetails {
  amount: number;
  students: StudentPayment[];
  payerName?: string;
  payerEmail?: string;
  paymentMethod: string;
  reference: string;
}

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const loadPaymentDetails = (reference: string | null) => {
      let storedDetails = localStorage.getItem('paymentDetails');

      if (!storedDetails && reference) {
        storedDetails = localStorage.getItem(`payment_${reference}`);
      }

      if (storedDetails) {
        try {
          const parsed = JSON.parse(storedDetails);
          if (typeof parsed.students === 'string') {
            parsed.students = [{ name: parsed.students, amount: parsed.amount }];
          }
          setPaymentDetails(parsed);
        } catch (error) {
          console.error('Error parsing payment details:', error);
        }
      }
    };

    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      if (!reference) {
        setVerificationError('Payment reference not found');
        setIsVerifying(false);
        return;
      }

      loadPaymentDetails(reference);

      try {
        const response = await axios.post(
          `${config.apiUrl}/api/payments/verify/${reference}`
        );

        if (response.data.status === 'completed') {
          setIsVerifying(false);
          setIsVerified(true);
        } else if (response.data.status === 'pending') {
          setTimeout(() => verifyPayment(), 2000);
        } else {
          setVerificationError('Payment verification failed. Please contact support.');
          setIsVerifying(false);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationError('Error verifying payment. Please contact support.');
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleReturnHome = () => {
    const reference = searchParams.get('reference');
    if (reference) {
      localStorage.removeItem('paymentDetails');
      localStorage.removeItem(`payment_${reference}`);
    }
    navigate('/');
  };

  const handlePrint = () => {
    window.print();
  };

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-lg font-medium">Verifying your payment...</p>
          <p className="text-sm text-muted-foreground">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Payment Verification Failed</h1>
            <p className="text-muted-foreground">{verificationError}</p>
            <Button onClick={handleReturnHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-700">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your payment has been processed and confirmed. A receipt has been sent to your email.
          </p>
        </CardContent>
      </Card>

      {/* Receipt */}
      {paymentDetails && (
        <Card className="print:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payment Receipt</CardTitle>
            <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reference */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Reference Number</p>
              <p className="font-mono font-medium">{paymentDetails.reference}</p>
            </div>

            {/* Student Breakdowns */}
            {paymentDetails.students.map((student, index) => (
              <div key={index} className="space-y-3">
                <h3 className="font-semibold text-lg">{student.name}</h3>

                <div className="space-y-2 text-sm">
                  {Object.entries(student.fee_breakdown.fees ?? {}).map(([label, value]) => (
                    <FeeRow key={label} label={label} amount={Number(value) || 0} />
                  ))}

                  {student.fee_breakdown.discount_amount > 0 && (
                    <>
                      <Separator className="my-2" />
                      <FeeRow
                        label="Discount"
                        amount={-student.fee_breakdown.discount_amount}
                        discount
                      />
                    </>
                  )}

                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Student Total</span>
                    <span className="text-primary">₦{student.amount.toLocaleString()}</span>
                  </div>
                </div>

                {index < paymentDetails.students.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}

            {/* Grand Total */}
            <div className="pt-4 border-t-2">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount Paid</span>
                <span className="text-primary text-xl">₦{paymentDetails.amount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center print:hidden">
        <Button onClick={handleReturnHome} size="lg">
          <Home className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

interface FeeRowProps {
  label: string;
  amount: number;
  discount?: boolean;
  highlight?: boolean;
}

const FeeRow: React.FC<FeeRowProps> = ({ label, amount, discount, highlight }) => (
  <div className={`flex justify-between ${highlight ? 'text-indigo-600' : ''}`}>
    <span>{label}</span>
    <span className={discount ? 'text-green-600' : ''}>
      {discount && amount < 0 ? '-' : ''}₦{Math.abs(amount).toLocaleString()}
    </span>
  </div>
);

export default PaymentSuccess;
