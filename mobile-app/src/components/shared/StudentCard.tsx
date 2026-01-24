import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';
import { Avatar, getInitials } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { StudentSummary } from '../../api/parents';

// Simple icons as text since we don't have vector icons installed
const GraduationCapIcon = () => <Text style={styles.iconText}>🎓</Text>;
const CreditCardIcon = () => <Text style={styles.iconText}>💳</Text>;
const BookOpenIcon = () => <Text style={styles.iconText}>📚</Text>;

interface StudentCardProps {
  student: StudentSummary;
  onPaySchoolFees?: (studentId: string) => void;
  onPayExamFees?: (studentId: string) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onPaySchoolFees,
  onPayExamFees,
}) => {
  return (
    <Card style={styles.card}>
      <CardHeader style={styles.header}>
        <View style={styles.headerContent}>
          <Avatar
            size="lg"
            fallback={getInitials(student.first_name, student.last_name)}
          />
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {student.first_name} {student.last_name}
              </Text>
              <Badge variant={student.school_fees_paid ? 'success' : 'warning'}>
                {student.school_fees_paid ? 'Fees Paid' : 'Fees Due'}
              </Badge>
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
      </CardHeader>

      <CardFooter style={styles.footer}>
        {!student.school_fees_paid && onPaySchoolFees && (
          <Button
            onPress={() => onPaySchoolFees(String(student.id))}
            style={styles.actionButton}
            size="lg"
            icon={<CreditCardIcon />}
          >
            Pay School Fees
          </Button>
        )}
        {onPayExamFees && (
          <Button
            variant={student.school_fees_paid ? 'default' : 'outline'}
            onPress={() => onPayExamFees(String(student.id))}
            style={styles.actionButton}
            size="lg"
            icon={<BookOpenIcon />}
          >
            Pay Exam Fees
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    ...shadows.sm,
  },
  header: {
    paddingBottom: spacing[3],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  name: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.foreground,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[1],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
  },
  footer: {
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  actionButton: {
    width: '100%',
  },
  iconText: {
    fontSize: 14,
  },
});

export default StudentCard;
