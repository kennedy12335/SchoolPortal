import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, CardContent, Button, Separator } from '../components/ui';
import { EmptyState } from '../components/shared';
import { ExamList, ExamPaymentDetails, Exam, SelectedExamInfo } from '../components/exam-fees';
import { ParentsApi, StudentSummary } from '../api/parents';
import { ExamsApi } from '../api/exams';

type Props = NativeStackScreenProps<any>;

export const ExamFeesScreen: React.FC<Props> = ({ navigation, route }) => {
  const studentId = route.params?.studentId;

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    studentId ? String(studentId) : null
  );
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExams, setSelectedExams] = useState<Map<string, SelectedExamInfo>>(new Map());
  const [parentId, setParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingExams, setIsFetchingExams] = useState(false);

  // For demo - hardcoded parent ID
  const demoParentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315';

  // `allows_installments` is provided by the API on each exam item and should be
  // used to determine whether partial/installment payments are allowed for that exam.

  // Load parent students and initial exams
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const parentResponse = await ParentsApi.getParentStudents(demoParentId);
        setParentId(parentResponse.parent.id);
        setStudents(parentResponse.students);

        const initialId = selectedStudentId ?? (parentResponse.students[0] ? String(parentResponse.students[0].id) : null);
        setSelectedStudentId(initialId);

        if (!initialId) {
          setError('No student available');
          setExams([]);
          setStudent(null);
          setLoading(false);
          return;
        }

        const examResponse = await ExamsApi.getStudentExamList(String(initialId));
        const foundStudent = parentResponse.students.find((s) => String(s.id) === String(initialId));

        setStudent(foundStudent || null);
        setExams(examResponse.exam_list || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch exams when selected student changes
  useEffect(() => {
    const fetchExamsForStudent = async () => {
      if (!selectedStudentId) {
        setStudent(null);
        setExams([]);
        return;
      }

      try {
        setIsFetchingExams(true);
        const examResponse = await ExamsApi.getStudentExamList(String(selectedStudentId));
        // Use already-loaded students list instead of refetching parent students
        const foundStudent = students.find((s) => String(s.id) === String(selectedStudentId));

        setStudent(foundStudent || null);
        setExams(examResponse.exam_list || []);
        setSelectedExams(new Map()); // clear previous selections
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load exams for student');
      } finally {
        setIsFetchingExams(false);
      }
    };

    // only fetch when selection changes (ignore initial null)
    fetchExamsForStudent();
  }, [selectedStudentId, students]);

  const handleToggleExam = (examId: string, exam: Exam) => {
    setSelectedExams((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(examId)) {
        newMap.delete(examId);
      } else {
        newMap.set(examId, {
          exam,
          paymentAmount: (exam.allows_installments || exam.amount_paid > 0) ? 0 : exam.amount_due,
          includeTextbook: false,
          extraFeeAmount: exam.extra_fees || 0,
        });
      }
      return newMap;
    });
  };

  const handleUpdatePaymentAmount = (examId: string, amount: number) => {
    setSelectedExams((prev) => {
      const newMap = new Map(prev);
      const info = newMap.get(examId);
      if (info) {
        newMap.set(examId, { ...info, paymentAmount: amount });
      }
      return newMap;
    });
  };

  const handleToggleTextbook = (examId: string) => {
    setSelectedExams((prev) => {
      const newMap = new Map(prev);
      const info = newMap.get(examId);
      if (info) {
        newMap.set(examId, { ...info, includeTextbook: !info.includeTextbook });
      }
      return newMap;
    });
  };

  const handleRemoveExam = (examId: string) => {
    setSelectedExams((prev) => {
      const newMap = new Map(prev);
      newMap.delete(examId);
      return newMap;
    });
  };

  const handlePayFullBalance = (examId: string) => {
    setSelectedExams((prev) => {
      const newMap = new Map(prev);
      const info = newMap.get(examId);
      if (info) {
        newMap.set(examId, { ...info, paymentAmount: info.exam.amount_due });
      }
      return newMap;
    });
  };

  const calculateTotalAmount = (): number => {
    let total = 0;
    selectedExams.forEach((info) => {
      total += info.paymentAmount + (info.includeTextbook ? (info.extraFeeAmount || 0) : 0);
    });
    return total;
  };

  const hasValidPaymentAmounts = (): boolean => {
    for (const info of Array.from(selectedExams.values())) {
      if ((info.exam.allows_installments || info.exam.amount_paid > 0) && info.paymentAmount <= 0) {
        return false;
      }
    }
    return true;
  };

  const totalAmount = calculateTotalAmount();
  const canSubmit =
    selectedExams.size > 0 && totalAmount > 0 && hasValidPaymentAmounts() && !isSubmitting;

  const handlePayment = async () => {
    if (!canSubmit || !student) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const examPayments = Array.from(selectedExams.values()).map((info) => ({
        exam_id: info.exam.exam_id,
        amount_paid: info.paymentAmount,
      }));

      const response = await ExamsApi.payForExam({
        student_id: studentId,
        exam_payments: examPayments,
        amount: totalAmount,
        payment_method: 'online',
        parent_id: parentId,
      });

      if (response.data?.authorization_url) {
        await Linking.openURL(response.data.authorization_url);
      } else {
        setError(response.message || 'No authorization URL received');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to initialize payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingPlaceholder} />
      </SafeAreaView>
    );
  }

  if (!student && students.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <EmptyState
          iconName="person-outline"
          title="No students found"
          description="You don't have any students associated with this account."
          actionLabel="Go Back"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={styles.title}>Exam Fees</Text>
            </View>

            {/* Student selector - buttons for switching students */}
            {students.length > 1 && (
              <View style={styles.studentSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.studentChips}>
                    {students.map((student) => {
                      const isActive = String(student.id) === selectedStudentId;
                      return (
                        <TouchableOpacity
                          key={student.id}
                          style={[styles.studentChip, isActive && styles.studentChipActive]}
                          onPress={() => setSelectedStudentId(String(student.id))}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.studentChipText, isActive && styles.studentChipTextActive]}>
                            {student.first_name} {student.last_name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            <Text style={styles.subtitle}>
              {student ? `Pay exam fees for ${student.first_name} ${student.last_name}` : 'Select a student to view exams'}
            </Text>
          </View>
        </View>

        {isFetchingExams ? (
          <View style={[styles.emptyContainer, styles.centered]}> 
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading exams...</Text>
          </View>
        ) : exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              iconName="book-outline"
              title={student ? "No exams available" : "No student selected"}
              description={student ? "This student is not eligible for any exams at the moment." : "Select a student to view exams."}
              actionLabel="Go Back"
              onAction={() => navigation.goBack()}
            />
          </View>
        ) : (
          <>
            {/* Exam List */}
            <View style={styles.examSection}>
              <ExamList
                exams={exams}
                selectedExamIds={new Set(selectedExams.keys())}
                onToggleExam={handleToggleExam}
              />
            </View>

            {/* Selected Exams Details */}
            {selectedExams.size > 0 && (
              <>
                <View style={styles.detailsSection}>
                  <ExamPaymentDetails
                    selectedExams={selectedExams}
                    onUpdatePaymentAmount={handleUpdatePaymentAmount}
                    onToggleTextbook={handleToggleTextbook}
                    onRemoveExam={handleRemoveExam}
                    onPayFullBalance={handlePayFullBalance}
                  />
                </View>

                {/* Payment Summary */}
                <Card style={styles.summaryCard}>
                  <CardContent style={styles.summaryContent}>
                    <View style={styles.summaryTitleRow}>
                      <Ionicons name="receipt-outline" size={18} color={colors.foreground} />
                      <Text style={styles.summaryTitle}>Payment Summary</Text>
                    </View>

                    {Array.from(selectedExams.values()).map((info) => (
                      <View key={info.exam.exam_id} style={styles.summaryRow}>
                        <View style={styles.summaryExamInfo}>
                          <Text style={styles.summaryExamName}>{info.exam.exam_name}</Text>
                          {info.includeTextbook && info.exam.extra_fees_name && (
                            <Text style={styles.summaryTextbook}>+ {info.exam.extra_fees_name}</Text>
                          )}
                        </View>
                        <Text style={styles.summaryAmount}>
                          N{(info.paymentAmount + (info.includeTextbook ? (info.extraFeeAmount || 0) : 0)).toLocaleString()}
                        </Text>
                      </View>
                    ))}

                    <Separator />

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalValue}>N{totalAmount.toLocaleString()}</Text>
                    </View>

                    {!hasValidPaymentAmounts() && (
                      <View style={styles.warningBanner}>
                        <Ionicons name="warning-outline" size={18} color={colors.warningForeground} />
                        <Text style={styles.warningText}>
                          Please enter payment amounts for all selected exams.
                        </Text>
                      </View>
                    )}

                    {error && (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={18} color={colors.errorForeground} />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      disabled={!canSubmit}
                      loading={isSubmitting}
                      onPress={handlePayment}
                      icon={<Ionicons name="card-outline" size={18} color={colors.white} />}
                    >
                      {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerBar: {
    padding: spacing[4],
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },

  // Header
  headerSection: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  headerContent: {
    marginTop: spacing[2],
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    letterSpacing: typography.tight_ls,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.mutedForeground,
    lineHeight: typography.base * 1.5,
  },

  // Student selector
  studentSelector: {
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  studentChips: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  studentChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  studentChipText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.foreground,
  },
  studentChipTextActive: {
    color: colors.white,
    fontWeight: typography.semibold,
  },

  // Sections
  emptyContainer: {
    paddingHorizontal: spacing[5],
  },
  centered: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  loadingText: {
    marginTop: spacing[3],
    color: colors.mutedForeground,
  },
  examSection: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  detailsSection: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },

  // Summary Card
  summaryCard: {
    marginHorizontal: spacing[5],
    ...shadows.colored,
  },
  summaryContent: {
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
    paddingHorizontal: spacing[5],
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  summaryTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.foreground,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  summaryExamInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  summaryExamName: {
    fontSize: typography.sm,
    color: colors.foreground,
    marginBottom: spacing[0.5],
  },
  summaryTextbook: {
    fontSize: typography.xs,
    color: colors.examFees,
    fontWeight: typography.medium,
  },
  summaryAmount: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  totalLabel: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.foreground,
  },
  totalValue: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.primary,
  },

  // Banners
  warningBanner: {
    padding: spacing[4],
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  warningText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.warningForeground,
  },
  errorBanner: {
    padding: spacing[4],
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.errorForeground,
  },
});

export default ExamFeesScreen;
