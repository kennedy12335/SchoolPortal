import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, ShoppingCart, X } from 'lucide-react';

interface Exam {
  exam_id: string;
  exam_name: string;
  exam_price: number;
  extra_fees: number;
  amount_paid: number;
  amount_due: number;
  is_fully_paid: boolean;
}

interface ExamListProps {
  exams: Exam[];
  selectedExamIds: Set<string>;
  onToggleExam: (examId: string, exam: Exam) => void;
}

const ExamList: React.FC<ExamListProps> = ({
  exams,
  selectedExamIds,
  onToggleExam
}) => {
  const allowsPartialPayment = (examName: string): boolean => {
    const name = examName.toLowerCase();
    return name.includes('igcse') || name.includes('checkpoint');
  };

  const isOneTimePayment = (examName: string): boolean => {
    const name = examName.toLowerCase();
    return name.includes('sat') || name.includes('ielts');
  };

  const isSATExam = (examName: string): boolean => {
    return examName.toLowerCase().includes('sat');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Available Exams</h3>
        {selectedExamIds.size > 0 && (
          <Badge variant="secondary">
            {selectedExamIds.size} selected
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {exams.map((exam) => {
          const isSelected = selectedExamIds.has(exam.exam_id);
          const isPaid = exam.is_fully_paid;

          return (
            <Card
              key={exam.exam_id}
              className={`transition-all ${
                isPaid
                  ? 'bg-green-50 border-green-200'
                  : isSelected
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-gray-300'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {isPaid && (
                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <h4 className="font-semibold">{exam.exam_name}</h4>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                      <span>Price: ₦{exam.exam_price.toLocaleString()}</span>
                      {allowsPartialPayment(exam.exam_name) && !isPaid && (
                        <>
                          <span>Paid: ₦{exam.amount_paid.toLocaleString()}</span>
                          <span>Due: ₦{exam.amount_due.toLocaleString()}</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {isPaid && (
                        <Badge variant="success">Fully Paid</Badge>
                      )}
                      {allowsPartialPayment(exam.exam_name) && !isPaid && (
                        <Badge variant="warning">Installments Allowed</Badge>
                      )}
                      {isOneTimePayment(exam.exam_name) && !isPaid && (
                        <Badge variant="secondary">Full Payment Required</Badge>
                      )}
                      {isSATExam(exam.exam_name) && !isPaid && (
                        <Badge className="bg-purple-100 text-purple-800 border-transparent">
                          + Study Materials Available
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!isPaid && (
                      <Button
                        variant={isSelected ? "destructive" : "default"}
                        size="sm"
                        onClick={() => onToggleExam(exam.exam_id, exam)}
                      >
                        {isSelected ? (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ExamList;
