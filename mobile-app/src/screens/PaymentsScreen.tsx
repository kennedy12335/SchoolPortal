import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { LoadingSpinner } from '../components/shared';
import { Card, CardContent } from '../components/ui';
import { ParentsApi, ParentResponse, StudentSummary } from '../api/parents';
import { QuickActionTile } from '../components/payments/QuickActionTile';

type PaymentsStackParamList = {
  PaymentsHome: undefined;
  SchoolFees: { selectedStudentId?: string } | undefined;
  ExamFees: { studentId: string };
  PocketMoney: { studentId: string };
  PaymentSuccess: { reference?: string } | undefined;
  ExamSuccess: { reference?: string } | undefined;
};
const PaymentsStack = createNativeStackNavigator<PaymentsStackParamList>();

import { SchoolFeesScreen } from './SchoolFeesScreen';
import { ExamFeesScreen } from './ExamFeesScreen';
import { PocketMoneyScreen } from './PocketMoneyScreen';
import { PaymentSuccessScreen } from './PaymentSuccessScreen';
import { ExamSuccessScreen } from './ExamSuccessScreen';

export function PaymentsStackScreen() {
  return (
    <PaymentsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: typography.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <PaymentsStack.Screen
        name="PaymentsHome"
        component={PaymentsScreen}
        options={{ headerShown: false }}
      />
      <PaymentsStack.Screen
        name="SchoolFees"
        component={SchoolFeesScreen}
        options={{ title: 'School Fees', headerShown: false }}
      />
      <PaymentsStack.Screen
        name="ExamFees"
        component={ExamFeesScreen}
        options={{ title: 'Exam Fees', headerShown: false }}
      />
      <PaymentsStack.Screen
        name="PocketMoney"
        component={PocketMoneyScreen}
        options={{ title: 'Pocket Money', headerShown: false }}
      />
      <PaymentsStack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{ title: 'Payment Success', headerShown: false }}
      />
      <PaymentsStack.Screen
        name="ExamSuccess"
        component={ExamSuccessScreen}
        options={{ title: 'Exam Payment', headerShown: false }}
      />
    </PaymentsStack.Navigator>
  );
}

type Props = {
  navigation: any;
};

function PaymentsScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parent, setParent] = useState<ParentResponse | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const parentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315'; // TODO: Get from authentication

  const loadData = async () => {
    setError(null);
    try {
      const response = await ParentsApi.getParentStudents(parentId);
      setParent(response.parent);
      setStudents(response.students);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.detail || e?.message || 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <LoadingSpinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Choose what payment you want to make below</Text>
        </View>

        {error && (
          <Card variant="error" style={styles.errorCard}>
            <CardContent>
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
          <QuickActionTile
            iconName="school-outline"
            label="School Fees"
            iconColor={colors.schoolFees}
            backgroundColor={colors.schoolFeesLight}
            onPress={() => navigation.navigate('SchoolFees')}
          />
          <QuickActionTile
            iconName="document-text-outline"
            label="Exam Fees"
            iconColor={colors.examFees}
            backgroundColor={colors.examFeesLight}
            onPress={() => {
              if (students.length === 1) {
                navigation.navigate('ExamFees', { studentId: String(students[0].id) });
              } else {
                navigation.navigate('ExamFees', { studentId: String(students[0]?.id) });
              }
            }}
          />
          <QuickActionTile
            iconName="wallet-outline"
            label="Pocket Money"
            iconColor={colors.pocketMoney}
            backgroundColor={colors.pocketMoneyLight}
            onPress={() => {
              if (students.length === 1) {
                navigation.navigate('PocketMoney', { studentId: String(students[0].id) });
              } else {
                navigation.navigate('PocketMoney', { studentId: String(students[0]?.id) });
              }
            }}
          />
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={18} color={colors.foreground} />
            <Text style={styles.sectionTitle}>Recent Payments</Text>
          </View>

          <Card style={styles.transactionsCard}>
            <CardContent>
              {/* Mock transaction items - replace with real data later */}
              <View style={styles.transactionItem}>
                <View style={[styles.transactionIconCircle, { backgroundColor: colors.schoolFeesLight }]}>
                  <Ionicons name="school-outline" size={18} color={colors.schoolFees} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>School Fees Payment</Text>
                  <Text style={styles.transactionSubtitle}>January 2026</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>-N50,000</Text>
                </View>
              </View>

              <View style={styles.transactionDivider} />

              <View style={styles.transactionItem}>
                <View style={[styles.transactionIconCircle, { backgroundColor: colors.pocketMoneyLight }]}>
                  <Ionicons name="wallet-outline" size={18} color={colors.pocketMoney} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>Pocket Money</Text>
                  <Text style={styles.transactionSubtitle}>Dec 28, 2025</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>-N5,000</Text>
                </View>
              </View>

              <View style={styles.transactionDivider} />

              <View style={styles.transactionItem}>
                <View style={[styles.transactionIconCircle, { backgroundColor: colors.examFeesLight }]}>
                  <Ionicons name="document-text-outline" size={18} color={colors.examFees} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>Exam Fees</Text>
                  <Text style={styles.transactionSubtitle}>Dec 15, 2025</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>-N15,000</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },

  // Header
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    letterSpacing: typography.tight_ls,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.mutedForeground,
    lineHeight: typography.base * 1.5,
  },

  // Error
  errorCard: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  errorText: {
    fontSize: typography.sm,
    color: colors.errorForeground,
    flex: 1,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    gap: spacing[3],
  },

  // Section
  section: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.foreground,
  },

  // Transactions
  transactionsCard: {},
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  transactionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.foreground,
    marginBottom: spacing[0.5],
  },
  transactionSubtitle: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[0.5],
  },
  transactionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[1],
  },
});

export default PaymentsScreen;
