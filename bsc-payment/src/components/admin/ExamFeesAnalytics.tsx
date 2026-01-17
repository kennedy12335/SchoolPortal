import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../../config';
import {
  ExamAnalyticsResponse,
  ExamPaymentSummary,
  StudentExamInfo,
  PaginatedStudentExamInfo,
  YEAR_GROUPS
} from '../../types/types';
import {
  ArrowLeft,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  DollarSign,
  Target
} from 'lucide-react';
import StudentTable, { renderName, renderText, renderExamStatus, renderCurrency } from './StudentTable';
import TablePagination from './TablePagination';

// Memoized Exam Students List Component
const ExamStudentsSection = React.memo(({
  students,
  loading,
  searchQuery,
  onSearchChange,
  yearGroupFilter,
  onYearGroupChange,
  paymentFilter,
  onPaymentFilterChange,
  currentPage,
  totalStudents,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  students: StudentExamInfo[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  yearGroupFilter: string;
  onYearGroupChange: (v: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (v: string) => void;
  currentPage: number;
  totalStudents: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) => {
  // Client-side search filter
  const filteredStudents = students.filter(student => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        student.first_name.toLowerCase().includes(query) ||
        student.last_name.toLowerCase().includes(query) ||
        student.reg_number.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (_: any, row: StudentExamInfo) => renderName(null, row)
    },
    {
      key: 'reg_number',
      header: 'Reg Number',
      render: (value: string) => renderText(value)
    },
    {
      key: 'year_group',
      header: 'Year Group',
      render: (value: string) => renderText(value)
    },
    {
      key: 'class_name',
      header: 'Class',
      render: (value: string) => renderText(value)
    },
    {
      key: 'amount_paid',
      header: 'Amount Paid',
      render: (value: number) => renderCurrency(value, 'green')
    },
    {
      key: 'amount_due',
      header: 'Amount Due',
      render: (value: number) => renderCurrency(value, 'red')
    },
    {
      key: 'is_fully_paid',
      header: 'Status',
      render: (_: any, row: StudentExamInfo) => renderExamStatus(row.is_fully_paid, row.amount_paid)
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or reg number..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={yearGroupFilter}
              onChange={(e) => onYearGroupChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Year Groups</option>
              {YEAR_GROUPS.map(yg => (
                <option key={yg} value={yg}>{yg}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => onPaymentFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <StudentTable
        data={filteredStudents}
        columns={columns}
        loading={loading}
        keyField="student_id"
        emptyMessage="No students found."
        accentColor="purple"
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalItems={totalStudents}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel="students"
        accentColor="purple"
      />
    </div>
  );
});

ExamStudentsSection.displayName = 'ExamStudentsSection';

const ExamFeesAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ExamAnalyticsResponse | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamPaymentSummary | null>(null);
  const [allExamStudents, setAllExamStudents] = useState<StudentExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [yearGroupFilter, setYearGroupFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${config.apiUrl}/api/admin/exam-fees/overview`);
      setOverview(response.data);
    } catch (err) {
      console.error('Error fetching exam fees overview:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch exam students with pagination
  const fetchExamStudents = useCallback(async () => {
    if (!selectedExam) return;

    setStudentsLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });

      if (yearGroupFilter !== 'all') {
        params.append('year_group', yearGroupFilter);
      }
      if (paymentFilter !== 'all') {
        params.append('payment_status', paymentFilter);
      }

      const response = await axios.get<PaginatedStudentExamInfo>(
        `${config.apiUrl}/api/admin/exam-fees/students/${selectedExam.exam_id}?${params.toString()}`
      );
      setAllExamStudents(response.data.items);
      setTotalStudents(response.data.total);
    } catch (err) {
      console.error('Error fetching exam students:', err);
    } finally {
      setStudentsLoading(false);
    }
  }, [selectedExam, currentPage, pageSize, yearGroupFilter, paymentFilter]);

  useEffect(() => {
    fetchOverview();
  }, []);

  // Fetch exam students when filters or pagination changes
  useEffect(() => {
    if (selectedExam) {
      fetchExamStudents();
    }
  }, [selectedExam, fetchExamStudents]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Memoized callbacks
  const handleYearGroupChange = useCallback((value: string) => {
    setYearGroupFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePaymentFilterChange = useCallback((value: string) => {
    setPaymentFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const totalExpected = overview?.exams.reduce((sum, e) => sum + e.total_amount_expected, 0) || 0;
  const totalCollected = overview?.exams.reduce((sum, e) => sum + e.total_amount_collected, 0) || 0;
  const totalRegistrations = overview?.exams.reduce((sum, e) => sum + e.total_registered, 0) || 0;

  const ExamCard = ({ exam }: { exam: ExamPaymentSummary }) => {
    const isExpanded = expandedExam === exam.exam_id;
    const applicableGradesDisplay = exam.applicable_grades?.length
      ? exam.applicable_grades.map(g => g.replace('YEAR_', 'Year ')).join(', ')
      : 'All Year Groups';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedExam(isExpanded ? null : exam.exam_id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{exam.exam_name}</h3>
                <p className="text-sm text-gray-500">{applicableGradesDisplay}</p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{exam.total_registered}</p>
                <p className="text-sm text-gray-500">Registered</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{exam.collection_rate}%</p>
                <p className="text-sm text-gray-500">Collected</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{exam.fully_paid_count} Fully Paid</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">{exam.partially_paid_count} Partial</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-red-50 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">{exam.unpaid_count} Unpaid</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">Collection Progress</span>
              <span className="font-medium">{formatCurrency(exam.total_amount_collected)} / {formatCurrency(exam.total_amount_expected)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(exam.collection_rate)}`}
                style={{ width: `${exam.collection_rate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Student Details</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedExam(exam);
                }}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                View Full List
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Applicable Students</p>
                <p className="text-xl font-bold text-gray-900">{exam.total_applicable_students}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Registration Rate</p>
                <p className="text-xl font-bold text-blue-600">
                  {exam.total_applicable_students > 0
                    ? Math.round((exam.total_registered / exam.total_applicable_students) * 100)
                    : 0}%
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Expected Amount</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(exam.total_amount_expected)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Collected Amount</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(exam.total_amount_collected)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
          <span className="text-gray-600 font-medium">Loading data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchOverview} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Student list modal view
  if (selectedExam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSelectedExam(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{selectedExam.exam_name}</h1>
                  <p className="text-xs text-gray-500">Student Payment Details</p>
                </div>
              </div>
              <button
                onClick={fetchExamStudents}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExamStudentsSection
            students={allExamStudents}
            loading={studentsLoading}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            yearGroupFilter={yearGroupFilter}
            onYearGroupChange={handleYearGroupChange}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={handlePaymentFilterChange}
            currentPage={currentPage}
            totalStudents={totalStudents}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Exam Fees Analytics</h1>
                <p className="text-xs text-gray-500">Track exam registrations and payments</p>
              </div>
            </div>
            <button onClick={fetchOverview} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Exams</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overview?.total_exams || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Registrations</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{totalRegistrations}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expected</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalExpected)}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <Target className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Collected</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Exam Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Exams by Year Group Eligibility</h3>
          {overview?.exams.map(exam => (
            <ExamCard key={exam.exam_id} exam={exam} />
          ))}
          {(!overview?.exams || overview.exams.length === 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              No exams configured yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamFeesAnalytics;
