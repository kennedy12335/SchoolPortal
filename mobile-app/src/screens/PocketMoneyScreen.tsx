import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Card, CardHeader, CardTitle, CardContent, Button, Separator } from '../components/ui';
import { EmptyState } from '../components/shared';
import { ParentsApi, StudentSummary } from '../api/parents';

type Props = NativeStackScreenProps<any>;

// Icons
const ArrowLeftIcon = () => <Text style={styles.iconText}>←</Text>;
const CreditCardIcon = () => <Text style={styles.iconText}>💳</Text>;
const MoneyIcon = () => <Text style={styles.iconEmoji}>💰</Text>;

export const PocketMoneyScreen: React.FC<Props> = ({ navigation, route }) => {
  const studentId = route.params?.studentId;

  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [parentId, setParentId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For demo - hardcoded parent ID
  const demoParentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315';

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!studentId) {
        setError('No student selected');
        return;
      }

      try {
        const parentResponse = await ParentsApi.getParentStudents(demoParentId);

        setParentId(parentResponse.parent.id);
        const foundStudent = parentResponse.students.find(
          (s) => String(s.id) === String(studentId)
        );
        setStudent(foundStudent || null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      }
    };

    loadData();
  }, [studentId]);

  const handleAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setAmount(cleanedText);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = parsedAmount > 0 && !isSubmitting && student;

  const handlePayment = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // For now, simulate payment initialization
      // In a real implementation, this would call a pocket money API
      const paymentDescription = description.trim() || `Pocket money for ${student.first_name} ${student.last_name}`;

      // Simulate API call - replace with actual API when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, show success message
      // In real implementation, this would redirect to payment gateway
      alert(`Pocket money payment of ₦${parsedAmount.toLocaleString()} initiated for ${student.first_name} ${student.last_name}`);

      // Navigate back to dashboard
      navigation.goBack();
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
            <Text style={styles.title}>Pocket Money</Text>
            <Text style={styles.subtitle}>
              Send pocket money to {student.first_name} {student.last_name}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>Payment Details</Text>

          <Card style={styles.formCard}>
            <CardContent style={styles.formContent}>
              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₦)</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₦</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., Weekly allowance, Lunch money, etc."
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              {/* Amount Preview */}
              {parsedAmount > 0 && (
                <View style={styles.amountPreview}>
                  <Text style={styles.previewLabel}>Amount to send:</Text>
                  <Text style={styles.previewAmount}>₦{parsedAmount.toLocaleString()}</Text>
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
                style={styles.submitButton}
              >
                {isSubmitting ? 'Processing...' : `Send ₦${parsedAmount.toLocaleString()}`}
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <CardContent style={styles.infoContent}>
            <Text style={styles.infoTitle}>💡 How it works</Text>
            <Text style={styles.infoText}>
              • Enter the amount you want to send as pocket money{'\n'}
              • Add an optional description for the transaction{'\n'}
              • Your child will receive the money instantly{'\n'}
              • All transactions are secure and tracked
            </Text>
          </CardContent>
        </Card>
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

  // Form
  formSection: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
    marginBottom: spacing[4],
  },
  formCard: {
    backgroundColor: colors.white || '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  formContent: {
    paddingVertical: spacing[5],
  },
  inputGroup: {
    marginBottom: spacing[5],
  },
  inputLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
  },
  currencySymbol: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.foreground,
    paddingLeft: spacing[4],
    paddingRight: spacing[2],
  },
  amountInput: {
    flex: 1,
    fontSize: typography.lg,
    paddingVertical: spacing[4],
    paddingRight: spacing[4],
    color: colors.foreground,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    fontSize: typography.base,
    color: colors.foreground,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  amountPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  previewLabel: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },
  previewAmount: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
  },

  // Submit Button
  submitButton: {
    marginTop: spacing[2],
  },

  // Info Card
  infoCard: {
    marginHorizontal: spacing[6],
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  infoContent: {
    padding: spacing[5],
  },
  infoTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.success,
    marginBottom: spacing[3],
  },
  infoText: {
    fontSize: typography.sm,
    color: colors.successForeground,
    lineHeight: typography.sm * 1.6,
  },

  // Banners
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

export default PocketMoneyScreen;