import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Card, CardContent, Button } from '../components/ui';
import { ParentsApi, ParentResponse, StudentSummary } from '../api/parents';

type Props = NativeStackScreenProps<any>;

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parent, setParent] = useState<ParentResponse | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);

  // For demo purposes - you would get this from auth context
  const parentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315'; // TODO: Get from authentication

  const loadData = async () => {
    setError(null);

    try {
      const response = await ParentsApi.getParentStudents(parentId);
      setParent(response.parent);
      setStudents(response.students);
    } catch (e: any) {
      console.error('Error loading data:', e);
      const errorMessage = e?.response?.data?.detail || e?.message || 'Failed to load data';
      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const pendingPayments = students.filter((s) => !s.school_fees_paid).length;
  const totalStudents = students.length;
  const paidStudents = totalStudents - pendingPayments;

  const handlePaySchoolFees = (studentId?: string) => {
    navigation.navigate('SchoolFees', studentId ? { selectedStudentId: studentId } : {});
  };

  const handlePayExamFees = (studentId?: string) => {
    navigation.navigate('ExamFees', studentId ? { studentId } : {});
  };

  const handlePayPocketMoney = (studentId?: string) => {
    navigation.navigate('PocketMoney', studentId ? { studentId } : {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.parentName}>{parent?.first_name} {parent?.last_name}</Text>
            </View>
          </View>
        </View>

        {/* Statistics Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <Text style={styles.statIcon}>👥</Text>
            </View>
            <Text style={styles.statValue}>{totalStudents}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardSuccess]}>
            <View style={[styles.statIconWrapper, styles.statIconSuccess]}>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={styles.statValue}>{paidStudents}</Text>
            <Text style={styles.statLabel}>Fees Paid</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardWarning]}>
            <View style={[styles.statIconWrapper, styles.statIconWarning]}>
              <Text style={styles.statIcon}>⏳</Text>
            </View>
            <Text style={styles.statValue}>{pendingPayments}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Payment Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Options</Text>
          
          <View style={styles.paymentGrid}>
            <TouchableOpacity
              style={styles.paymentCard}
              onPress={() => handlePaySchoolFees()}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIconWrapper, styles.paymentIconPrimary]}>
                <Text style={styles.paymentEmoji}>🎓</Text>
              </View>
              <Text style={styles.paymentTitle}>School Fees</Text>
              <Text style={styles.paymentDescription}>
                Pay tuition fees for your children
              </Text>
              <View style={styles.paymentArrow}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentCard}
              onPress={() => handlePayExamFees()}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIconWrapper, styles.paymentIconIndigo]}>
                <Text style={styles.paymentEmoji}>📚</Text>
              </View>
              <Text style={styles.paymentTitle}>Exam Fees</Text>
              <Text style={styles.paymentDescription}>
                Pay for upcoming examinations
              </Text>
              <View style={styles.paymentArrow}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentCard}
              onPress={() => handlePayPocketMoney()}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIconWrapper, styles.paymentIconGreen]}>
                <Text style={styles.paymentEmoji}>💰</Text>
              </View>
              <Text style={styles.paymentTitle}>Pocket Money</Text>
              <Text style={styles.paymentDescription}>
                Send pocket money to your children
              </Text>
              <View style={styles.paymentArrow}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Students List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Children</Text>
          
          {students.length > 0 ? (
            <View style={styles.studentsList}>
              {students.map((student) => (
                <Card key={student.id} style={styles.studentCard}>
                  <CardContent style={styles.studentContent}>
                    <View style={styles.studentHeader}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {student.first_name[0]}{student.last_name[0]}
                        </Text>
                      </View>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {student.first_name} {student.last_name}
                        </Text>
                        <Text style={styles.studentClass}>
                          {student.class_name || 'Not Assigned'}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        student.school_fees_paid ? styles.statusBadgePaid : styles.statusBadgePending
                      ]}>
                        <Text style={[
                          styles.statusText,
                          student.school_fees_paid ? styles.statusTextPaid : styles.statusTextPending
                        ]}>
                          {student.school_fees_paid ? '✓ Paid' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.studentActions}>
                      {!student.school_fees_paid && (
                        <>
                          <Button
                            onPress={() => handlePaySchoolFees(String(student.id))}
                            size="sm"
                            variant="outline"
                            style={styles.studentButton}
                          >
                            Pay School Fees
                          </Button>
                          <Button
                            onPress={() => handlePayExamFees(String(student.id))}
                            size="sm"
                            variant="outline"
                            style={styles.studentButton}
                          >
                            Pay Exam Fees
                          </Button>
                        </>
                      )}
                      <Button
                        onPress={() => handlePayPocketMoney(String(student.id))}
                        size="sm"
                        variant="outline"
                        style={styles.studentButton}
                      >
                        Send Pocket Money
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          ) : (
            <Card>
              <CardContent style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No Students</Text>
                <Text style={styles.emptyDescription}>
                  No students found in your account
                </Text>
              </CardContent>
            </Card>
          )}
        </View>

        {/* Error Message */}
        {error && (
          <Card variant="error" style={styles.errorCard}>
            <CardContent>
              <View style={styles.errorRow}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </CardContent>
          </Card>
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
  scrollContent: {
    paddingBottom: spacing[8],
  },

  // Header
  headerGradient: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[16],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: typography.base,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing[1],
  },
  parentName: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.white || '#FFFFFF',
    letterSpacing: -0.5,
  },

  // Statistics
  statsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    marginTop: -spacing[12],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center',
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardSuccess: {
    backgroundColor: colors.successLight,
  },
  statCardWarning: {
    backgroundColor: colors.warningLight,
  },
  statIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statIconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statIconWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[0.5],
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },

  // Section
  section: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[4],
  },

  // Payment Grid
  paymentGrid: {
    gap: spacing[4],
  },
  paymentCard: {
    backgroundColor: colors.white || '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  paymentIconPrimary: {
    backgroundColor: colors.primaryLight,
  },
  paymentIconIndigo: {
    backgroundColor: colors.indigoLight,
  },
  paymentIconGreen: {
    backgroundColor: colors.successLight,
  },
  paymentEmoji: {
    fontSize: 28,
  },
  paymentTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  paymentDescription: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    lineHeight: typography.sm * 1.6,
    marginBottom: spacing[3],
  },
  paymentArrow: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: typography.bold,
  },

  // Students List
  studentsList: {
    gap: spacing[4],
  },
  studentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.gray900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  studentContent: {
    gap: spacing[4],
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.white || '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
    gap: spacing[0.5],
  },
  studentName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  studentClass: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full || 999,
  },
  statusBadgePaid: {
    backgroundColor: colors.successLight,
  },
  statusBadgePending: {
    backgroundColor: colors.warningLight,
  },
  statusText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
  },
  statusTextPaid: {
    color: colors.successForeground,
  },
  statusTextPending: {
    color: colors.warningForeground,
  },
  studentActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  studentButton: {
    flex: 1,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  emptyDescription: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },

  // Error
  errorCard: {
    marginHorizontal: spacing[6],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  errorIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.errorForeground,
    flex: 1,
  },
});

export default DashboardScreen;
