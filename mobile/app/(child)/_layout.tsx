import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, fonts } from '@/theme';

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
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
          title: 'Hero',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person-outline" size={size} color={color} />
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
        name="creature"
        options={{
          title: 'Creature',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="paw-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hide old room tab */}
      <Tabs.Screen
        name="room"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="avatar"
        options={{
          title: 'Avatar',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="body-outline" size={size} color={color} />
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
      {/* Hide old games tab */}
      <Tabs.Screen
        name="games"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
