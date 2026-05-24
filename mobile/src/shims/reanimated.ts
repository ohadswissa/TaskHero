/**
 * Reanimated shim for Expo Go on iOS (SDK 54).
 *
 * Reanimated 4's native worklets host functions fail to initialize inside the
 * Expo Go iOS binary, which crashes the JS bundle at module-eval time. To keep
 * the app runnable in Expo Go we alias `react-native-reanimated` to this shim
 * via babel module-resolver. The shim re-exports a minimal subset of the
 * Reanimated API backed by React Native's built-in Animated module so existing
 * call-sites (useSharedValue / useAnimatedStyle / withTiming / withSpring /
 * Animated.View / etc.) continue to compile and render — without any worklet
 * or JSI bridging.
 *
 * Visual fidelity is reduced (no true worklet-driven animations), but the app
 * boots and demo flows are usable. For full Reanimated behaviour, switch to a
 * custom dev client / EAS build.
 */
import * as React from 'react';
import {
  Animated as RNAnimated,
  Easing as RNEasing,
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';

// --- shared values --------------------------------------------------------
class SharedValue<T> {
  value: T;
  _anim: RNAnimated.Value | null = null;
  constructor(initial: T) {
    this.value = initial;
    if (typeof initial === 'number') {
      this._anim = new RNAnimated.Value(initial);
    }
  }
}

export function useSharedValue<T>(initial: T): SharedValue<T> {
  const ref = React.useRef<SharedValue<T> | null>(null);
  if (ref.current === null) {
    ref.current = new SharedValue<T>(initial);
  }
  return ref.current;
}

export function useDerivedValue<T>(fn: () => T): SharedValue<T> {
  return useSharedValue(fn());
}

// --- timing / spring helpers ---------------------------------------------
type AnimConfig = { duration?: number; easing?: any };
type SpringConfig = { stiffness?: number; damping?: number; mass?: number };

export function withTiming<T>(toValue: T, _config?: AnimConfig, _cb?: any): T {
  return toValue;
}
export function withSpring<T>(toValue: T, _config?: SpringConfig, _cb?: any): T {
  return toValue;
}
export function withDelay<T>(_delay: number, value: T): T {
  return value;
}
export function withRepeat<T>(value: T, _count?: number, _reverse?: boolean): T {
  return value;
}
export function withSequence<T>(...values: T[]): T {
  return values[values.length - 1] as T;
}
export function cancelAnimation(_sv: SharedValue<any>) {
  /* noop */
}
export function runOnJS<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}
export function runOnUI<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}
export function interpolate(
  value: number,
  input: number[],
  output: number[],
  _extrapolation?: any,
): number {
  // linear interpolate clamp
  if (value <= input[0]) return output[0];
  if (value >= input[input.length - 1]) return output[output.length - 1];
  for (let i = 0; i < input.length - 1; i++) {
    if (value >= input[i] && value <= input[i + 1]) {
      const t = (value - input[i]) / (input[i + 1] - input[i]);
      return output[i] + t * (output[i + 1] - output[i]);
    }
  }
  return output[0];
}
export function interpolateColor(
  value: number,
  input: number[],
  output: string[],
): string {
  if (value <= input[0]) return output[0];
  if (value >= input[input.length - 1]) return output[output.length - 1];
  return output[0];
}

export const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
export const Extrapolate = Extrapolation;
export const Easing = RNEasing;

// --- animated style hooks -------------------------------------------------
export function useAnimatedStyle<T extends object>(fn: () => T, _deps?: any[]): T {
  // Evaluate once; sharedvalues read .value (already set). For dynamic updates
  // most call-sites also re-render via React state; that's good enough here.
  try {
    return fn();
  } catch {
    return {} as T;
  }
}
export function useAnimatedProps<T extends object>(fn: () => T): T {
  try {
    return fn();
  } catch {
    return {} as T;
  }
}
export function useAnimatedScrollHandler(_handlers: any): any {
  return undefined;
}
export function useAnimatedReaction<T>(_prepare: () => T, _react: (v: T, prev: T | null) => void) {
  /* noop */
}
export function useAnimatedGestureHandler(_handlers: any) {
  return {};
}

// --- Animated components --------------------------------------------------
const createAnimatedComponent = RNAnimated.createAnimatedComponent;

const AnimatedView: any = RNAnimated.View;
const AnimatedText: any = RNAnimated.Text;
const AnimatedScrollView: any = RNAnimated.ScrollView;
const AnimatedImage: any = RNAnimated.Image;
const AnimatedPressable: any = createAnimatedComponent(Pressable);

const Animated: any = {
  View: AnimatedView,
  Text: AnimatedText,
  ScrollView: AnimatedScrollView,
  Image: AnimatedImage,
  createAnimatedComponent,
};

export { View, Text, ScrollView, Image, Pressable, AnimatedPressable };
export default Animated;

// Named exports that some libs/code expect:
export const FadeIn = { duration: () => FadeIn };
export const FadeOut = { duration: () => FadeOut };
export const SlideInDown = { duration: () => SlideInDown };
export const SlideOutDown = { duration: () => SlideOutDown };
export const ZoomIn = { duration: () => ZoomIn };
export const ZoomOut = { duration: () => ZoomOut };
export const Layout = { duration: () => Layout, springify: () => Layout };
