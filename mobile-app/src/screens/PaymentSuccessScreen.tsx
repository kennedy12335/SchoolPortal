import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PaymentsApi } from '../api/payments';
import { SchoolPaymentReceipt } from '@schoolpayment/shared';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, CardHeader, CardTitle, CardContent, Button, Separator } from '../components/ui';
import { LoadingSpinner } from '../components/shared';

type SuccessProps = {
  route: { params?: { reference?: string } };
  navigation: any;
};

export function PaymentSuccessScreen({ route, navigation }: SuccessProps) {
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
            <Ionicons name="close-circle" size={40} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>Payment Verification Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            onPress={() => navigation.navigate('PaymentsHome')}
            icon={<Ionicons name="home-outline" size={16} color={colors.white} />}
          >
            Return to Payments
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <Card style={styles.successCardWrapper}>
          <CardContent style={styles.successCard}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
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
                        <Text style={styles.feeAmount}>N{f.amount.toLocaleString()}</Text>
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
                              N{c.price.toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </>
                    )}

                    <Separator />
                    <View style={styles.feeRow}>
                      <Text style={styles.studentTotalLabel}>Student Total</Text>
                      <Text style={styles.studentTotalValue}>N{s.total.toLocaleString()}</Text>
                    </View>
                  </View>

                  {index < receipt.students.length - 1 && <Separator style={styles.studentSeparator} />}
                </View>
              ))}

              {/* Grand Total */}
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Total Amount Paid</Text>
                <Text style={styles.grandTotalValue}>N{receipt.amount.toLocaleString()}</Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Return Button */}
        <Button
          fullWidth
          size="lg"
          onPress={() => navigation.navigate('PaymentsHome')}
          icon={<Ionicons name="home-outline" size={18} color={colors.white} />}
        >
          Return to Payments
        </Button>
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
    paddingHorizontal: spacing[6],
  },
  scrollContent: {
    padding: spacing[5],
    gap: spacing[5],
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
    borderRadius: 40,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
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
  successCardWrapper: {
    ...shadows.colored,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
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
    lineHeight: typography.base * 1.5,
  },

  // Receipt
  receiptContent: {
    gap: spacing[5],
  },
  referenceBox: {
    padding: spacing[4],
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
  },
  referenceLabel: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    fontWeight: typography.medium,
    letterSpacing: 0.5,
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
    color: colors.examFees,
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
});
