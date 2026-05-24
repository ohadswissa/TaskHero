/**
 * AnimatedPressable — Polish-B1 spring-scale tap reaction + optional haptic.
 *
 * NOTE: Originally used react-native-reanimated. In Expo Go on iOS with SDK 54,
 * Reanimated 4's native worklets module fails to initialize at module-eval time
 * ("Exception in HostFunction"), which crashes the entire app on launch. To keep
 * the app runnable inside Expo Go we use React Native's built-in Animated API,
 * which produces an equivalent press-scale effect without any native bridging
 * surprises. Behaviour and props are unchanged for callers.
 */
import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type ViewStyle,
  Platform,
} from 'react-native';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type HapticStrength = 'light' | 'medium' | null;

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  haptic?: HapticStrength;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

async function triggerHaptic(strength: HapticStrength) {
  if (!strength || Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    const style =
      strength === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
    await Haptics.impactAsync(style);
  } catch {
    // expo-haptics not available — silently noop.
  }
}

export function AnimatedPressable({
  haptic = 'light',
  style,
  children,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    },
    [scale, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 220,
        damping: 14,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  const handlePress = useCallback(
    (e: any) => {
      void triggerHaptic(haptic);
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressableBase
      {...(rest as any)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[{ transform: [{ scale }] }, style as any]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
