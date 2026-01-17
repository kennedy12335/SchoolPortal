import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { StudentWithStatus } from '../../types/types';
import { GraduationCap, CheckCircle } from 'lucide-react';

interface StudentSelectorProps {
  students: StudentWithStatus[];
  selectedStudentIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudentIds,
  onSelectionChange
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleToggle = (studentId: string, isDisabled: boolean) => {
    if (isDisabled) return;

    if (selectedStudentIds.includes(studentId)) {
      onSelectionChange(selectedStudentIds.filter(id => id !== studentId));
    } else {
      onSelectionChange([...selectedStudentIds, studentId]);
    }
  };

  const eligibleStudents = students.filter(s => !s.school_fees_paid);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Students</h3>
          <p className="text-sm text-muted-foreground">
            Choose which children to pay school fees for
          </p>
        </div>
        {eligibleStudents.length > 1 && (
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => {
              if (selectedStudentIds.length === eligibleStudents.length) {
                onSelectionChange([]);
              } else {
                onSelectionChange(eligibleStudents.map(s => String(s.id)));
              }
            }}
          >
            {selectedStudentIds.length === eligibleStudents.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {students.map((student) => {
          const isSelected = selectedStudentIds.includes(String(student.id));
          const isPaid = student.school_fees_paid;

          return (
            <Card
              key={student.id}
              className={`cursor-pointer transition-all ${
                isPaid
                  ? 'opacity-60 cursor-not-allowed'
                  : isSelected
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-primary/50'
              }`}
              onClick={() => handleToggle(String(student.id), isPaid)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {isPaid ? (
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      <Checkbox
                        checked={isSelected}
                        className="h-5 w-5"
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => handleToggle(String(student.id), isPaid)}
                      />
                    )}
                  </div>

                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(student.first_name, student.last_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">
                        {student.first_name} {student.last_name}
                      </h4>
                      {isPaid && (
                        <Badge variant="success" className="text-xs">
                          Paid
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {student.year_group}
                      </span>
                      <span>ID: {student.reg_number}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedStudentIds.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
};

export default StudentSelector;
