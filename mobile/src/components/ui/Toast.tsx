/**
 * Toast — Polish-B3 transient feedback layer.
 *
 * Single-file module exporting:
 *   - useToastStore: Zustand store of active toasts.
 *   - useToast(): ergonomic { show, dismiss } hook.
 *   - ToastStack: render-once layout component (mount near app root,
 *     ideally inside SafeAreaProvider).
 *
 * Toasts auto-dismiss after `durationMs` (default 3000ms). The stack is
 * capped at 4 — older items drop off when a 5th is pushed.
 */
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { create } from 'zustand';
import { spacing } from '@/theme';
import { Banner, type BannerTone } from './Banner';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  durationMs?: number;
}

const MAX_STACK = 4;
const DEFAULT_DURATION = 3000;

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

function makeId(): string {
  return Math.random().toString(36).slice(2);
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = makeId();
    const toast: Toast = { id, ...t };
    set((state) => {
      const next = [...state.toasts, toast];
      // cap stack
      while (next.length > MAX_STACK) next.shift();
      return { toasts: next };
    });
    const duration = t.durationMs ?? DEFAULT_DURATION;
    if (duration > 0) {
      setTimeout(() => {
        const stillPresent = get().toasts.some((existing) => existing.id === id);
        if (stillPresent) get().dismiss(id);
      }, duration);
    }
    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear: () => set({ toasts: [] }),
}));

export function useToast(): {
  show: (
    message: string,
    opts?: { tone?: ToastTone; durationMs?: number },
  ) => string;
  dismiss: (id: string) => void;
} {
  const push = useToastStore((s) => s.push);
  const dismiss = useToastStore((s) => s.dismiss);
  return useMemo(
    () => ({
      show: (message, opts) =>
        push({
          message,
          tone: opts?.tone ?? 'info',
          durationMs: opts?.durationMs,
        }),
      dismiss,
    }),
    [push, dismiss],
  );
}

function toastToBannerTone(tone: ToastTone): BannerTone {
  // Banner already defines the same tones we accept.
  return tone;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const translateY = useSharedValue(-40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, {
      stiffness: 220,
      damping: 18,
      mass: 0.9,
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.item, animatedStyle]}
      pointerEvents="auto"
    >
      <Pressable
        onPress={() => onDismiss(toast.id)}
        accessibilityRole="button"
        accessibilityLabel={`Dismiss ${toast.tone} notice: ${toast.message}`}
      >
        <Banner tone={toastToBannerTone(toast.tone)} message={toast.message} />
      </Pressable>
    </Animated.View>
  );
}

export function ToastStack(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.stack, { top: insets.top + 8 }]}
      accessibilityLiveRegion="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
    zIndex: 1000,
  },
  item: {
    // no padding here — Banner has its own
  },
});
