/**
 * FloatingTabBar — Polish floating pill tab bar.
 *
 * Custom implementation of the `tabBar` prop for expo-router's `Tabs`
 * (a.k.a. `@react-navigation/bottom-tabs`). Renders a horizontally-laid-out
 * pill that floats above screen content, with an amber-soft pill highlight +
 * label on the active tab and icon-only inactive tabs. Animation is driven by
 * RN's built-in `Animated` API (no Reanimated dep).
 *
 * Layout / sizing constants are exported so screens can pad their scroll
 * containers and avoid content being obscured behind the floating bar.
 *
 * Note on typing: `@react-navigation/bottom-tabs` is reachable at runtime
 * (bundled under expo-router's nested node_modules), but TypeScript's module
 * resolution from `mobile/src/...` can't always find it. We therefore declare
 * a permissive local mirror of `BottomTabBarProps` — `descriptors` is typed
 * as `Record<string, any>` so the navigator's real `BottomTabDescriptor` slots
 * in without friction, and we narrow option fields at the call site.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typographyTokens } from '@/theme';

export const FLOATING_TAB_BAR_HEIGHT = 96;
export const FLOATING_TAB_BAR_SCREEN_PADDING = 110;

// ---------------------------------------------------------------------------
// Local structural types — permissive mirror of @react-navigation/bottom-tabs
// payloads. We accept `any` for descriptor entries + navigation so the real
// navigator types (which we can't directly import in this tree) flow in.
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
const INACTIVE_ICON = hexWithAlpha(NAVY_DEEP, 0.55);

// ---------------------------------------------------------------------------
// Tab item
// ---------------------------------------------------------------------------
interface TabItemProps {
  focused: boolean;
  label: string;
  icon: React.ReactNode;
  badge: boolean;
  onPress: (e: GestureResponderEvent) => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

function TabItem({
  focused,
  label,
  icon,
  badge,
  onPress,
  onLongPress,
  accessibilityLabel,
  testID,
}: TabItemProps) {
  // Drive label opacity (0 → 1) + pill scale (0.95 → 1) from one Animated.Value.
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
    outputRange: [0.95, 1],
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      hitSlop={8}
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

  // Hide routes that the navigator marks as not displayable (expo-router
  // emits `tabBarItemStyle: { display: 'none' }` for `href: null` routes,
  // which is the public-API hook we should look at).
  const visibleRoutes = state.routes.filter((route: NavRoute) => {
    const descriptor = descriptors[route.key];
    if (!descriptor) return false;
    // expo-router hides `href: null` tabs by setting
    // `tabBarItemStyle: { display: 'none' }`.
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
      style={[styles.wrap, { bottom: insets.bottom + 12 }]}
    >
      <View style={styles.bar}>
        {visibleRoutes.map((route: NavRoute) => {
          const descriptor = descriptors[route.key];
          const { options } = descriptor;
          const stateIndex = state.routes.findIndex(
            (r: NavRoute) => r.key === route.key,
          );
          const focused = state.index === stateIndex;

          const rawLabel =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const iconColor = focused ? NAVY_DEEP : INACTIVE_ICON;
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
              // navigation.navigate's signature requires a known route name;
              // we forward the typed-erased route name + params.
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
              label={rawLabel}
              icon={iconNode}
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
    left: 12,
    right: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: '100%',
    gap: 2,
    backgroundColor: BAR_BG,
    borderRadius: 28,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  tabItem: {
    minHeight: 48,
    minWidth: 0,
    flexGrow: 1,
    flexBasis: 0,
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  pill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 22,
  },
  pillActive: {
    backgroundColor: ACTIVE_PILL_BG,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  label: {
    marginTop: 2,
    fontFamily: typographyTokens.captionEmphasis.fontFamily,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    color: NAVY_DEEP,
  },
});
