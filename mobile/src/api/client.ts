import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const success = await useAuthStore.getState().refreshTokens();
        if (success) {
          // Retry the original request with new token
          const token = useAuthStore.getState().accessToken;
          if (originalRequest.headers && token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    // Extract error message from response
    const message =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
