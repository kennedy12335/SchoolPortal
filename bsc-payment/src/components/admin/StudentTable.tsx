import React, { memo } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface StudentTableProps {
  data: any[];
  columns: Column[];
  loading: boolean;
  emptyMessage?: string;
  keyField: string;
  accentColor?: 'blue' | 'purple' | 'orange';
}

const StudentTable: React.FC<StudentTableProps> = memo(({
  data,
  columns,
  loading,
  emptyMessage = 'No data found.',
  keyField,
  accentColor = 'blue'
}) => {
  const spinnerColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <RefreshCw className={`w-6 h-6 ${spinnerColors[accentColor]} animate-spin mx-auto`} />
        <p className="mt-2 text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
      <table className="w-full">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map(row => (
            <tr key={row[keyField]} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : (
                    <span className="text-sm text-gray-500">{row[col.key]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="p-8 text-center text-gray-500">{emptyMessage}</div>
      )}
    </div>
  );
});

StudentTable.displayName = 'StudentTable';

export default StudentTable;

// Helper render functions for common column types
export const renderName = (value: any, row: any) => (
  <div className="font-medium text-gray-900">
    {row.first_name} {row.last_name}
  </div>
);

export const renderText = (value: any) => (
  <span className="text-sm text-gray-500">{value}</span>
);

export const renderPaidStatus = (isPaid: boolean) => (
  isPaid ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3 mr-1" />
      Paid
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      <XCircle className="w-3 h-3 mr-1" />
      Unpaid
    </span>
  )
);

export const renderExamStatus = (isFullyPaid: boolean, amountPaid: number) => {
  if (isFullyPaid) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" /> Paid
      </span>
    );
  } else if (amountPaid > 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" /> Partial
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" /> Unpaid
      </span>
    );
  }
};

export const renderPaymentConfirmed = (confirmed: boolean) => (
  confirmed ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </span>
  )
);

export const renderMemberStatus = (status: string) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
  }`}>
    {status}
  </span>
);

export const renderCurrency = (amount: number | null, color: 'green' | 'red' | 'gray' = 'gray') => {
  if (amount === null || amount === undefined) {
    return <span className="text-gray-400">-</span>;
  }

  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const colorClass = {
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-500'
  };

  return <span className={`text-sm font-medium ${colorClass[color]}`}>{formatted}</span>;
};
