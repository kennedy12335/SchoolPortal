import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { config } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import LoadingSpinner from './shared/LoadingSpinner';
import { CheckCircle, XCircle, Home, Printer, BookOpen } from 'lucide-react';

interface ExamBreakdownItem {
  exam_id: string;
  exam_name: string;
  amount_paid: number;
  includes_textbook: boolean;
  textbook_cost: number;
}

interface ExamPaymentDetails {
  amount: number;
  student: {
    name: string;
    amount: number;
    exam_name: string;
  };
  examBreakdown?: ExamBreakdownItem[];
  payerName?: string;
  payerEmail?: string;
  paymentMethod: string;
  reference: string;
}

const ExamPaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<ExamPaymentDetails | null>(null);
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
          `${config.apiUrl}/api/exams/verify/${reference}`
        );

        if (response.data.status === 'completed') {
          setIsVerifying(false);
          setIsVerified(true);
        } else if (response.data.status === 'pending') {
          setTimeout(verifyPayment, 2000);
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
          <h1 className="text-2xl font-bold text-green-700">Exam Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your exam payment has been processed and confirmed. A receipt has been sent to your email.
          </p>
        </CardContent>
      </Card>

      {/* Receipt */}
      {paymentDetails && paymentDetails.student && (
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

            {/* Student Info */}
            <div>
              <h3 className="font-semibold text-lg mb-4">{paymentDetails.student.name}</h3>

              {/* Detailed breakdown if available */}
              {paymentDetails.examBreakdown && paymentDetails.examBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {paymentDetails.examBreakdown.map((exam) => (
                    <div key={exam.exam_id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="font-medium">{exam.exam_name}</span>
                        </div>
                        <span className="font-semibold text-primary">
                          ₦{exam.amount_paid.toLocaleString()}
                        </span>
                      </div>

                      {exam.includes_textbook && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              Study Materials
                            </Badge>
                          </div>
                          <span className="text-purple-600">
                            ₦{exam.textbook_cost.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {exam.includes_textbook && (
                        <>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>Subtotal</span>
                            <span>₦{(exam.amount_paid + exam.textbook_cost).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Fallback for simple format
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">{paymentDetails.student.exam_name}</span>
                    </div>
                    <span className="font-semibold text-primary">
                      ₦{paymentDetails.student.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

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

export default ExamPaymentSuccess;
