import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, CardContent, Avatar, getInitials, Badge, Checkbox } from '../ui';
import { StudentSummary } from '../../api/parents';

// Icons
const GraduationCapIcon = () => <Text style={styles.iconEmoji}>🎓</Text>;
const CheckCircleIcon = () => <Text style={[styles.iconEmoji, { color: colors.success }]}>✅</Text>;

interface StudentSelectorProps {
  students: StudentSummary[];
  selectedStudentIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudentIds,
  onSelectionChange,
}) => {
  const handleToggle = (studentId: string, isDisabled: boolean) => {
    if (isDisabled) return;

    if (selectedStudentIds.includes(studentId)) {
      onSelectionChange(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      onSelectionChange([...selectedStudentIds, studentId]);
    }
  };

  const eligibleStudents = students.filter((s) => !s.school_fees_paid);

  const handleToggleAll = () => {
    if (selectedStudentIds.length === eligibleStudents.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(eligibleStudents.map((s) => String(s.id)));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.studentsList}>
        {students.map((student) => {
          const isSelected = selectedStudentIds.includes(String(student.id));
          const isPaid = student.school_fees_paid;

          return (
            <TouchableOpacity
              key={student.id}
              onPress={() => handleToggle(String(student.id), isPaid)}
              disabled={isPaid}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.studentCard,
                  isPaid && styles.studentCardDisabled,
                  isSelected && styles.studentCardSelected,
                ]}
              >
                <CardContent style={styles.studentContent}>
                  <View style={styles.studentRow}>
                    <View style={styles.checkboxContainer}>
                      {isPaid ? (
                        <View style={styles.paidIcon}>
                          <CheckCircleIcon />
                        </View>
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          onPress={() => handleToggle(String(student.id), isPaid)}
                        />
                      )}
                    </View>

                    <Avatar
                      size="default"
                      fallback={getInitials(student.first_name, student.last_name)}
                    />

                    <View style={styles.studentInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {student.first_name} {student.last_name}
                        </Text>
                        {isPaid && (
                          <Badge variant="success" size="sm">
                            Paid
                          </Badge>
                        )}
                      </View>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <GraduationCapIcon />
                          <Text style={styles.metaText}>{student.year_group}</Text>
                        </View>
                        <Text style={styles.metaText}>ID: {student.reg_number}</Text>
                      </View>
                    </View>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedStudentIds.length > 0 && (
        <Text style={styles.selectionCount}>
          {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[2],
  },
  studentsList: {
    marginTop: spacing[3],
  },
  studentCard: {
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  studentCardDisabled: {
    opacity: 0.6,
  },
  studentCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  studentContent: {
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: spacing[3],
  },
  paidIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInfo: {
    flex: 1,
    marginLeft: spacing[3],
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  studentName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
    flexShrink: 1,
    marginRight: spacing[2],
    marginTop: spacing[1],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  metaText: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
    marginLeft: spacing[1],
  },
  selectionCount: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  iconEmoji: {
    fontSize: 14,
  },
});

export default StudentSelector;
