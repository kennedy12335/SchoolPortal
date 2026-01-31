import * as Linking from 'expo-linking';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, shadows } from '../theme';
// Screens
import { HomeStackScreen } from '../screens/DashboardScreen';
import { PaymentsStackScreen } from '../screens/PaymentsScreen';
import { ResultsStackScreen } from '../screens/ResultsScreen';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.surface,
    card: colors.white,
    text: colors.foreground,
    primary: colors.primary,
    border: colors.border,
  },
};

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconName = focused ? name.replace('-outline', '') : name;
  return (
    <Ionicons
      name={iconName as any}
      size={22}
      color={focused ? colors.primary : colors.gray400}
    />
  );
}

const linking: any = {
  prefixes: [Linking.createURL('/'), 'schoolpayment://'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          HomeScreen: '',
        },
      },
      PaymentsTab: {
        screens: {
          PaymentsHome: 'payments',
          SchoolFees: 'school-fees',
          ExamFees: 'exam-fees/:studentId',
          PocketMoney: 'pocket-money/:studentId',
          PaymentSuccess: 'success',
          ExamSuccess: 'exam-success',
        },
      },
      ResultsTab: {
        screens: {
          ResultsHome: 'results',
        },
      },
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking} theme={AppTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 88,
            paddingBottom: 28,
            paddingTop: 8,
            ...shadows.sm,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray400,
          tabBarLabelStyle: {
            fontSize: typography.xs,
            fontWeight: typography.semibold,
            marginTop: 2,
          },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStackScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => <TabIcon name="home-outline" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="PaymentsTab"
          component={PaymentsStackScreen}
          options={{
            tabBarLabel: 'Payments',
            tabBarIcon: ({ focused }) => <TabIcon name="card-outline" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="ResultsTab"
          component={ResultsStackScreen}
          options={{
            tabBarLabel: 'Results',
            tabBarIcon: ({ focused }) => <TabIcon name="school-outline" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
