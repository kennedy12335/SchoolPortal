import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, CardHeader, CardTitle, CardContent, Badge, Checkbox } from '../ui';

export interface Exam {
  exam_id: string;
  exam_name: string;
  exam_price: number;
  extra_fees: number;
  extra_fees_name?: string;
  allows_installments?: boolean;
  amount_paid: number;
  amount_due: number;
  is_fully_paid: boolean;
}

interface ExamListProps {
  exams: Exam[];
  selectedExamIds: Set<string>;
  onToggleExam: (examId: string, exam: Exam) => void;
}

export const ExamList: React.FC<ExamListProps> = ({ exams, selectedExamIds, onToggleExam }) => {
  // `allows_installments` is provided by the API on the exam object
  // and indicates whether installment payments are allowed for that exam.


  const unpaidExams = exams.filter((e) => !e.is_fully_paid);
  const paidExams = exams.filter((e) => e.is_fully_paid);

  return (
    <Card>
      <CardHeader>
        <View style={styles.headerContent}>
          <CardTitle>Available Exams</CardTitle>
          {unpaidExams.length > 0 && (
            <Text style={styles.helperText}>Select one or more exams to pay for</Text>
          )}
        </View>
      </CardHeader>
      <CardContent style={styles.content}>
        {/* Unpaid Exams */}
        {unpaidExams.length > 0 && (
          <View style={styles.examGroup}>
            {unpaidExams.map((exam) => {
              const isSelected = selectedExamIds.has(exam.exam_id);
              const allowsInstallments = !!exam.allows_installments;

              return (
                <TouchableOpacity
                  key={exam.exam_id}
                  style={[styles.examItem, isSelected && styles.examItemSelected]}
                  onPress={() => onToggleExam(exam.exam_id, exam)}
                  activeOpacity={0.7}
                >
                  <Checkbox
                    checked={isSelected}
                    onPress={() => onToggleExam(exam.exam_id, exam)}
                  />
                  <View style={styles.examInfo}>
                    <View style={styles.examHeader}>
                      <Text style={styles.examName}>{exam.exam_name}</Text>
                      <View style={styles.examBadges}>
                        {allowsInstallments && (
                          <Badge variant="secondary" size="sm">
                            Installments
                          </Badge>
                        )}
                        {exam.amount_paid > 0 && (
                          <Badge variant="warning" size="sm">
                            Partial
                          </Badge>
                        )}
                      </View>
                    </View>
                    <View style={styles.examPriceRow}>
                      <Text style={styles.examPrice}>N{exam.exam_price.toLocaleString()}</Text>
                      {exam.amount_due < exam.exam_price && (
                        <Text style={styles.examDue}>
                          Due: N{exam.amount_due.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Paid Exams */}
        {paidExams.length > 0 && (
          <View style={styles.examGroup}>
            <Text style={styles.sectionLabel}>Paid Exams</Text>
            {paidExams.map((exam) => (
              <View key={exam.exam_id} style={[styles.examItem, styles.examItemPaid]}>
                <View style={styles.examInfo}>
                  <Text style={[styles.examName, styles.examNamePaid]}>{exam.exam_name}</Text>
                  <Text style={styles.examPrice}>N{exam.exam_price.toLocaleString()}</Text>
                </View>
                <View style={styles.paidIcon}>
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                </View>
              </View>
            ))}
          </View>
        )}

        {exams.length === 0 && (
          <Text style={styles.emptyText}>No exams available for this student.</Text>
        )}
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerContent: {
    gap: spacing[1],
  },
  helperText: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    fontWeight: typography.normal,
  },
  content: {
    gap: spacing[4],
  },
  examGroup: {
    gap: spacing[3],
  },
  sectionLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing[3],
  },
  examItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  examItemPaid: {
    opacity: 0.6,
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  examInfo: {
    flex: 1,
    gap: spacing[1],
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  examName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.foreground,
  },
  examNamePaid: {
    color: colors.successForeground,
  },
  examBadges: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  examPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  examPrice: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  examDue: {
    fontSize: typography.sm,
    color: colors.warning,
  },
  paidIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingVertical: spacing[4],
  },
});

export default ExamList;
