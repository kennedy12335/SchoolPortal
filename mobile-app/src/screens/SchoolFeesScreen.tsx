import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Card, CardContent, Button } from '../components/ui';
import { EmptyState } from '../components/shared';
import { StudentSelector, FeeBreakdown } from '../components/school-fees';
import { ParentsApi, StudentSummary } from '../api/parents';
import { FeesApi, FeeCalculationResponse } from '../api/fees';
import { PaymentsApi } from '../api/payments';

type Props = NativeStackScreenProps<any>;

// Icons
const ArrowLeftIcon = () => <Text style={styles.iconText}>←</Text>;
const CreditCardIcon = () => <Text style={styles.iconText}>💳</Text>;
const UsersIcon = () => <Text style={styles.iconEmoji}>👥</Text>;

export const SchoolFeesScreen: React.FC<Props> = ({ navigation, route }) => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [parentId, setParentId] = useState<string>('');

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentFees, setStudentFees] = useState<FeeCalculationResponse['student_fees']>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (eligibleStudents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeftIcon />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon={<UsersIcon />}
          title="No pending school fees"
          description="All your children's school fees have been paid."
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
            <Text style={styles.title}>School Fees Payment</Text>
            <Text style={styles.subtitle}>
              Select students to pay school fees for
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
            <Text style={styles.errorIcon}>⚠️</Text>
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
              onPress={handlePayment}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
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
  
  // Section
  sectionLabel: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
    marginBottom: spacing[4],
  },
  
  // Cards
  selectionCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  cardPadding: {
    paddingVertical: spacing[5],
  },
  calculatingCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  loadingText: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
  
  // Error
  errorBanner: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
  
  // Payment Section
  paymentSection: {
    marginHorizontal: spacing[6],
    marginTop: spacing[2],
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

export default SchoolFeesScreen;
