import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { config } from '../../config';
import { useParent } from '../../context/ParentContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import StudentSelector from './StudentSelector';
import ClubSelector from './ClubSelector';
import FeeBreakdown from './FeeBreakdown';
import LoadingSpinner from '../shared/LoadingSpinner';
import EmptyState from '../shared/EmptyState';
import { Club, StudentFeeDetail, StudentFee, StudentExamFee } from '../../types/types';
import FeeService from '../../services/feeService';
import { ArrowLeft, CreditCard, Loader2, Users } from 'lucide-react';

interface StudentClubSelection {
  [studentId: string]: string[];
}

const SchoolFeesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { parent, students, loading: parentLoading } = useParent();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentClubSelections, setStudentClubSelections] = useState<StudentClubSelection>({});
  const [studentFees, setStudentFees] = useState<StudentFeeDetail[]>([]);
  const [selectedStudentFeeIds, setSelectedStudentFeeIds] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Initialize with preselected student if coming from dashboard
  useEffect(() => {
    const preselectedId = location.state?.selectedStudentId;
    if (preselectedId) {
      const student = students.find(s => String(s.id) === String(preselectedId));
      if (student && !student.school_fees_paid) {
        setSelectedStudentIds([String(preselectedId)]);
      }
    } else {
      // Auto-select all unpaid students
      const unpaidStudentIds = students
        .filter(s => !s.school_fees_paid)
        .map(s => String(s.id));
      setSelectedStudentIds(unpaidStudentIds);
    }
  }, [students, location.state]);

  // Fetch clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/api/clubs/`);
        setClubs(response.data);
      } catch (error) {
        console.error('Error fetching clubs:', error);
        toast.error('Failed to load clubs');
      }
    };
    fetchClubs();
  }, []);

  // Calculate fees when selection changes
  useEffect(() => {
    const calculateFees = async () => {
      if (selectedStudentIds.length === 0) {
        setStudentFees([]);
        setTotalAmount(0);
        return;
      }

      // Check if all selected students have clubs selected
      const allHaveClubs = selectedStudentIds.every(
        id => studentClubSelections[id]?.length > 0
      );

      if (!allHaveClubs) {
        setStudentFees([]);
        setTotalAmount(0);
        return;
      }

      setIsCalculating(true);
      try {
        console.log("=====")
        console.log(studentClubSelections)
        console.log("=====")
        const studentClubIds: Record<string, string[]> = {};
        selectedStudentIds.forEach(id => {
          console.log(id)
          studentClubIds[id] = studentClubSelections[id] || [];
        });

        console.log( studentClubIds)

        const response = await axios.post(`${config.apiUrl}/api/fees/calculate-fees`, {
          student_ids: selectedStudentIds,
          student_club_ids: studentClubIds
        });

        setStudentFees(response.data.student_fees);
        setTotalAmount(response.data.total_amount);
      } catch (error) {
        console.error('Error calculating fees:', error);
        toast.error('Failed to calculate fees');
      } finally {
        setIsCalculating(false);
      }
    };

    const debounceTimer = setTimeout(calculateFees, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedStudentIds, studentClubSelections]);

  const handleClubChange = (studentId: string, clubIds: string[]) => {
    setStudentClubSelections(prev => ({
      ...prev,
      [studentId]: clubIds
    }));
  };

  const handleStudentSelectionChange = (ids: string[]) => {
    setSelectedStudentIds(ids);
    // Initialize club selections for newly selected students
    ids.forEach(id => {
      if (!studentClubSelections[id]) {
        setStudentClubSelections(prev => ({
          ...prev,
          [id]: []
        }));
      }
    });
  };

  const allStudentsHaveClubs = selectedStudentIds.every(
    id => studentClubSelections[id]?.length > 0
  );

  const canSubmit =
    selectedStudentIds.length > 0 &&
    allStudentsHaveClubs &&
    totalAmount > 0 &&
    !isSubmitting;

  const handlePayment = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const studentClubIds: Record<string, string[]> = {};
      selectedStudentIds.forEach(id => {
        studentClubIds[id] = studentClubSelections[id] || [];
      });

      const clubAmount = studentFees.reduce(
        (acc, fee) => acc + fee.fee_breakdown.club_fees.reduce((sum, club) => sum + club.price, 0),
        0
      );

      // Store payment details before API call
      const paymentDetails = {
        amount: totalAmount,
        students: studentFees.map(fee => ({
          name: fee.student_name,
          amount: fee.fee_breakdown.final_amount,
          clubs: fee.fee_breakdown.club_fees.map(club => ({
            name: club.name,
            price: club.price
          })),
          fee_breakdown: fee.fee_breakdown
        })),
        paymentMethod: 'Bank Transfer',
        reference: ''
      };

      const response = await axios.post(`${config.apiUrl}/api/payments/initialize`, {
        student_ids: selectedStudentIds,
        amount: totalAmount,
        club_amount: clubAmount,
        parent_id: parent?.id,
        payment_method: 'bank_transfer',
        description: `Payment for ${selectedStudentIds.length} student(s)`,
        student_club_ids: studentClubIds,
        student_fee_ids: selectedStudentFeeIds
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
      toast.error('Failed to initialize payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const eligibleStudents = students.filter(s => !s.school_fees_paid);

  if (parentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (eligibleStudents.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <EmptyState
          title="No pending school fees"
          description="All your children's school fees have been paid."
          icon={Users}
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
          <h1 className="text-2xl font-bold">School Fees Payment</h1>
          <p className="text-muted-foreground">
            Select students and clubs to pay school fees
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Selection */}
          <Card>
            <CardContent className="pt-6">
              <StudentSelector
                students={students}
                selectedStudentIds={selectedStudentIds}
                onSelectionChange={handleStudentSelectionChange}
              />
            </CardContent>
          </Card>

          {/* Club Selection */}
          {selectedStudentIds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Select Clubs (Required - Max 2 per student)</h3>
              {selectedStudentIds.map(studentId => {
                const student = students.find(s => String(s.id) === studentId);
                if (!student || student.school_fees_paid) return null;

                return (
                  <ClubSelector
                    key={studentId}
                    studentId={studentId}
                    studentName={`${student.first_name} ${student.last_name}`}
                    clubs={clubs}
                    selectedClubIds={studentClubSelections[studentId] || []}
                    onClubChange={handleClubChange}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Fee Breakdown */}
          {isCalculating ? (
            <Card>
              <CardContent className="py-12">
                <LoadingSpinner text="Calculating fees..." />
              </CardContent>
            </Card>
          ) : (
            <FeeBreakdown
              studentFees={studentFees}
              totalAmount={totalAmount}
            />
          )}

          {/* Payment Button */}
          {selectedStudentIds.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                {!allStudentsHaveClubs && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Please select at least one club for each student to continue.
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
        </div>
      </div>
    </div>
  );
};

export default SchoolFeesPage;
