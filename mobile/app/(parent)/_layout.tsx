/**
 * Parent shell — Polish-B3.
 *
 * Hosts the parent tab navigator over a subtle parentDashboard gradient
 * backdrop and mounts a global ToastStack sibling so toasts float above
 * every screen. Tab icons use the design-system Icon registry; the
 * Approvals tab carries a live amber badge dot driven by
 * `approvalsApi.listPending` (refetched every 15s).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { approvalsApi, queryKeys } from '@/api';
import {
  FloatingTabBar,
  GradientBackdrop,
  Icon,
  ToastStack,
  type IconName,
} from '@/components/ui';
import { colors } from '@/theme';

interface TabBarIconProps {
  name: IconName;
  color: string;
  focused: boolean;
  badge?: boolean;
}

function TabBarIcon({ name, color, focused, badge }: TabBarIconProps) {
  return (
    <View style={iconStyles.wrap}>
      <Icon
        name={name}
        size={focused ? 24 : 22}
        color={color}
        strokeWidth={focused ? 2 : 1.75}
      />
      {badge ? <View style={iconStyles.badge} /> : null}
    </View>
  );
}

export default function ParentLayout() {
  // Polling for pending approvals so the badge stays current without
  // forcing the dashboard to refresh first.
  const pendingQ = useQuery({
    queryKey: [...queryKeys.approvals.pending],
    queryFn: approvalsApi.listPending,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });
  const hasPending = (pendingQ.data?.length ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Layout-level gradient — individual screens may overlay their own. */}
      <GradientBackdrop
        variant="parentDashboard"
        intensity="subtle"
        style={StyleSheet.absoluteFill as any}
      />

      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTokens.secondary,
          sceneStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="sparkle" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="children"
          options={{
            title: 'Heroes',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="crown" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="missions"
          options={{
            title: 'Missions',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="scroll" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="heart" color={color} focused={focused} />
            ),
          }}
        />
        {/* Approvals is a top-level tab. The pending-approvals dot now
            lives on this tab's icon (was on Home). The detail route
            stays hidden via href:null — it's only reachable by tapping
            a row inside the list. Settings remains hidden too. */}
        <Tabs.Screen
          name="approvals/index"
          options={{
            title: 'Approvals',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon
                name="checkCircle"
                color={color}
                focused={focused}
                badge={hasPending}
              />
            ),
          }}
        />
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="approvals/[id]" options={{ href: null }} />
      </Tabs>

      <ToastStack />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 28,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.creamSoft,
  },
});
