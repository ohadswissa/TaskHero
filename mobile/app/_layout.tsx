/**
 * Root layout — Polish-B2.
 *
 * Loads Nunito/Fraunces/Inter fonts. While fonts are still loading we
 * render a centered animated sparkle over the navy gradient so the user
 * never sees a blank/null splash flash.
 */
import { useEffect, Component, ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SplashScreen, Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GradientBackdrop, Icon } from '@/components/ui';
import { colors } from '@/theme';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ color: 'red', fontSize: 18, fontWeight: 'bold', marginTop: 40 }}>App Error</Text>
          <Text style={{ color: 'red', marginTop: 10 }}>{String((this.state.error as any)?.message)}</Text>
          <Text style={{ color: '#666', marginTop: 10, fontSize: 12 }}>{String((this.state.error as any)?.stack)}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const SafeGestureRoot = GestureHandlerRootView as any;

export function SplashSparkle() {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.15, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GradientBackdrop variant="navy" intensity="rich" direction="diagonal">
      <View style={splashStyles.center}>
        <Animated.View style={style}>
          <Icon name="sparkle" size={64} color={colors.amberDeep} />
        </Animated.View>
      </View>
    </GradientBackdrop>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded, fontError]);

  // Polish-B2: never return null — render the gradient + pulsing sparkle
  // so the bootstrap feels intentional even on a slow font load.
  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          {/* Cannot use SplashSparkle here because Reanimated needs fonts? No — Reanimated runs fine pre-fonts. */}
          <SplashSparkle />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeGestureRoot style={{ flex: 1 }}>
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(parent)" />
              <Stack.Screen name="(child)" />
            </Stack>
          </SafeAreaProvider>
        </SafeGestureRoot>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const splashStyles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
