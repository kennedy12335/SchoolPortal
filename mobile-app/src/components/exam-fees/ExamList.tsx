import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../ui';

// Icons
const PlusIcon = () => <Text style={styles.iconText}>+</Text>;
const MinusIcon = () => <Text style={styles.iconText}>−</Text>;
const CheckIcon = () => <Text style={styles.iconText}>✓</Text>;

export interface Exam {
  exam_id: string;
  exam_name: string;
  exam_price: number;
  extra_fees: number;
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
  const allowsPartialPayment = (examName: string): boolean => {
    const name = examName.toLowerCase();
    return name.includes('igcse') || name.includes('checkpoint');
  };

  const unpaidExams = exams.filter((e) => !e.is_fully_paid);
  const paidExams = exams.filter((e) => e.is_fully_paid);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Exams</CardTitle>
      </CardHeader>
      <CardContent style={styles.content}>
        {/* Unpaid Exams */}
        {unpaidExams.length > 0 && (
          <View style={styles.examGroup}>
            {unpaidExams.map((exam) => {
              const isSelected = selectedExamIds.has(exam.exam_id);
              const allowsPartial = allowsPartialPayment(exam.exam_name);

              return (
                <View
                  key={exam.exam_id}
                  style={[styles.examItem, isSelected && styles.examItemSelected]}
                >
                  <View style={styles.examInfo}>
                    <View style={styles.examHeader}>
                      <Text style={styles.examName}>{exam.exam_name}</Text>
                      <View style={styles.examBadges}>
                        {allowsPartial && (
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
                      <Text style={styles.examPrice}>₦{exam.exam_price.toLocaleString()}</Text>
                      {exam.amount_due < exam.exam_price && (
                        <Text style={styles.examDue}>
                          Due: ₦{exam.amount_due.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => onToggleExam(exam.exam_id, exam)}
                    style={[styles.toggleButton, isSelected && styles.toggleButtonSelected]}
                  >
                    {isSelected ? <MinusIcon /> : <PlusIcon />}
                  </TouchableOpacity>
                </View>
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
                  <Text style={styles.examPrice}>₦{exam.exam_price.toLocaleString()}</Text>
                </View>
                <View style={styles.paidIcon}>
                  <CheckIcon />
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
    justifyContent: 'space-between',
    padding: spacing[3],
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  examItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  examItemPaid: {
    opacity: 0.6,
    backgroundColor: colors.successLight,
    borderColor: colors.success,
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
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonSelected: {
    backgroundColor: colors.error,
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
  iconText: {
    fontSize: 18,
    fontWeight: typography.bold,
    color: colors.foreground,
  },
});

export default ExamList;
