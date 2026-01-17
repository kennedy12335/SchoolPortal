import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { config } from '../../config';
import { useParent } from '../../context/ParentContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import ExamList from './ExamList';
import ExamPaymentDetails from './ExamPaymentDetails';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { ArrowLeft, CreditCard, GraduationCap, Loader2, BookOpen } from 'lucide-react';

interface Exam {
  exam_id: string;
  exam_name: string;
  exam_price: number;
  extra_fees: number;
  amount_paid: number;
  amount_due: number;
  is_fully_paid: boolean;
}

interface SelectedExamInfo {
  exam: Exam;
  paymentAmount: number;
  includeTextbook: boolean;
}

const TEXTBOOK_PRICE = 15000;

const ExamFeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { students, loading: parentLoading } = useParent();

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExams, setSelectedExams] = useState<Map<string, SelectedExamInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const student = students.find(s => String(s.id) === studentId);

  const allowsPartialPayment = (examName: string): boolean => {
    const name = examName.toLowerCase();
    return name.includes('igcse') || name.includes('checkpoint');
  };

  // Fetch exams for the student
  useEffect(() => {
    const fetchExams = async () => {
      if (!studentId) return;

      setIsLoading(true);
      try {
        const response = await axios.get(`${config.apiUrl}/api/exams/get-student-exam-list`, {
          params: { student_id: studentId }
        });
        setExams(response.data.exam_list || []);
      } catch (error) {
        console.error('Error fetching exams:', error);
        toast.error('Failed to load exams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, [studentId]);

  const handleToggleExam = (examId: string, exam: Exam) => {
    setSelectedExams(prev => {
      const newMap = new Map(prev);
      if (newMap.has(examId)) {
        newMap.delete(examId);
      } else {
        newMap.set(examId, {
          exam,
          paymentAmount: allowsPartialPayment(exam.exam_name) ? 0 : exam.exam_price,
          includeTextbook: false
        });
      }
      return newMap;
    });
  };

  const handleUpdatePaymentAmount = (examId: string, amount: number) => {
    setSelectedExams(prev => {
      const newMap = new Map(prev);
      const info = newMap.get(examId);
      if (info) {
        newMap.set(examId, { ...info, paymentAmount: amount });
      }
      return newMap;
    });
  };

  const handleToggleTextbook = (examId: string) => {
    setSelectedExams(prev => {
      const newMap = new Map(prev);
      const info = newMap.get(examId);
      if (info) {
        newMap.set(examId, { ...info, includeTextbook: !info.includeTextbook });
      }
      return newMap;
    });
  };

  const handleRemoveExam = (examId: string) => {
    setSelectedExams(prev => {
      const newMap = new Map(prev);
      newMap.delete(examId);
      return newMap;
    });
  };

  const handlePayFullBalance = (examId: string) => {
    setSelectedExams(prev => {
      const newMap = new Map(prev);
      const info = newMap.get(examId);
      if (info) {
        newMap.set(examId, { ...info, paymentAmount: info.exam.amount_due });
      }
      return newMap;
    });
  };

  const calculateTotalAmount = (): number => {
    let total = 0;
    selectedExams.forEach(info => {
      total += info.paymentAmount + (info.includeTextbook ? TEXTBOOK_PRICE : 0);
    });
    return total;
  };

  const hasValidPaymentAmounts = (): boolean => {
    for (const info of Array.from(selectedExams.values())) {
      if (allowsPartialPayment(info.exam.exam_name) && info.paymentAmount <= 0) {
        return false;
      }
    }
    return true;
  };

  const totalAmount = calculateTotalAmount();
  const canSubmit = selectedExams.size > 0 && totalAmount > 0 && hasValidPaymentAmounts() && !isSubmitting;

  const handlePayment = async () => {
    if (!canSubmit || !student) return;

    setIsSubmitting(true);
    try {
      const examPayments = Array.from(selectedExams.values()).map(info => ({
        exam_id: parseInt(info.exam.exam_id),
        amount_paid: info.paymentAmount
      }));

      const examNames = Array.from(selectedExams.values())
        .map(info => info.exam.exam_name)
        .join(', ');

      const paymentDetails = {
        amount: totalAmount,
        student: {
          name: `${student.first_name} ${student.last_name}`,
          amount: totalAmount,
          exam_name: examNames
        },
        examBreakdown: Array.from(selectedExams.values()).map(info => ({
          exam_id: info.exam.exam_id,
          exam_name: info.exam.exam_name,
          amount_paid: info.paymentAmount,
          includes_textbook: info.includeTextbook,
          textbook_cost: info.includeTextbook ? TEXTBOOK_PRICE : 0
        })),
        paymentMethod: '',
        reference: ''
      };

      const response = await axios.post(`${config.apiUrl}/api/exams/pay-for-exam`, {
        student_id: parseInt(String(student.id)),
        exam_payments: examPayments,
        amount: totalAmount,
        payment_method: ''
      });

      if (response.data.data?.authorization_url) {
        paymentDetails.reference = response.data.data.reference;
        localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));
        localStorage.setItem(`payment_${response.data.data.reference}`, JSON.stringify(paymentDetails));
        window.location.href = response.data.data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (parentLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading exams..." />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <EmptyState
          title="Student not found"
          description="The selected student could not be found."
          actionLabel="Go to Dashboard"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Exam Fees Payment</h1>
          <p className="text-muted-foreground">
            Select exams and pay for {student.first_name}
          </p>
        </div>
      </div>

      {/* Student Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(student.first_name, student.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {student.first_name} {student.last_name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {student.year_group}
                </span>
                <span>ID: {student.reg_number}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {exams.length === 0 ? (
        <EmptyState
          title="No exams available"
          description="This student is not eligible for any exams at the moment."
          icon={BookOpen}
          actionLabel="Go Back"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Exam List */}
          <div className="lg:col-span-2 space-y-6">
            <ExamList
              exams={exams}
              selectedExamIds={new Set(selectedExams.keys())}
              onToggleExam={handleToggleExam}
            />

            {/* Payment Details */}
            <ExamPaymentDetails
              selectedExams={selectedExams}
              textbookPrice={TEXTBOOK_PRICE}
              onUpdatePaymentAmount={handleUpdatePaymentAmount}
              onToggleTextbook={handleToggleTextbook}
              onRemoveExam={handleRemoveExam}
              onPayFullBalance={handlePayFullBalance}
            />
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {selectedExams.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from(selectedExams.values()).map(info => (
                    <div key={info.exam.exam_id} className="flex justify-between text-sm">
                      <div>
                        <span>{info.exam.exam_name}</span>
                        {info.includeTextbook && (
                          <span className="text-purple-600 block text-xs">
                            + Study Materials
                          </span>
                        )}
                      </div>
                      <span className="font-medium">
                        ₦{(info.paymentAmount + (info.includeTextbook ? TEXTBOOK_PRICE : 0)).toLocaleString()}
                      </span>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₦{totalAmount.toLocaleString()}</span>
                  </div>

                  {!hasValidPaymentAmounts() && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        Please enter payment amounts for all selected exams.
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!canSubmit}
                    onClick={handlePayment}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay ₦{totalAmount.toLocaleString()}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedExams.size === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select exams to view payment summary</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamFeesPage;
