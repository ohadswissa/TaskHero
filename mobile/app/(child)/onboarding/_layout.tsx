/**
 * Child onboarding stack (M4). Headerless, gestures disabled — the child
 * can only progress forward through origin → species → name → hatch.
 * The parent (child) layout hides the tab bar while we're inside this
 * stack via a useSegments() check.
 */
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="origin" />
      <Stack.Screen name="species" />
      <Stack.Screen name="name" />
      <Stack.Screen name="hatch" />
    </Stack>
  );
}
