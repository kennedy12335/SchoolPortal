import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, CardContent, Button } from '../components/ui';
import { EmptyState } from '../components/shared';
import { StudentSelector, FeeBreakdown } from '../components/school-fees';
import { ParentsApi, StudentSummary } from '../api/parents';
import { FeesApi, FeeCalculationResponse } from '../api/fees';
import { PaymentsApi } from '../api/payments';

type Props = NativeStackScreenProps<any>;

export const SchoolFeesScreen: React.FC<Props> = ({ navigation, route }) => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [parentId, setParentId] = useState<string>('');

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentFees, setStudentFees] = useState<FeeCalculationResponse['student_fees']>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get preselected student from navigation params
  const preselectedStudentId = route.params?.selectedStudentId;

  // For demo - hardcoded parent ID (should come from auth context)
  const demoParentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315';

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const parentResponse = await ParentsApi.getParentStudents(demoParentId);

        setParentId(parentResponse.parent.id);
        setStudents(parentResponse.students);

        // Initialize selection
        const unpaidStudents = parentResponse.students.filter((s) => !s.school_fees_paid);
        if (preselectedStudentId) {
          const student = parentResponse.students.find(
            (s) => String(s.id) === String(preselectedStudentId)
          );
          if (student && !student.school_fees_paid) {
            setSelectedStudentIds([String(preselectedStudentId)]);
          }
        } else {
          setSelectedStudentIds(unpaidStudents.map((s) => String(s.id)));
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [preselectedStudentId]);

  // Calculate fees when selection changes
  useEffect(() => {
    const calculateFees = async () => {
      if (selectedStudentIds.length === 0) {
        setStudentFees([]);
        setTotalAmount(0);
        return;
      }

      try {
        const response = await FeesApi.calculate(selectedStudentIds);
        setStudentFees(response.student_fees);
        setTotalAmount(response.total_amount);
      } catch (e: any) {
        setError(e?.message || 'Failed to calculate fees');
      }
    };

    const debounceTimer = setTimeout(calculateFees, 300);
    return () => clearTimeout(debounceTimer);
  }, [selectedStudentIds]);

  const handleStudentSelectionChange = (ids: string[]) => {
    setSelectedStudentIds(ids);
  };

  const canSubmit =
    selectedStudentIds.length > 0 && totalAmount > 0 && !isSubmitting;

  const handlePayment = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await PaymentsApi.initializeSchoolFees({
        student_ids: selectedStudentIds,
        amount: totalAmount,
        parent_id: parentId,
        payment_method: 'online',
        description: `Payment for ${selectedStudentIds.length} student(s)`,
        student_fee_ids: [],
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

  const eligibleStudents = students.filter((s) => !s.school_fees_paid);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingPlaceholder} />
      </SafeAreaView>
    );
  }

  if (eligibleStudents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <EmptyState
          iconName="people-outline"
          title="No pending school fees"
          description="All your children's school fees have been paid."
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
              <Text style={styles.title}>School Fees</Text>
            </View>
            <Text style={styles.subtitle}>
              Select students to pay school fees
            </Text>
          </View>
        </View>

        {/* Student Selection Card */}
        <Card style={styles.selectionCard}>
          <CardContent style={styles.cardPadding}>
            <StudentSelector
              students={students}
              selectedStudentIds={selectedStudentIds}
              onSelectionChange={handleStudentSelectionChange}
            />
          </CardContent>
        </Card>

        {/* Fee Breakdown */}
        {selectedStudentIds.length > 0 && (
          <FeeBreakdown studentFees={studentFees} totalAmount={totalAmount} />
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.errorForeground} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Payment Button */}
        {selectedStudentIds.length > 0 && totalAmount > 0 && (
          <View style={styles.paymentSection}>
            <Button
              fullWidth
              size="lg"
              disabled={!canSubmit}
              loading={isSubmitting}
              onPress={handlePayment}
              icon={<Ionicons name="card-outline" size={18} color={colors.white} />}
            >
              {isSubmitting ? 'Processing...' : `Pay N${totalAmount.toLocaleString()}`}
            </Button>
          </View>
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
    backgroundColor: colors.primaryLight,
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

  // Cards
  selectionCard: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  cardPadding: {
    paddingVertical: spacing[5],
  },

  // Error
  errorBanner: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  errorText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.errorForeground,
  },

  // Payment Section
  paymentSection: {
    marginHorizontal: spacing[5],
    marginTop: spacing[2],
  },
});

export default SchoolFeesScreen;
