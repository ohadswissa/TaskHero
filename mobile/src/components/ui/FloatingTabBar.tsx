/**
 * FloatingTabBar — Polish floating pill tab bar with crafted SVG icons + always-on labels.
 *
 * Custom implementation of the `tabBar` prop for expo-router's `Tabs`. Each tab
 * shows the route's tabBarIcon (the design-system `Icon` primitive) on top and
 * a short label below. Active tab gets a warm amber-soft pill background.
 * Animation is driven by RN's built-in `Animated` (no Reanimated dep).
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export const FLOATING_TAB_BAR_HEIGHT = 96;
export const FLOATING_TAB_BAR_SCREEN_PADDING = 120;

// ---------------------------------------------------------------------------
// Local structural types — permissive mirror of @react-navigation/bottom-tabs
// ---------------------------------------------------------------------------
interface NavRoute {
  key: string;
  name: string;
  params?: object;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDescriptor = { options: any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNavigation = any;

interface BottomTabBarProps {
  state: {
    index: number;
    routes: NavRoute[];
  };
  descriptors: Record<string, AnyDescriptor>;
  navigation: AnyNavigation;
}

// ---------------------------------------------------------------------------
// Label override registry — keyed by Expo Router route name. Used when the
// route's `title` / `tabBarLabel` is too long or oddly cased for a tight pill.
// ---------------------------------------------------------------------------
const LABEL_OVERRIDES: Record<string, string> = {
  index: 'Home',
  children: 'Heroes',
  missions: 'Missions',
  rewards: 'Rewards',
  'approvals/index': 'Approvals',
};

function labelForRoute(name: string, fallback: string): string {
  return LABEL_OVERRIDES[name] ?? fallback;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------
function hexWithAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(15,26,51,${alpha})`;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

const ACTIVE_PILL_BG =
  (colors as { amberSoft?: string }).amberSoft ?? hexWithAlpha(colors.accent, 0.18);
const NAVY_DEEP = colors.navyDeep ?? colors.primary;
const PARCHMENT_BG = (colors as { parchment?: string }).parchment ?? colors.cream;
const BAR_BG = hexWithAlpha(PARCHMENT_BG, 0.94);
const HAIRLINE = hexWithAlpha(NAVY_DEEP, 0.08);
const INACTIVE_LABEL = hexWithAlpha(NAVY_DEEP, 0.6);

// ---------------------------------------------------------------------------
// Tab item
// ---------------------------------------------------------------------------
interface TabItemProps {
  focused: boolean;
  icon: React.ReactNode;
  label: string;
  badge: boolean;
  onPress: (e: GestureResponderEvent) => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

function TabItem({
  focused,
  icon,
  label,
  badge,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: TabItemProps) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const pillScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      hitSlop={6}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.pill,
          focused ? styles.pillActive : null,
          { transform: [{ scale: pillScale }] },
        ]}
      >
        <View style={styles.iconWrap}>
          {icon}
          {badge ? <View style={styles.badge} /> : null}
        </View>
        <Text
          style={[styles.label, focused ? styles.labelActive : styles.labelInactive]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function FloatingTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((route: NavRoute) => {
    const descriptor = descriptors[route.key];
    if (!descriptor) return false;
    const itemStyle = descriptor.options.tabBarItemStyle as
      | { display?: 'flex' | 'none' }
      | null
      | undefined;
    if (itemStyle && itemStyle.display === 'none') return false;
    return true;
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + 10 }]}
    >
      <View style={styles.bar}>
        {visibleRoutes.map((route: NavRoute) => {
          const descriptor = descriptors[route.key];
          const { options } = descriptor;
          const stateIndex = state.routes.findIndex(
            (r: NavRoute) => r.key === route.key,
          );
          const focused = state.index === stateIndex;

          const fallbackLabel =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const label = labelForRoute(route.name, fallbackLabel);
          const iconColor = focused ? NAVY_DEEP : INACTIVE_LABEL;
          const iconNode = options.tabBarIcon
            ? options.tabBarIcon({
                focused,
                color: iconColor,
                size: 22,
              })
            : null;
          const badge = Boolean(options.tabBarBadge);

          const onPress = (_event: GestureResponderEvent) => {
            const navEvent = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !navEvent.defaultPrevented) {
              (navigation as unknown as {
                navigate: (name: string, params?: object) => void;
              }).navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              icon={iconNode}
              label={label}
              badge={badge}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
    gap: 0,
    backgroundColor: BAR_BG,
    borderRadius: 28,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  tabItem: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 56,
  },
  pillActive: {
    backgroundColor: ACTIVE_PILL_BG,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  label: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: NAVY_DEEP,
  },
  labelInactive: {
    color: INACTIVE_LABEL,
  },
});
