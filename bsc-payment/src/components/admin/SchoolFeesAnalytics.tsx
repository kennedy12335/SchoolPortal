import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../../config';
import {
  SchoolFeesOverview,
  StudentPaymentInfo,
  PaginatedStudentPaymentInfo,
  YearGroupPaymentSummary,
  YEAR_GROUPS
} from '../../types/types';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import StudentTable, { renderName, renderText, renderPaidStatus, renderCurrency } from './StudentTable';
import TablePagination from './TablePagination';

// Self-contained Student List Component with its own data fetching
const StudentListSection: React.FC<{
  initialYearGroup?: string;
}> = ({ initialYearGroup = 'all' }) => {
  const [students, setStudents] = useState<StudentPaymentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearGroupFilter, setYearGroupFilter] = useState(initialYearGroup);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  // Fetch students - self-contained in this component
  const fetchStudents = useCallback(async () => {
    setLoading(true);
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
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await axios.get<PaginatedStudentPaymentInfo>(
        `${config.apiUrl}/api/admin/school-fees/students?${params.toString()}`
      );
      setStudents(response.data.items);
      setTotalStudents(response.data.total);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, yearGroupFilter, paymentFilter, searchQuery]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentPage]);

  const handleYearGroupChange = (value: string) => {
    setYearGroupFilter(value);
    setCurrentPage(1);
  };

  const handlePaymentFilterChange = (value: string) => {
    setPaymentFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (_: any, row: StudentPaymentInfo) => renderName(null, row)
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
      key: 'school_fees_paid',
      header: 'Status',
      render: (value: boolean) => renderPaidStatus(value)
    },
    {
      key: 'outstanding_balance',
      header: 'Outstanding',
      render: (value: number | null) => renderCurrency(value, value ? 'red' : 'gray')
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={yearGroupFilter}
              onChange={(e) => handleYearGroupChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Year Groups</option>
              {YEAR_GROUPS.map(yg => (
                <option key={yg} value={yg}>{yg}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => handlePaymentFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
            <button
              onClick={fetchStudents}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <StudentTable
        data={students}
        columns={columns}
        loading={loading}
        keyField="id"
        emptyMessage="No students found matching your criteria."
        accentColor="blue"
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalItems={totalStudents}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        itemLabel="students"
        accentColor="blue"
      />
    </div>
  );
};

const SchoolFeesAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<SchoolFeesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expand/collapse state
  const [expandedYearGroup, setExpandedYearGroup] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'overview' | 'students'>('overview');

  // Selected year group for student list view
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>('all');

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${config.apiUrl}/api/admin/school-fees/overview`);
      setOverview(response.data);
    } catch (err) {
      console.error('Error fetching school fees overview:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

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

  const YearGroupCard = ({ data }: { data: YearGroupPaymentSummary }) => {
    const isExpanded = expandedYearGroup === data.year_group;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedYearGroup(isExpanded ? null : data.year_group)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{data.year_group}</h3>
                <p className="text-sm text-gray-500">{data.total_students} students</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{data.payment_rate}%</p>
                <p className="text-sm text-gray-500">Collection Rate</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">{data.paid_count}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">{data.unpaid_count}</span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(data.payment_rate)}`}
                style={{ width: `${data.payment_rate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Expanded Class Details */}
        {isExpanded && data.classes.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Breakdown by Class</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.classes.map(cls => (
                <div key={cls.class_name} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{cls.class_name}</span>
                    <span className={`text-sm font-bold ${cls.payment_rate >= 80 ? 'text-green-600' : cls.payment_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {cls.payment_rate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{cls.total_students} students</span>
                    <span className="flex items-center space-x-2">
                      <span className="text-green-600">{cls.paid_count} paid</span>
                      <span>|</span>
                      <span className="text-red-600">{cls.unpaid_count} unpaid</span>
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(cls.payment_rate)}`}
                      style={{ width: `${cls.payment_rate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action to view students */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedYearGroup(data.year_group);
                setViewMode('students');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all {data.year_group} students
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
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
          <button
            onClick={fetchOverview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">School Fees Analytics</h1>
                <p className="text-xs text-gray-500">Payment status by year group</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchOverview}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overview?.total_students || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paid</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{overview?.total_paid || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unpaid</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{overview?.total_unpaid || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Collection Rate</p>
                <p className="text-3xl font-bold mt-1">{overview?.overall_payment_rate || 0}%</p>
              </div>
              <div className="text-4xl font-bold opacity-30">
                {overview?.overall_payment_rate || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Amount Collected */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Amount Collected</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                {formatCurrency(overview?.total_amount_collected || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">From {overview?.total_paid || 0} students</p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Year Group Overview
            </button>
            <button
              onClick={() => {
                setSelectedYearGroup('all');
                setViewMode('students');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'students'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Student List
            </button>
          </div>
        </div>

        {/* Year Group Overview */}
        {viewMode === 'overview' && (
          <div className="space-y-4">
            {overview?.by_year_group.map(yg => (
              <YearGroupCard key={yg.year_group} data={yg} />
            ))}
          </div>
        )}

        {/* Student List View - Self-contained component */}
        {viewMode === 'students' && (
          <StudentListSection
            key={selectedYearGroup}
            initialYearGroup={selectedYearGroup}
          />
        )}
      </main>
    </div>
  );
};

export default SchoolFeesAnalytics;
