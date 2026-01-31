import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Checkbox } from '../ui';
import { Exam } from './ExamList';

export interface SelectedExamInfo {
  exam: Exam;
  paymentAmount: number;
  includeTextbook: boolean;
  extraFeeAmount?: number;
}

interface ExamPaymentDetailsProps {
  selectedExams: Map<string, SelectedExamInfo>;
  onUpdatePaymentAmount: (examId: string, amount: number) => void;
  onToggleTextbook: (examId: string) => void;
  onRemoveExam: (examId: string) => void;
  onPayFullBalance: (examId: string) => void;
}

export const ExamPaymentDetails: React.FC<ExamPaymentDetailsProps> = ({
  selectedExams,
  onUpdatePaymentAmount,
  onToggleTextbook,
  onRemoveExam,
  onPayFullBalance,
}) => {
  const isSAT = (examName: string): boolean => {
    return examName.toLowerCase().includes('sat');
  };

  if (selectedExams.size === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent style={styles.content}>
        {Array.from(selectedExams.entries()).map(([examId, info]) => {
          // Show input when exam allows installments or when a partial payment already exists
          const allowsInstallments = !!info.exam.allows_installments || info.exam.amount_paid > 0;
          const showExtraFeesOption = !!info.exam.extra_fees && info.exam.extra_fees > 0 && !!info.exam.extra_fees_name;

          return (
            <View key={examId} style={styles.examCard}>
              <View style={styles.examHeader}>
                <Text style={styles.examName}>{info.exam.exam_name}</Text>
                <TouchableOpacity onPress={() => onRemoveExam(examId)} style={styles.removeButton}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>

              {/* Payment Amount */}
              <View style={styles.amountSection}>
                <Text style={styles.label}>Payment Amount</Text>
                {allowsInstallments ? (
                  <View style={styles.amountRow}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencyPrefix}>N</Text>
                      <Input
                        value={info.paymentAmount > 0 ? info.paymentAmount.toLocaleString() : ''}
                        onChangeText={(text) => {
                          const amount = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                          onUpdatePaymentAmount(examId, Math.min(amount, info.exam.amount_due));
                        }}
                        keyboardType="numeric"
                        placeholder="Enter amount to pay now"
                        containerStyle={styles.input}
                      />
                    </View>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => onPayFullBalance(examId)}
                    >
                      Pay Full
                    </Button>
                  </View>
                ) : (
                  <View style={styles.fixedAmount}>
                    <Text style={styles.fixedAmountText}>
                      N{info.exam.amount_due.toLocaleString()}
                    </Text>
                    <Text style={styles.fixedAmountNote}>(Full payment required)</Text>
                  </View>
                )}

                {allowsInstallments && info.exam.amount_due > 0 && (
                  <Text style={styles.balanceNote}>
                    Balance due: N{info.exam.amount_due.toLocaleString()}
                  </Text>
                )}

                {allowsInstallments && (
                  <Text style={[styles.balanceNote, {marginTop: 6}]}>Installments allowed — enter the amount you wish to pay now.</Text>
                )}
              </View>

              {/* Study Materials Option (if extra fees exist) */}
              {showExtraFeesOption && (
                <TouchableOpacity
                  style={styles.textbookRow}
                  onPress={() => onToggleTextbook(examId)}
                >
                  <Checkbox
                    checked={info.includeTextbook}
                    onPress={() => onToggleTextbook(examId)}
                  />
                  <View style={styles.textbookInfo}>
                    <Text style={styles.textbookLabel}>Include {info.exam.extra_fees_name}</Text>
                    <Text style={styles.textbookPrice}>N{info.exam.extra_fees.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Subtotal */}
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Exam Total</Text>
                <Text style={styles.subtotalValue}>
                  N{(info.paymentAmount + (info.includeTextbook && showExtraFeesOption ? info.exam.extra_fees : 0)).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing[4],
  },
  examCard: {
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing[4],
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
    flex: 1,
  },
  removeButton: {
    padding: spacing[2],
  },
  amountSection: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.foreground,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
  },
  fixedAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  fixedAmountText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  fixedAmountNote: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  balanceNote: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  textbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  textbookInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textbookLabel: {
    fontSize: typography.sm,
    color: colors.foreground,
  },
  textbookPrice: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.examFees,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subtotalLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.foreground,
  },
  subtotalValue: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.primary,
  },
});

export default ExamPaymentDetails;
