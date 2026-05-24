/**
 * Auth stack — Polish-B2.
 *
 * Wrap the entire auth flow in a navy GradientBackdrop so login / register
 * / child-login screens inherit the "magic moment" tone. Individual screens
 * MUST NOT set their own root background — let the gradient show through.
 */
import { Stack } from 'expo-router';
import { GradientBackdrop } from '@/components/ui';

export default function AuthLayout() {
  return (
    <GradientBackdrop variant="navy" intensity="rich" direction="diagonal">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="child-login" />
      </Stack>
    </GradientBackdrop>
  );
}
