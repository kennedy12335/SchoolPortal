import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useParent } from '../context/ParentContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import StudentCard from './shared/StudentCard';
import LoadingSpinner from './shared/LoadingSpinner';
import EmptyState from './shared/EmptyState';
import { Users, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { parent, students, loading, error } = useParent();

  const pendingPayments = students.filter(s => !s.school_fees_paid).length;
  const paidStudents = students.filter(s => s.school_fees_paid).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {parent?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Manage your children's school and exam fee payments.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Students with unpaid fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students with paid fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {pendingPayments > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <CreditCard className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {pendingPayments} student{pendingPayments > 1 ? 's' : ''} with pending school fees
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your payments to avoid late fees
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/school-fees')}>
                Pay Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Children</h2>
        </div>

        {students.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No students are currently linked to your account. Please contact the school administration."
            icon={Users}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <p className="text-sm text-orange-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
