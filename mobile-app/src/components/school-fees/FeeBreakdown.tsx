import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, CardHeader, CardTitle, CardContent, Separator } from '../ui';

interface ClubFee {
  id: string;
  name: string;
  price: number;
}

interface StudentFeeBreakdown {
  fees: Record<string, number>;
  club_fees?: ClubFee[];
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
  const [expanded, setExpanded] = useState(false);

  if (studentFees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <TouchableOpacity style={styles.headerRow} onPress={() => setExpanded((s) => !s)}>
          <View style={styles.headerLeft}>
            <CardTitle>Fee Breakdown</CardTitle>
            <Text style={styles.headerSubtitle}>{studentFees.length} student(s)</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTotal}>N{totalAmount.toLocaleString()}</Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.mutedForeground}
            />
          </View>
        </TouchableOpacity>
      </CardHeader>

      <CardContent style={styles.content}>
        {expanded ? (
          // Full detailed breakdown (existing behavior)
          studentFees.map((fee, index) => (
            <View key={fee.student_id} style={styles.studentSection}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>{fee.student_name}</Text>
                <Text style={styles.studentTotal}>
                  N{fee.fee_breakdown.final_amount.toLocaleString()}
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
          ))
        ) : (
          // Collapsed view: show per-student totals only (no itemized fees)
          <View style={styles.collapsedList}>
            {studentFees.map((fee) => (
              <View key={fee.student_id} style={styles.studentRow}>
                <Text style={styles.studentName}>{fee.student_name}</Text>
                <Text style={styles.studentTotal}>
                  N{fee.fee_breakdown.final_amount.toLocaleString()}
                </Text>
              </View>
            ))}

            {studentFees.length > 1 && (
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Total Amount</Text>
                <Text style={styles.grandTotalValue}>N{totalAmount.toLocaleString()}</Text>
              </View>
            )}
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
        {discount ? '-' : ''}N{Math.abs(amount).toLocaleString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing[6],
  },

  // Header / toggle
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  headerLeft: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  headerTotal: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },

  // Student sections
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
  collapsedList: {
    gap: spacing[2],
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  feesContainer: {
    gap: spacing[2],
  },
  feeGroup: {
    gap: spacing[1.5],
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
    color: colors.examFees,
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
