import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { config } from '../../config';
import {
  ClubAnalyticsResponse,
  ClubMembershipSummary,
  ClubMemberInfo,
  PaginatedClubMemberInfo,
  YEAR_GROUPS
} from '../../types/types';
import {
  ArrowLeft,
  Award,
  Users,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  DollarSign,
  ChevronDown,
  ChevronUp,
  UserPlus
} from 'lucide-react';
import StudentTable, { renderName, renderText, renderPaymentConfirmed, renderMemberStatus } from './StudentTable';
import TablePagination from './TablePagination';

// Memoized Club Members List Component
const ClubMembersSection = React.memo(({
  members,
  loading,
  searchQuery,
  onSearchChange,
  yearGroupFilter,
  onYearGroupChange,
  paymentFilter,
  onPaymentFilterChange,
  currentPage,
  totalMembers,
  pageSize,
  onPageChange,
  onPageSizeChange
}: {
  members: ClubMemberInfo[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  yearGroupFilter: string;
  onYearGroupChange: (v: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (v: string) => void;
  currentPage: number;
  totalMembers: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) => {
  // Client-side search filter
  const filteredMembers = members.filter(member => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        member.first_name.toLowerCase().includes(query) ||
        member.last_name.toLowerCase().includes(query) ||
        member.reg_number.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (_: any, row: ClubMemberInfo) => renderName(null, row)
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
      key: 'payment_confirmed',
      header: 'Payment',
      render: (value: boolean) => renderPaymentConfirmed(value)
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => renderMemberStatus(value)
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
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={yearGroupFilter}
              onChange={(e) => onYearGroupChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Year Groups</option>
              {YEAR_GROUPS.map(yg => (
                <option key={yg} value={yg}>{yg}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => onPaymentFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <StudentTable
        data={filteredMembers}
        columns={columns}
        loading={loading}
        keyField="student_id"
        emptyMessage="No members found."
        accentColor="orange"
      />

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalItems={totalMembers}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel="members"
        accentColor="orange"
      />
    </div>
  );
});

ClubMembersSection.displayName = 'ClubMembersSection';

const ClubMembershipAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ClubAnalyticsResponse | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubMembershipSummary | null>(null);
  const [allClubMembers, setAllClubMembers] = useState<ClubMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [yearGroupFilter, setYearGroupFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  // Pagination
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalMembers, setTotalMembers] = useState<number>(0);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${config.apiUrl}/api/admin/clubs/overview`);
      setOverview(response.data);
    } catch (err) {
      console.error('Error fetching clubs overview:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch club members with pagination
  const fetchClubMembers = useCallback(async () => {
    if (!selectedClub) return;

    setMembersLoading(true);
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

      const response = await axios.get<PaginatedClubMemberInfo>(
        `${config.apiUrl}/api/admin/clubs/members/${selectedClub.club_id}?${params.toString()}`
      );
      setAllClubMembers(response.data.items);
      setTotalMembers(response.data.total);
    } catch (err) {
      console.error('Error fetching club members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [selectedClub, currentPage, pageSize, yearGroupFilter, paymentFilter]);

  useEffect(() => {
    fetchOverview();
  }, []);

  // Fetch club members when filters or pagination changes
  useEffect(() => {
    if (selectedClub) {
      fetchClubMembers();
    }
  }, [selectedClub, fetchClubMembers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const ClubCard = ({ club }: { club: ClubMembershipSummary }) => {
    const isExpanded = expandedClub === club.club_id;
    const capacityPercentage = club.capacity && club.capacity > 0
      ? Math.round((club.total_members / club.capacity) * 100)
      : null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setExpandedClub(isExpanded ? null : club.club_id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{club.club_name}</h3>
                <p className="text-sm text-gray-500">Membership Fee: {formatCurrency(club.price)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">{club.total_members}</p>
                <p className="text-sm text-gray-500">
                  {club.capacity ? `of ${club.capacity} capacity` : 'Members'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(club.total_revenue)}</p>
                <p className="text-sm text-gray-500">Revenue</p>
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
              <span className="text-sm font-medium text-green-700">{club.confirmed_members} Confirmed</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">{club.pending_members} Pending</span>
            </div>
            {capacityPercentage !== null && (
              <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{capacityPercentage}% Full</span>
              </div>
            )}
          </div>

          {/* Capacity Bar */}
          {club.capacity && club.capacity > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">Capacity Utilization</span>
                <span className="font-medium">{club.total_members} / {club.capacity}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    capacityPercentage! >= 90 ? 'bg-red-500' :
                    capacityPercentage! >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(capacityPercentage!, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Membership Breakdown</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedClub(club);
                }}
                className="text-sm text-orange-600 hover:text-orange-800 font-medium"
              >
                View All Members
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-xl font-bold text-gray-900">{club.total_members}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-xl font-bold text-green-600">{club.confirmed_members}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Pending Payment</p>
                <p className="text-xl font-bold text-yellow-600">{club.pending_members}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(club.total_revenue)}</p>
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
          <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
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
          <button onClick={fetchOverview} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Member list view
  if (selectedClub) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button onClick={() => setSelectedClub(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{selectedClub.club_name}</h1>
                  <p className="text-xs text-gray-500">Club Members</p>
                </div>
              </div>
              <button
                onClick={fetchClubMembers}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ClubMembersSection
            members={allClubMembers}
            loading={membersLoading}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            yearGroupFilter={yearGroupFilter}
            onYearGroupChange={handleYearGroupChange}
            paymentFilter={paymentFilter}
            onPaymentFilterChange={handlePaymentFilterChange}
            currentPage={currentPage}
            totalMembers={totalMembers}
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
                <h1 className="text-xl font-bold text-gray-900">Club Memberships</h1>
                <p className="text-xs text-gray-500">Track club enrollments and revenue</p>
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
                <p className="text-sm text-gray-500">Total Clubs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overview?.total_clubs || 0}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Memberships</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{overview?.total_memberships || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {overview?.clubs.reduce((sum, c) => sum + c.confirmed_members, 0) || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(overview?.total_revenue || 0)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Club Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">All Clubs</h3>
          {overview?.clubs.map(club => (
            <ClubCard key={club.club_id} club={club} />
          ))}
          {(!overview?.clubs || overview.clubs.length === 0) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              No clubs configured yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClubMembershipAnalytics;
