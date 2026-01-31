
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { Card, CardContent } from '../components/ui';
import { ParentsApi, ParentResponse, StudentSummary } from '../api/parents';

type HomeStackParamList = {
  HomeScreen: undefined;
};
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: typography.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <HomeStack.Screen
        name="HomeScreen"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

type Props = NativeStackScreenProps<any>;

// Mock notifications - replace with real API when available
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Term 2 fees are now due',
    message: 'School fees for the second term are now available for payment. Please make payment before the deadline.',
    date: '2 days ago',
    type: 'reminder' as const,
    icon: 'time-outline' as const,
  },
  {
    id: '2',
    title: 'Mid-term break starts Friday',
    message: 'Students will be on mid-term break from Friday. Classes resume on Monday.',
    date: '5 days ago',
    type: 'info' as const,
    icon: 'calendar-outline' as const,
  },
];

const MOCK_NEWS = [
  {
    id: '1',
    title: 'Annual Sports Day',
    summary: 'The annual inter-house sports competition will hold next month. All students are encouraged to participate.',
    date: 'Jan 28, 2026',
    icon: 'trophy-outline' as const,
  },
  {
    id: '2',
    title: 'PTA Meeting Notice',
    summary: 'Parents are invited to the quarterly PTA meeting to discuss student progress and school improvements.',
    date: 'Jan 20, 2026',
    icon: 'people-outline' as const,
  },
];

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parent, setParent] = useState<ParentResponse | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);

  // For demo purposes - you would get this from auth context
  const parentId = 'f9d03e65-ed2f-45dd-8967-049d51ea3315'; // TODO: Get from authentication

  const loadData = async () => {
    setError(null);

    try {
      const response = await ParentsApi.getParentStudents(parentId);
      setParent(response.parent);
      setStudents(response.students);
    } catch (e: any) {
      console.error('Error loading data:', e);
      const errorMessage = e?.response?.data?.detail || e?.message || 'Failed to load data';
      setError(errorMessage);
    } finally {
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.parentName}>{parent?.first_name || 'Parent'}</Text>
            </View>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {parent?.first_name?.[0] || 'P'}
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtext}>
            Here's what's happening in school
          </Text>
        </View>

        {/* Error Message */}
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

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={styles.notificationsList}>
            {MOCK_NOTIFICATIONS.map((notif) => (
              <Card key={notif.id} style={styles.notificationCard}>
                <CardContent style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <View style={[
                      styles.notifIconCircle,
                      notif.type === 'reminder' ? styles.notifIconReminder : styles.notifIconInfo,
                    ]}>
                      <Ionicons
                        name={notif.icon}
                        size={16}
                        color={notif.type === 'reminder' ? colors.accent : colors.primary}
                      />
                    </View>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                  </View>
                  <Text style={styles.notifMessage}>{notif.message}</Text>
                  <Text style={styles.notifDate}>{notif.date}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* News & Updates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="newspaper-outline" size={20} color={colors.foreground} />
            <Text style={styles.sectionTitle}>News & Updates</Text>
          </View>
          <View style={styles.newsList}>
            {MOCK_NEWS.map((news) => (
              <Card key={news.id} style={styles.newsCard}>
                <CardContent style={styles.newsContent}>
                  <View style={styles.newsHeader}>
                    <View style={styles.newsIconCircle}>
                      <Ionicons name={news.icon} size={16} color={colors.primary} />
                    </View>
                    <View style={styles.newsTextGroup}>
                      <Text style={styles.newsTitle}>{news.title}</Text>
                      <Text style={styles.newsDate}>{news.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.newsSummary}>{news.summary}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
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
  scrollContent: {
    paddingBottom: spacing[8],
  },

  // Header
  headerSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
    borderBottomLeftRadius: borderRadius['3xl'],
    borderBottomRightRadius: borderRadius['3xl'],
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  headerTextGroup: {},
  greeting: {
    fontSize: typography.base,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing[0.5],
  },
  parentName: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerAvatarText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.white,
  },
  headerSubtext: {
    fontSize: typography.sm,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: typography.sm * 1.5,
  },

  // Error
  errorCard: {
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
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

  // Section
  section: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[6],
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

  // Notifications
  notificationsList: {
    gap: spacing[3],
  },
  notificationCard: {},
  notificationContent: {
    gap: spacing[2],
    paddingTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconReminder: {
    backgroundColor: colors.accentLight,
  },
  notifIconInfo: {
    backgroundColor: colors.primaryLight,
  },
  notifTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
    flex: 1,
  },
  notifMessage: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    lineHeight: typography.sm * 1.6,
    marginLeft: spacing[3] + 32, // align with title after icon
  },
  notifDate: {
    fontSize: typography.xs,
    color: colors.gray400,
    marginLeft: spacing[3] + 32,
  },

  // News
  newsList: {
    gap: spacing[3],
  },
  newsCard: {},
  newsContent: {
    gap: spacing[3],
    paddingTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  newsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsTextGroup: {
    flex: 1,
  },
  newsTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.foreground,
  },
  newsDate: {
    fontSize: typography.xs,
    color: colors.gray400,
    marginTop: spacing[0.5],
  },
  newsSummary: {
    fontSize: typography.sm,
    color: colors.mutedForeground,
    lineHeight: typography.sm * 1.6,
  },
});

export default DashboardScreen;
