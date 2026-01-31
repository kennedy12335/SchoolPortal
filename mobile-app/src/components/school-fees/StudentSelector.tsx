import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Card, CardContent, Avatar, getInitials, Badge, Checkbox } from '../ui';
import { StudentSummary } from '../../api/parents';

interface StudentSelectorProps {
  students: StudentSummary[];
  selectedStudentIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  mode?: 'list' | 'dropdown';
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudentIds,
  onSelectionChange,
  mode = 'list',
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleToggle = (studentId: string, isDisabled: boolean) => {
    if (isDisabled) return;

    if (selectedStudentIds.includes(studentId)) {
      onSelectionChange(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      onSelectionChange([...selectedStudentIds, studentId]);
    }
  };

  const eligibleStudents = students.filter((s) => !s.school_fees_paid);

  // For dropdown mode we treat selection as single-select using the first id in the array
  const selectedId = selectedStudentIds.length > 0 ? selectedStudentIds[0] : null;

  const handleSelectFromDropdown = (id: string) => {
    // toggle selection: select the new id, or clear if the same
    if (selectedId === id) {
      onSelectionChange([]);
    } else {
      onSelectionChange([id]);
    }
    setModalVisible(false);
  };

  if (mode === 'dropdown') {
    const selectedStudent = students.find((s) => String(s.id) === String(selectedId));

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.selectorRow}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          {selectedStudent ? (
            <>
              <Avatar
                size="sm"
                fallback={getInitials(selectedStudent.first_name, selectedStudent.last_name)}
              />
              <View style={styles.selectorLabelContainer}>
                <Text style={styles.selectorLabel} numberOfLines={1}>
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </Text>
                <Text style={styles.selectorSubLabel}>{selectedStudent.year_group} · ID: {selectedStudent.reg_number}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.selectorPlaceholder}>Select a child</Text>
          )}

          <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select child</Text>
              <View style={styles.modalList}>
                {students.map((student) => {
                  const isPaid = student.school_fees_paid;
                  const isSelected = String(student.id) === String(selectedId);

                  return (
                    <TouchableOpacity
                      key={student.id}
                      style={[styles.modalItem, isPaid && styles.modalItemDisabled]}
                      onPress={() => handleSelectFromDropdown(String(student.id))}
                      disabled={isPaid}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modalItemLeft}>
                        <Avatar
                          size="sm"
                          fallback={getInitials(student.first_name, student.last_name)}
                        />
                        <View style={{ marginLeft: spacing[3], minWidth: 0 }}>
                          <Text style={styles.modalItemText} numberOfLines={1}>
                            {student.first_name} {student.last_name}
                          </Text>
                          <Text style={styles.modalItemSubText}>{student.year_group} · ID: {student.reg_number}</Text>
                        </View>
                      </View>

                      {isPaid ? (
                        <View style={styles.paidIconSmall}>
                          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                        </View>
                      ) : isSelected ? (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

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
                style={{
                  ...styles.studentCard,
                  ...(isPaid ? styles.studentCardDisabled : {}),
                  ...(isSelected ? styles.studentCardSelected : {}),
                }}
              >
                <CardContent style={styles.studentContent}>
                  <View style={styles.studentRow}>
                    <View style={styles.checkboxContainer}>
                      {isPaid ? (
                        <View style={styles.paidIcon}>
                          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
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
                          <Ionicons name="school-outline" size={12} color={colors.mutedForeground} />
                          <Text style={styles.metaText}>{student.year_group}</Text>
                        </View>
                        <Text style={styles.metaDot}>·</Text>
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
        <View style={styles.selectionCountContainer}>
          <Ionicons name="people-outline" size={14} color={colors.primary} />
          <Text style={styles.selectionCount}>
            {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} selected
          </Text>
        </View>
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
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing[3],
  },
  studentCardDisabled: {
    opacity: 0.6,
  },
  studentCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  studentContent: {
    paddingTop: spacing[4],
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
    marginBottom: spacing[1],
  },
  studentName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
    flexShrink: 1,
    marginRight: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaDot: {
    fontSize: typography.xs,
    color: colors.gray400,
    marginHorizontal: spacing[1.5],
  },
  metaText: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
  },
  selectionCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
    marginTop: spacing[2],
  },
  selectionCount: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium,
  },

  /* Dropdown styles */
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selectorLabelContainer: {
    flex: 1,
    marginLeft: spacing[3],
  },
  selectorLabel: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  selectorSubLabel: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
  },
  selectorPlaceholder: {
    fontSize: typography.base,
    color: colors.mutedForeground,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing[5],
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.foreground,
    marginBottom: spacing[4],
  },
  modalList: {
    paddingBottom: spacing[4],
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemDisabled: {
    opacity: 0.6,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
  },
  modalItemText: {
    fontSize: typography.base,
    color: colors.foreground,
  },
  modalItemSubText: {
    fontSize: typography.xs,
    color: colors.mutedForeground,
  },
  paidIconSmall: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    marginTop: spacing[4],
    alignItems: 'flex-end',
  },
  modalCloseButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  modalCloseText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.semibold,
  },
});

export default StudentSelector;
