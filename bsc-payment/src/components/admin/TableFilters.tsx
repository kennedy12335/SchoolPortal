import React, { memo } from 'react';
import { Search } from 'lucide-react';
import { YEAR_GROUPS } from '../../types/types';

interface FilterOption {
  value: string;
  label: string;
}

interface TableFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  yearGroupFilter: string;
  onYearGroupChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
  accentColor?: 'blue' | 'purple' | 'orange';
}

const TableFilters: React.FC<TableFiltersProps> = memo(({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search by name or reg number...',
  yearGroupFilter,
  onYearGroupChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  accentColor = 'blue'
}) => {
  const ringColors = {
    blue: 'focus:ring-blue-500',
    purple: 'focus:ring-purple-500',
    orange: 'focus:ring-orange-500'
  };

  return (
    <div className="p-6 border-b border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${ringColors[accentColor]}`}
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={yearGroupFilter}
            onChange={(e) => onYearGroupChange(e.target.value)}
            className={`px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${ringColors[accentColor]}`}
          >
            <option value="all">All Year Groups</option>
            {YEAR_GROUPS.map(yg => (
              <option key={yg} value={yg}>{yg}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${ringColors[accentColor]}`}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});

TableFilters.displayName = 'TableFilters';

export default TableFilters;
