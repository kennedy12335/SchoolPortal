import * as Linking from 'expo-linking';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PaymentsApi } from './src/api/payments';
import { ExamsApi } from './src/api/exams';
import { ExamPaymentReceipt, SchoolPaymentReceipt } from '@schoolpayment/shared';
import { colors, typography, spacing, borderRadius } from './src/theme';
import { Card, CardHeader, CardTitle, CardContent, Button, Separator } from './src/components/ui';
import { LoadingSpinner } from './src/components/shared';

// Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SchoolFeesScreen } from './src/screens/SchoolFeesScreen';
import { ExamFeesScreen } from './src/screens/ExamFeesScreen';
import { PocketMoneyScreen } from './src/screens/PocketMoneyScreen';

// Custom theme matching web design
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.gray50,
    card: colors.background,
    text: colors.foreground,
    primary: colors.primary,
    border: colors.border,
  },
};

type RootStackParamList = {
  Home: undefined;
  SchoolFees: { selectedStudentId?: string } | undefined;
  ExamFees: { studentId: string };
  PocketMoney: { studentId: string };
  PaymentSuccess: { reference?: string } | undefined;
  ExamSuccess: { reference?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [Linking.createURL('/'), 'schoolpayment://'],
  config: {
    screens: {
      Home: '',
      SchoolFees: 'school-fees',
      ExamFees: 'exam-fees/:studentId',
      PocketMoney: 'pocket-money/:studentId',
      PaymentSuccess: 'success',
      ExamSuccess: 'exam-success',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking} theme={AppTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.foreground,
            headerTitleStyle: {
              fontWeight: typography.semibold,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: colors.gray50,
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={DashboardScreen}
            options={{ title: 'SchoolPayment', headerShown: false }}
          />
          <Stack.Screen
            name="SchoolFees"
            component={SchoolFeesScreen}
            options={{ title: 'School Fees', headerShown: false }}
          />
          <Stack.Screen
            name="ExamFees"
            component={ExamFeesScreen}
            options={{ title: 'Exam Fees', headerShown: false }}
          />
          <Stack.Screen
            name="PocketMoney"
            component={PocketMoneyScreen}
            options={{ title: 'Pocket Money', headerShown: false }}
          />
          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccessScreen}
            options={{ title: 'Payment Success', headerShown: false }}
          />
          <Stack.Screen
            name="ExamSuccess"
            component={ExamSuccessScreen}
            options={{ title: 'Exam Payment', headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

type SuccessProps = {
  route: { params?: { reference?: string } };
  navigation: any;
};

// Icons
const CheckCircleIcon = () => <Text style={styles.successIcon}>✅</Text>;
const ErrorIcon = () => <Text style={styles.errorIconEmoji}>❌</Text>;
const HomeIcon = () => <Text style={styles.iconEmoji}>🏠</Text>;

function PaymentSuccessScreen({ route, navigation }: SuccessProps) {
  const reference = route.params?.reference;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SchoolPaymentReceipt | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!reference) {
        setError('Missing payment reference');
        setLoading(false);
        return;
      }
      try {
        const verify = await PaymentsApi.verify(reference);
        if (verify.status !== 'completed') {
          setError(`Payment is ${verify.status}`);
          setLoading(false);
          return;
        }
        const rec = await PaymentsApi.getReceipt(reference);
        setReceipt(rec);
      } catch (e: any) {
        setError(e?.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reference]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <LoadingSpinner size="lg" />
          <Text style={styles.verifyingText}>Verifying your payment...</Text>
          <Text style={styles.verifyingSubtext}>This may take a few moments</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.errorIconContainer}>
            <ErrorIcon />
          </View>
          <Text style={styles.errorTitle}>Payment Verification Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button onPress={() => navigation.navigate('Home')} icon={<HomeIcon />}>
            Return to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <Card>
          <CardContent style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <CheckCircleIcon />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successMessage}>
              Your payment has been processed and confirmed. A receipt has been sent to your email.
            </Text>
          </CardContent>
        </Card>

        {/* Receipt */}
        {receipt && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Receipt</CardTitle>
            </CardHeader>
            <CardContent style={styles.receiptContent}>
              {/* Reference */}
              <View style={styles.referenceBox}>
                <Text style={styles.referenceLabel}>Reference Number</Text>
                <Text style={styles.referenceValue}>{receipt.reference}</Text>
              </View>

              {/* Student Breakdowns */}
              {receipt.students.map((s, index) => (
                <View key={s.student_id} style={styles.studentSection}>
                  <Text style={styles.studentName}>{s.name}</Text>

                  <View style={styles.feesList}>
                    {s.fees.map((f) => (
                      <View key={f.code} style={styles.feeRow}>
                        <Text style={styles.feeLabel}>{f.name}</Text>
                        <Text style={styles.feeAmount}>₦{f.amount.toLocaleString()}</Text>
                      </View>
                    ))}

                    {s.clubs.length > 0 && (
                      <>
                        <Separator />
                        <Text style={styles.clubsLabel}>Club Fees:</Text>
                        {s.clubs.map((c) => (
                          <View key={c.id} style={styles.feeRow}>
                            <Text style={[styles.feeLabel, styles.clubFee]}>{c.name}</Text>
                            <Text style={[styles.feeAmount, styles.clubFee]}>
                              ₦{c.price.toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}

                    <Separator />
                    <View style={styles.feeRow}>
                      <Text style={styles.studentTotalLabel}>Student Total</Text>
                      <Text style={styles.studentTotalValue}>₦{s.total.toLocaleString()}</Text>
                    </View>
                  </View>

                  {index < receipt.students.length - 1 && <Separator style={styles.studentSeparator} />}
                </View>
              ))}

              {/* Grand Total */}
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Total Amount Paid</Text>
                <Text style={styles.grandTotalValue}>₦{receipt.amount.toLocaleString()}</Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Return Button */}
        <Button fullWidth size="lg" onPress={() => navigation.navigate('Home')} icon={<HomeIcon />}>
          Return to Dashboard
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExamSuccessScreen({ route, navigation }: SuccessProps) {
  const reference = route.params?.reference;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ExamPaymentReceipt | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!reference) {
        setError('Missing payment reference');
        setLoading(false);
        return;
      }
      try {
        const verify = await ExamsApi.verify(reference);
        if (verify.status !== 'completed') {
          setError(`Payment is ${verify.status}`);
          setLoading(false);
          return;
        }
        const rec = await ExamsApi.getReceipt(reference);
        setReceipt(rec);
      } catch (e: any) {
        setError(e?.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reference]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <LoadingSpinner size="lg" />
          <Text style={styles.verifyingText}>Verifying your payment...</Text>
          <Text style={styles.verifyingSubtext}>This may take a few moments</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.errorIconContainer}>
            <ErrorIcon />
          </View>
          <Text style={styles.errorTitle}>Payment Verification Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button onPress={() => navigation.navigate('Home')} icon={<HomeIcon />}>
            Return to Dashboard
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <Card>
          <CardContent style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <CheckCircleIcon />
            </View>
            <Text style={styles.successTitle}>Exam Payment Successful!</Text>
            <Text style={styles.successMessage}>
              Your exam fee payment has been processed and confirmed.
            </Text>
          </CardContent>
        </Card>

        {/* Receipt */}
        {receipt && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Receipt</CardTitle>
            </CardHeader>
            <CardContent style={styles.receiptContent}>
              {/* Reference */}
              <View style={styles.referenceBox}>
                <Text style={styles.referenceLabel}>Reference Number</Text>
                <Text style={styles.referenceValue}>{receipt.reference}</Text>
              </View>

              {/* Student Info */}
              <View style={styles.studentSection}>
                <Text style={styles.studentName}>{receipt.student.name}</Text>

                <View style={styles.feesList}>
                  {receipt.examBreakdown.map((e) => (
                    <View key={e.exam_id} style={styles.feeRow}>
                      <Text style={styles.feeLabel}>{e.exam_name}</Text>
                      <Text style={styles.feeAmount}>₦{e.amount_paid.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Total */}
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Total Amount Paid</Text>
                <Text style={styles.grandTotalValue}>₦{receipt.amount.toLocaleString()}</Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Return Button */}
        <Button fullWidth size="lg" onPress={() => navigation.navigate('Home')} icon={<HomeIcon />}>
          Return to Dashboard
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  scrollContent: {
    padding: spacing[6],
    gap: spacing[6],
  },

  // Verifying state
  verifyingText: {
    fontSize: typography.lg,
    fontWeight: typography.medium,
    color: colors.foreground,
    marginTop: spacing[4],
  },
  verifyingSubtext: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },

  // Error state
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  errorIconEmoji: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  errorMessage: {
    fontSize: typography.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: spacing[6],
  },

  // Success state
  successCard: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.successForeground,
    marginBottom: spacing[2],
  },
  successMessage: {
    fontSize: typography.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    maxWidth: 300,
  },

  // Receipt
  receiptContent: {
    gap: spacing[6],
  },
  referenceBox: {
    padding: spacing[3],
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
  },
  referenceLabel: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginBottom: spacing[0.5],
  },
  referenceValue: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.foreground,
    fontFamily: 'Courier',
  },
  studentSection: {
    gap: spacing[3],
  },
  studentName: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  feesList: {
    gap: spacing[2],
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  feeAmount: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  clubsLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.primary,
    marginTop: spacing[1],
  },
  clubFee: {
    color: colors.indigo,
  },
  studentTotalLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  studentTotalValue: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.primary,
  },
  studentSeparator: {
    marginTop: spacing[4],
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[4],
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.foreground,
  },
  grandTotalValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
  },

  iconEmoji: {
    fontSize: 16,
  },
});
