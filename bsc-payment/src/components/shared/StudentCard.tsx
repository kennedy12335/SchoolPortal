import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { StudentWithStatus } from '../../types/types';
import { GraduationCap, CreditCard, BookOpen } from 'lucide-react';

interface StudentCardProps {
  student: StudentWithStatus;
  onPaySchoolFees?: (studentId: string) => void;
  onPayExamFees?: (studentId: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onPaySchoolFees,
  onPayExamFees
}) => {
  const navigate = useNavigate();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handlePaySchoolFees = () => {
    if (onPaySchoolFees) {
      onPaySchoolFees(String(student.id));
    } else {
      navigate('/school-fees', { state: { selectedStudentId: student.id } });
    }
  };

  const handlePayExamFees = () => {
    if (onPayExamFees) {
      onPayExamFees(String(student.id));
    } else {
      navigate(`/exam-fees/${student.id}`);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(student.first_name, student.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">
                {student.first_name} {student.last_name}
              </h3>
              <Badge variant={student.school_fees_paid ? "success" : "warning"}>
                {student.school_fees_paid ? "Fees Paid" : "Fees Due"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                {student.year_group}
              </span>
              <span>ID: {student.reg_number}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pt-3 gap-2 flex-wrap">
        {!student.school_fees_paid && (
          <Button
            onClick={handlePaySchoolFees}
            className="flex-1 min-w-[120px]"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay School Fees
          </Button>
        )}
        <Button
          variant={student.school_fees_paid ? "default" : "outline"}
          onClick={handlePayExamFees}
          className="flex-1 min-w-[120px]"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Pay Exam Fees
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
