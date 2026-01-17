import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { X, BookOpen } from 'lucide-react';

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

interface ExamPaymentDetailsProps {
  selectedExams: Map<string, SelectedExamInfo>;
  textbookPrice: number;
  onUpdatePaymentAmount: (examId: string, amount: number) => void;
  onToggleTextbook: (examId: string) => void;
  onRemoveExam: (examId: string) => void;
  onPayFullBalance: (examId: string) => void;
}

const ExamPaymentDetails: React.FC<ExamPaymentDetailsProps> = ({
  selectedExams,
  textbookPrice,
  onUpdatePaymentAmount,
  onToggleTextbook,
  onRemoveExam,
  onPayFullBalance
}) => {
  const allowsPartialPayment = (examName: string): boolean => {
    const name = examName.toLowerCase();
    return name.includes('igcse') || name.includes('checkpoint');
  };

  const isSATExam = (examName: string): boolean => {
    return examName.toLowerCase().includes('sat');
  };

  if (selectedExams.size === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from(selectedExams.values()).map((info, index) => (
          <div key={info.exam.exam_id} className="space-y-4">
            {index > 0 && <Separator />}

            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{info.exam.exam_name}</h4>
                <p className="text-sm text-muted-foreground">
                  Exam Fee: ₦{info.exam.exam_price.toLocaleString()}
                  {allowsPartialPayment(info.exam.exam_name) && (
                    <span> | Due: ₦{info.exam.amount_due.toLocaleString()}</span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => onRemoveExam(info.exam.exam_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Payment Amount */}
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                {allowsPartialPayment(info.exam.exam_name) ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        type="text"
                        value={info.paymentAmount ? info.paymentAmount.toLocaleString() : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          const numValue = parseFloat(value) || 0;
                          if (numValue <= info.exam.amount_due) {
                            onUpdatePaymentAmount(info.exam.exam_id, numValue);
                          }
                        }}
                        className="pl-7"
                        placeholder={`Max ₦${info.exam.amount_due.toLocaleString()}`}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPayFullBalance(info.exam.exam_id)}
                    >
                      Pay Full
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-semibold text-lg">
                      ₦{info.exam.exam_price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Full payment required
                    </p>
                  </div>
                )}
              </div>

              {/* Study Materials */}
              <div className="space-y-2">
                <Label>Study Materials</Label>
                {isSATExam(info.exam.exam_name) ? (
                  <div
                    onClick={() => onToggleTextbook(info.exam.exam_id)}
                    className={`
                      p-3 rounded-md border-2 cursor-pointer transition-all
                      ${info.includeTextbook
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={info.includeTextbook}
                        onCheckedChange={() => onToggleTextbook(info.exam.exam_id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">SAT Study Materials</p>
                        <p className="text-xs text-muted-foreground">
                          Practice books and resources
                        </p>
                      </div>
                      <span className="font-semibold text-purple-600">
                        ₦{textbookPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md flex items-center gap-3 text-muted-foreground">
                    <BookOpen className="h-5 w-5" />
                    <p className="text-sm">Materials included in exam fee</p>
                  </div>
                )}
              </div>
            </div>

            {/* Exam Total */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-md">
              <span className="font-medium">Total for {info.exam.exam_name}</span>
              <span className="font-bold text-lg text-primary">
                ₦{(info.paymentAmount + (info.includeTextbook ? textbookPrice : 0)).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ExamPaymentDetails;
