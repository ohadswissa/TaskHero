/**
 * Root entry — Polish-B2.
 *
 * While the auth store is still hydrating (initial mount), render the
 * same SplashSparkle as `_layout` so we never flash a blank screen.
 * Once we know the role, redirect accordingly.
 */
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { SplashSparkle } from './_layout';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuthStore() as {
    isAuthenticated: boolean;
    user?: { role?: string } | null;
    isLoading?: boolean;
  };

  // Auth store may not expose isLoading — defensively gate only on user/role.
  if (isLoading) {
    return <SplashSparkle />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'PARENT') {
    return <Redirect href="/(parent)" />;
  }

  if (user?.role === 'CHILD') {
    return <Redirect href="/(child)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
