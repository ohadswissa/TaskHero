import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import { authApi } from '@/api/auth.api';

interface User {
  id: string;
  email: string | null;
  role: 'PARENT' | 'CHILD';
  familyId: string;
  displayName?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginChild: (familyCode: string, pin: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    familyName?: string;
    timezone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

// Custom storage using SecureStore on native, localStorage on web
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(name);
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.setItem(name, value); return; }
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') { localStorage.removeItem(name); return; }
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          set({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginChild: async (familyCode: string, pin: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.loginChild({ familyCode, pin });
          set({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          set({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        console.log('[signout] authStore.logout: start (hasRefresh=', !!refreshToken, ')');
        // Flip auth state FIRST so any gates / route guards can react
        // immediately. The backend revoke call below is best-effort and
        // must never block the user from leaving the authed UI.
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        });
        console.log('[signout] authStore.logout: state cleared');
        if (refreshToken) {
          try {
            await authApi.logout(refreshToken);
            console.log('[signout] authStore.logout: backend revoke ok');
          } catch (error) {
            console.warn('[signout] authStore.logout: backend revoke failed', error);
          }
        }
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await authApi.refresh(refreshToken);
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          });
          return true;
        } catch (error) {
          get().clearAuth();
          return false;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
