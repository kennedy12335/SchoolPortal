import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { Card, CardHeader, CardTitle, CardContent, Separator } from '../ui';

interface ClubFee {
  id: string;
  name: string;
  price: number;
}

interface StudentFeeBreakdown {
  fees: Record<string, number>;
  club_fees: ClubFee[];
  subtotal: number;
  discount_amount?: number;
  discount_percentage?: number;
  percentage_discount_amount?: number;
  final_amount: number;
}

interface StudentFeeDetail {
  student_id: string;
  student_name: string;
  fee_breakdown: StudentFeeBreakdown;
}

interface FeeBreakdownProps {
  studentFees: StudentFeeDetail[];
  totalAmount: number;
}

export const FeeBreakdown: React.FC<FeeBreakdownProps> = ({ studentFees, totalAmount }) => {
  if (studentFees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Breakdown</CardTitle>
      </CardHeader>
      <CardContent style={styles.content}>
        {studentFees.map((fee, index) => (
          <View key={fee.student_id} style={styles.studentSection}>
            <View style={styles.studentHeader}>
              <Text style={styles.studentName}>{fee.student_name}</Text>
              <Text style={styles.studentTotal}>
                ₦{fee.fee_breakdown.final_amount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.feesContainer}>
              {/* Base fees (dynamic) */}
              <View style={styles.feeGroup}>
                {Object.entries(fee.fee_breakdown.fees ?? {}).map(([label, value]) => (
                  <FeeItem key={label} label={label} amount={Number(value) || 0} />
                ))}
              </View>

              {/* Discounts */}
              {((fee.fee_breakdown.discount_amount ?? 0) > 0 ||
                (fee.fee_breakdown.discount_percentage ?? 0) > 0) && (
                <View style={styles.discountGroup}>
                  {(fee.fee_breakdown.discount_amount ?? 0) > 0 && (
                    <FeeItem
                      label="Fixed Discount"
                      amount={-(fee.fee_breakdown.discount_amount ?? 0)}
                      discount
                    />
                  )}
                  {(fee.fee_breakdown.discount_percentage ?? 0) > 0 && (
                    <FeeItem
                      label={`Discount (${fee.fee_breakdown.discount_percentage}%)`}
                      amount={-(fee.fee_breakdown.percentage_discount_amount ?? 0)}
                      discount
                    />
                  )}
                </View>
              )}

              {/* Total amount for this student */}
              <View style={styles.finalRow}>
                <FeeItem label="Total" amount={fee.fee_breakdown.final_amount} bold />
              </View>
            </View>

            {studentFees.length > 1 && index < studentFees.length - 1 && (
              <Separator style={styles.studentSeparator} />
            )}
          </View>
        ))}

        {/* Grand Total */}
        {studentFees.length > 1 && (
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>₦{totalAmount.toLocaleString()}</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
};

interface FeeItemProps {
  label: string;
  amount: number;
  bold?: boolean;
  discount?: boolean;
  highlight?: boolean;
}

const FeeItem: React.FC<FeeItemProps> = ({ label, amount, bold, discount, highlight }) => {
  return (
    <View style={styles.feeItem}>
      <Text
        style={[
          styles.feeLabel,
          bold && styles.feeBold,
          highlight && styles.feeHighlight,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.feeAmount,
          bold && styles.feeBold,
          discount && styles.feeDiscount,
          highlight && styles.feeHighlight,
        ]}
      >
        {discount ? '-' : ''}₦{Math.abs(amount).toLocaleString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
  },
  studentSection: {
    gap: spacing[3],
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  studentTotal: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
  },
  feesContainer: {
    gap: spacing[2],
  },
  feeGroup: {
    gap: spacing[1.5],
  },
  sectionLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.foreground,
  },
  discountGroup: {
    gap: spacing[1.5],
  },
  finalRow: {
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  studentSeparator: {
    marginTop: spacing[4],
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  feeAmount: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  feeBold: {
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  feeDiscount: {
    color: colors.success,
  },
  feeHighlight: {
    color: colors.indigo,
  },
  grandTotal: {
    paddingTop: spacing[4],
    borderTopWidth: 2,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.foreground,
  },
  grandTotalValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
  },
});

export default FeeBreakdown;
