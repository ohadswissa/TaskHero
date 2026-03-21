import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

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
