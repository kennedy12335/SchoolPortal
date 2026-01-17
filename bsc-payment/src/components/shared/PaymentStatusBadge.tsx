import React from 'react';
import { Badge } from '../ui/badge';
import { Check, AlertCircle, Clock } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: 'paid' | 'unpaid' | 'partial' | 'pending';
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'default'
}) => {
  const variants = {
    paid: {
      variant: 'success' as const,
      label: 'Paid',
      icon: Check
    },
    unpaid: {
      variant: 'destructive' as const,
      label: 'Unpaid',
      icon: AlertCircle
    },
    partial: {
      variant: 'warning' as const,
      label: 'Partial',
      icon: Clock
    },
    pending: {
      variant: 'secondary' as const,
      label: 'Pending',
      icon: Clock
    }
  };

  const { variant, label, icon: Icon } = variants[status];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : '';

  return (
    <Badge variant={variant} className={sizeClasses}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
};

export default PaymentStatusBadge;
