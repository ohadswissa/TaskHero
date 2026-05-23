import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { colors, shadows, fonts } from '@/theme';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          ...shadows.md,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 10,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Heroes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="people" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="flag" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gift" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="checkmark-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap | string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 32 }}>
      <Ionicons
        name={(focused ? name : `${name}-outline`) as keyof typeof Ionicons.glyphMap}
        size={22}
        color={color}
      />
      {focused && (
        <View
          style={{
            width: 18,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.accent,
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}
