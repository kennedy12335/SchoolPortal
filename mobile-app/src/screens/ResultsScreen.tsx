import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Card, CardContent } from '../components/ui';
import { LoadingSpinner } from '../components/shared';
import { ParentsApi, StudentSummary } from '../api/parents';

type Props = {
  navigation: any;
};

// Stack for Results
type ResultsStackParamList = {
  ResultsHome: undefined;
};
const ResultsStack = createNativeStackNavigator<ResultsStackParamList>();

export function ResultsStackScreen() {
  return (
    <ResultsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: typography.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <ResultsStack.Screen
        name="ResultsHome"
        component={ResultsScreen}
        options={{ headerShown: false }}
      />
    </ResultsStack.Navigator>
  );
}

export const ResultsScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const parentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315'; // TODO: Get from authentication

  const loadData = async () => {
    try {
      const response = await ParentsApi.getParentStudents(parentId);
      setStudents(response.students);
      if (response.students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(String(response.students[0].id));
      }
    } catch (e: any) {
      // Silently fail - students list is just for context
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

  const selectedStudent = students.find(s => String(s.id) === selectedStudentId);

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
          <View style={styles.headerIconRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.title}>Results</Text>
          </View>
          <Text style={styles.subtitle}>View your children's academic results</Text>
        </View>

        {/* Student Selector */}
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

        {/* Selected student info */}
        {selectedStudent && (
          <View style={styles.studentInfoBar}>
            <View style={styles.studentAvatar}>
              <Text style={styles.avatarText}>
                {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.studentName}>
                {selectedStudent.first_name} {selectedStudent.last_name}
              </Text>
              <Text style={styles.studentClass}>{selectedStudent.class_name}</Text>
            </View>
          </View>
        )}

        {/* Empty State */}
        <View style={styles.emptyStateContainer}>
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={40} color={colors.gray300} />
              </View>
              <Text style={styles.emptyTitle}>No Results Yet</Text>
              <Text style={styles.emptyDescription}>
                Results will appear here when they become available. You'll be able to view term results, report cards, and academic progress for each of your children.
              </Text>
              <View style={styles.emptyHint}>
                <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                <Text style={styles.emptyHintText}>
                  Pull down to refresh when new results are published
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
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
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
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

  // Student info bar
  studentInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.base,
    fontWeight: typography.bold,
    color: colors.white,
  },
  studentName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  studentClass: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginTop: spacing[0.5],
  },

  // Empty state
  emptyStateContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  emptyCard: {},
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  emptyTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[3],
  },
  emptyDescription: {
    fontSize: typography.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: typography.base * 1.6,
    marginBottom: spacing[6],
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  emptyHintText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },
});

export default ResultsScreen;
