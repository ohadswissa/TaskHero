import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, fonts } from '@/theme';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          ...shadows.md,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="flag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="gift-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approve',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
