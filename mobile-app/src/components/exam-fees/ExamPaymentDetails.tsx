import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Checkbox } from '../ui';
import { Exam } from './ExamList';

// Icons
const TrashIcon = () => <Text style={styles.iconText}>🗑️</Text>;

export interface SelectedExamInfo {
  exam: Exam;
  paymentAmount: number;
  includeTextbook: boolean;
}

interface ExamPaymentDetailsProps {
  selectedExams: Map<string, SelectedExamInfo>;
  textbookPrice: number;
  onUpdatePaymentAmount: (examId: string, amount: number) => void;
  onToggleTextbook: (examId: string) => void;
  onRemoveExam: (examId: string) => void;
  onPayFullBalance: (examId: string) => void;
}

export const ExamPaymentDetails: React.FC<ExamPaymentDetailsProps> = ({
  selectedExams,
  textbookPrice,
  onUpdatePaymentAmount,
  onToggleTextbook,
  onRemoveExam,
  onPayFullBalance,
}) => {
  const allowsPartialPayment = (examName: string): boolean => {
    const name = examName.toLowerCase();
    return name.includes('igcse') || name.includes('checkpoint');
  };

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
          const allowsPartial = allowsPartialPayment(info.exam.exam_name);
          const showTextbookOption = isSAT(info.exam.exam_name);

          return (
            <View key={examId} style={styles.examCard}>
              <View style={styles.examHeader}>
                <Text style={styles.examName}>{info.exam.exam_name}</Text>
                <TouchableOpacity onPress={() => onRemoveExam(examId)} style={styles.removeButton}>
                  <TrashIcon />
                </TouchableOpacity>
              </View>

              {/* Payment Amount */}
              <View style={styles.amountSection}>
                <Text style={styles.label}>Payment Amount</Text>
                {allowsPartial ? (
                  <View style={styles.amountRow}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencyPrefix}>₦</Text>
                      <Input
                        value={info.paymentAmount > 0 ? String(info.paymentAmount) : ''}
                        onChangeText={(text) => {
                          const amount = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                          onUpdatePaymentAmount(examId, Math.min(amount, info.exam.amount_due));
                        }}
                        keyboardType="numeric"
                        placeholder="0"
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
                      ₦{info.exam.amount_due.toLocaleString()}
                    </Text>
                    <Text style={styles.fixedAmountNote}>(Full payment required)</Text>
                  </View>
                )}

                {allowsPartial && info.exam.amount_due > 0 && (
                  <Text style={styles.balanceNote}>
                    Balance due: ₦{info.exam.amount_due.toLocaleString()}
                  </Text>
                )}
              </View>

              {/* Study Materials Option (SAT only) */}
              {showTextbookOption && (
                <TouchableOpacity
                  style={styles.textbookRow}
                  onPress={() => onToggleTextbook(examId)}
                >
                  <Checkbox
                    checked={info.includeTextbook}
                    onPress={() => onToggleTextbook(examId)}
                  />
                  <View style={styles.textbookInfo}>
                    <Text style={styles.textbookLabel}>Include Study Materials</Text>
                    <Text style={styles.textbookPrice}>₦{textbookPrice.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Subtotal */}
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>Exam Total</Text>
                <Text style={styles.subtotalValue}>
                  ₦{(info.paymentAmount + (info.includeTextbook ? textbookPrice : 0)).toLocaleString()}
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
    backgroundColor: colors.gray50,
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
    fontWeight: typography.medium,
    color: colors.foreground,
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
    padding: spacing[3],
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
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
    color: colors.purple,
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
  iconText: {
    fontSize: 16,
  },
});

export default ExamPaymentDetails;
