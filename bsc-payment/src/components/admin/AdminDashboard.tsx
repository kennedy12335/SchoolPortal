import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../../config';
import { DashboardOverview } from '../../types/types';
import {
  Users,
  GraduationCap,
  CreditCard,
  TrendingUp,
  BookOpen,
  Award,
  ChevronRight,
  RefreshCw,
  BarChart3,
  PieChart,
  DollarSign,
  UserCheck,
  UserX
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${config.apiUrl}/api/admin/dashboard/overview`);
      setOverview(response.data);
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
      setError('Failed to load dashboard data');
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

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
    onClick
  }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({
    icon: Icon,
    title,
    description,
    color,
    bgColor,
    onClick
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    bgColor: string;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </div>
  );

  const ProgressRing = ({
    percentage,
    size = 120,
    strokeWidth = 12,
    color = '#3B82F6'
  }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-gray-200"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-gray-600 font-medium">Loading dashboard...</span>
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">School Payment Analytics</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total Students"
            value={overview?.total_students || 0}
            subtitle="Enrolled students"
            color="bg-blue-500"
          />
          <StatCard
            icon={DollarSign}
            title="School Fees Collected"
            value={formatCurrency(overview?.total_school_fees_collected || 0)}
            subtitle={`${overview?.school_fees_paid_count || 0} students paid`}
            color="bg-green-500"
            onClick={() => navigate('/admin/school-fees')}
          />
          <StatCard
            icon={BookOpen}
            title="Exam Fees Collected"
            value={formatCurrency(overview?.total_exam_fees_collected || 0)}
            subtitle={`${overview?.total_exam_registrations || 0} registrations`}
            color="bg-purple-500"
            onClick={() => navigate('/admin/exam-fees')}
          />
        </div>

        {/* School Fees Progress + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Payment Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">School Fees Collection</h3>
            <div className="flex items-center justify-center mb-6">
              <ProgressRing
                percentage={overview?.school_fees_collection_rate || 0}
                color="#10B981"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="font-semibold text-gray-900">{overview?.school_fees_paid_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-500">Unpaid</p>
                  <p className="font-semibold text-gray-900">{overview?.school_fees_unpaid_count || 0}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/school-fees')}
              className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center space-x-1"
            >
              <span>View Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Management</h3>
            <QuickActionCard
              icon={GraduationCap}
              title="School Fees Analytics"
              description="View payment status by year group and class"
              color="text-blue-600"
              bgColor="bg-blue-100"
              onClick={() => navigate('/admin/school-fees')}
            />
            <QuickActionCard
              icon={BookOpen}
              title="Exam Fees Analytics"
              description="Track exam registrations and payments by year group"
              color="text-purple-600"
              bgColor="bg-purple-100"
              onClick={() => navigate('/admin/exam-fees')}
            />
          </div>
        </div>

        {/* Management Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard
              icon={BookOpen}
              title="Manage Exams"
              description="Add, edit, or remove exam configurations"
              color="text-indigo-600"
              bgColor="bg-indigo-100"
              onClick={() => navigate('/admin/exams')}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Total Revenue</h3>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(
                (overview?.total_school_fees_collected || 0) +
                (overview?.total_exam_fees_collected || 0)
              )}
            </p>
            <p className="text-sm opacity-80 mt-2">Combined school fees, exams, and clubs</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Collection Rate</h3>
              <PieChart className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{overview?.school_fees_collection_rate || 0}%</p>
            <p className="text-sm opacity-80 mt-2">Of students have paid school fees</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Active Registrations</h3>
              <CreditCard className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{overview?.total_exam_registrations || 0}</p>
            <p className="text-sm opacity-80 mt-2">Students registered for exams</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
