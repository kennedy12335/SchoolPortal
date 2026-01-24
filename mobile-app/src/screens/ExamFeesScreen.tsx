import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Card, CardHeader, CardTitle, CardContent, Button, Separator } from '../components/ui';
import { EmptyState } from '../components/shared';
import { ExamList, ExamPaymentDetails, Exam, SelectedExamInfo } from '../components/exam-fees';
import { ParentsApi, StudentSummary } from '../api/parents';
import { ExamsApi } from '../api/exams';

type Props = NativeStackScreenProps<any>;

// Icons
const ArrowLeftIcon = () => <Text style={styles.iconText}>←</Text>;
const CreditCardIcon = () => <Text style={styles.iconText}>💳</Text>;
const BookOpenIcon = () => <Text style={styles.iconEmoji}>📚</Text>;

const TEXTBOOK_PRICE = 15000;

export const ExamFeesScreen: React.FC<Props> = ({ navigation, route }) => {
  const studentId = route.params?.studentId;

  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExams, setSelectedExams] = useState<Map<string, SelectedExamInfo>>(new Map());
  const [parentId, setParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For demo - hardcoded parent ID
  const demoParentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315';

  const allowsPartialPayment = (examName: string): boolean => {
    const name = examName.toLowerCase();
    return name.includes('igcse') || name.includes('checkpoint');
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!studentId) {
        setError('No student selected');
        return;
      }

      try {
        const [parentResponse, examResponse] = await Promise.all(
          [
            ParentsApi.getParentStudents(demoParentId),
            ExamsApi.getStudentExamList(String(studentId)),
          ] as const
        );

        setParentId(parentResponse.parent.id);
        const foundStudent = parentResponse.students.find(
          (s) => String(s.id) === String(studentId)
        );
        setStudent(foundStudent || null);
        setExams(examResponse.exam_list || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      }
    };

    loadData();
  }, [studentId]);

  const handleToggleExam = (examId: string, exam: Exam) => {
    setSelectedExams((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(examId)) {
        newMap.delete(examId);
      } else {
        newMap.set(examId, {
          exam,
          paymentAmount: allowsPartialPayment(exam.exam_name) ? 0 : exam.amount_due,
          includeTextbook: false,
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
      total += info.paymentAmount + (info.includeTextbook ? TEXTBOOK_PRICE : 0);
    });
    return total;
  };

  const hasValidPaymentAmounts = (): boolean => {
    for (const info of Array.from(selectedExams.values())) {
      if (allowsPartialPayment(info.exam.exam_name) && info.paymentAmount <= 0) {
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

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeftIcon />
          </TouchableOpacity>
        </View>
        <EmptyState
          title="Student not found"
          description="The selected student could not be found."
          actionLabel="Go to Dashboard"
          onAction={() => navigation.navigate('Home')}
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
        {/* Modern Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeftIcon />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Exam Fees Payment</Text>
            <Text style={styles.subtitle}>
              Pay exam fees for {student.first_name} {student.last_name}
            </Text>
          </View>
        </View>

        {exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<BookOpenIcon />}
              title="No exams available"
              description="This student is not eligible for any exams at the moment."
              actionLabel="Go Back"
              onAction={() => navigation.goBack()}
            />
          </View>
        ) : (
          <>
            {/* Exam List */}
            <View style={styles.examSection}>
              <Text style={styles.sectionLabel}>Available Exams</Text>
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
                  <Text style={styles.sectionLabel}>Payment Details</Text>
                  <ExamPaymentDetails
                    selectedExams={selectedExams}
                    textbookPrice={TEXTBOOK_PRICE}
                    onUpdatePaymentAmount={handleUpdatePaymentAmount}
                    onToggleTextbook={handleToggleTextbook}
                    onRemoveExam={handleRemoveExam}
                    onPayFullBalance={handlePayFullBalance}
                  />
                </View>

                {/* Payment Summary */}
                <Card style={styles.summaryCard}>
                  <CardContent style={styles.summaryContent}>
                    <Text style={styles.summaryTitle}>Payment Summary</Text>
                    
                    {Array.from(selectedExams.values()).map((info) => (
                      <View key={info.exam.exam_id} style={styles.summaryRow}>
                        <View style={styles.summaryExamInfo}>
                          <Text style={styles.summaryExamName}>{info.exam.exam_name}</Text>
                          {info.includeTextbook && (
                            <Text style={styles.summaryTextbook}>+ Study Materials</Text>
                          )}
                        </View>
                        <Text style={styles.summaryAmount}>
                          ₦{(info.paymentAmount + (info.includeTextbook ? TEXTBOOK_PRICE : 0)).toLocaleString()}
                        </Text>
                      </View>
                    ))}

                    <Separator />

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Amount</Text>
                      <Text style={styles.totalValue}>₦{totalAmount.toLocaleString()}</Text>
                    </View>

                    {!hasValidPaymentAmounts() && (
                      <View style={styles.warningBanner}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.warningText}>
                          Please enter payment amounts for all selected exams.
                        </Text>
                      </View>
                    )}

                    {error && (
                      <View style={styles.errorBanner}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      disabled={!canSubmit}
                      onPress={handlePayment}
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
    backgroundColor: colors.gray50,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  headerBar: {
    padding: spacing[4],
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  
  // Header
  headerSection: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  headerContent: {
    marginTop: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white || '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.mutedForeground,
    lineHeight: typography.base * 1.5,
  },
  
  // Sections
  emptyContainer: {
    paddingHorizontal: spacing[6],
  },
  examSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  detailsSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
    marginBottom: spacing[4],
  },
  
  // Summary Card
  summaryCard: {
    marginHorizontal: spacing[6],
    backgroundColor: colors.white || '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryContent: {
    paddingVertical: spacing[5],
  },
  summaryTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[4],
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
    color: colors.purple,
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
    marginBottom: spacing[4],
  },
  warningIcon: {
    fontSize: 20,
    marginRight: spacing[3],
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
    marginBottom: spacing[4],
  },
  errorIcon: {
    fontSize: 20,
    marginRight: spacing[3],
  },
  errorText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.errorForeground,
  },
  
  // Icons
  iconText: {
    fontSize: 20,
    color: colors.foreground,
  },
  iconEmoji: {
    fontSize: 48,
    opacity: 0.5,
  },
});

export default ExamFeesScreen;
