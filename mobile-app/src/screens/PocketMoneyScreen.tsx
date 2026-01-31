import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, CardContent, Button } from '../components/ui';
import { EmptyState } from '../components/shared';
import { ParentsApi, StudentSummary } from '../api/parents';

type Props = NativeStackScreenProps<any>;

export const PocketMoneyScreen: React.FC<Props> = ({ navigation, route }) => {
  const studentId = route.params?.studentId;

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    studentId ? String(studentId) : null
  );
  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [parentId, setParentId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // For demo - hardcoded parent ID
  const demoParentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315';

  // Load parent students
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
          setStudent(null);
          setLoading(false);
          return;
        }

        const foundStudent = parentResponse.students.find((s) => String(s.id) === String(initialId));
        setStudent(foundStudent || null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update student when selectedStudentId changes
  useEffect(() => {
    if (!selectedStudentId) {
      setStudent(null);
      return;
    }

    const foundStudent = students.find((s) => String(s.id) === String(selectedStudentId));
    setStudent(foundStudent || null);
    setError(null);
  }, [selectedStudentId, students]);

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
      const paymentDescription = description.trim() || `Pocket money for ${student.first_name} ${student.last_name}`;

      // Simulate API call - replace with actual API when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`Pocket money payment of N${parsedAmount.toLocaleString()} initiated for ${student.first_name} ${student.last_name}`);

      navigation.goBack();
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
              <Text style={styles.title}>Pocket Money</Text>
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
              {student ? `Send pocket money to ${student.first_name} ${student.last_name}` : 'Select a student'}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Card style={styles.formCard}>
            <CardContent style={styles.formContent}>
              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>N</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={handleAmountChange}
                    placeholder="0.00"
                    placeholderTextColor={colors.gray400}
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
                  placeholderTextColor={colors.gray400}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              {/* Amount Preview */}
              {parsedAmount > 0 && (
                <View style={styles.amountPreview}>
                  <View style={styles.previewLeft}>
                    <Ionicons name="cash-outline" size={18} color={colors.primary} />
                    <Text style={styles.previewLabel}>Amount to send</Text>
                  </View>
                  <Text style={styles.previewAmount}>N{parsedAmount.toLocaleString()}</Text>
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
                style={styles.submitButton}
                icon={<Ionicons name="send-outline" size={18} color={colors.white} />}
              >
                {isSubmitting ? 'Processing...' : parsedAmount > 0 ? `Send N${parsedAmount.toLocaleString()}` : 'Send'}
              </Button>
            </CardContent>
          </Card>
        </View>

        {/* Info Card */}
        <Card variant="accent" style={styles.infoCard}>
          <CardContent style={styles.infoContent}>
            <View style={styles.infoTitleRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.infoTitle}>How it works</Text>
            </View>
            <Text style={styles.infoText}>
              {'\u2022'} Enter the amount you want to send as pocket money{'\n'}
              {'\u2022'} Add an optional description for the transaction{'\n'}
              {'\u2022'} Your child will receive the money instantly{'\n'}
              {'\u2022'} All transactions are secure and tracked
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

  // Form
  formSection: {
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  formCard: {
    ...shadows.md,
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
    borderWidth: 1.5,
    borderColor: colors.gray200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
  },
  currencySymbol: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.primary,
    paddingLeft: spacing[4],
    paddingRight: spacing[2],
  },
  amountInput: {
    flex: 1,
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    paddingVertical: spacing[4],
    paddingRight: spacing[4],
    color: colors.foreground,
  },
  descriptionInput: {
    borderWidth: 1.5,
    borderColor: colors.gray200,
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
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
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
    marginHorizontal: spacing[5],
  },
  infoContent: {
    padding: spacing[5],
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  infoTitle: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.accent,
  },
  infoText: {
    fontSize: typography.sm,
    color: colors.accentDark,
    lineHeight: typography.sm * 1.8,
  },

  // Banners
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

export default PocketMoneyScreen;
