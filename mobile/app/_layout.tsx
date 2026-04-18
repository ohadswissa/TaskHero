import { useEffect, Component, ReactNode } from 'react';
import { Platform, Text, View, ScrollView } from 'react-native';
import { SplashScreen, Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

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

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (Platform.OS !== 'web') {
        SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded, fontError]);

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
