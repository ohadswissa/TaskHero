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
    const rawMessage = (error.response?.data as { message?: string | string[] })?.message;
    const message =
      (Array.isArray(rawMessage) ? rawMessage[0] : rawMessage) ||
      error.message ||
      'An error occurred';

    // Preserve status on the rethrown Error so callers can detect 404/etc.
    const wrapped = new Error(message) as Error & { status?: number };
    if (error.response?.status) wrapped.status = error.response.status;
    return Promise.reject(wrapped);
  }
);

/**
 * Surface a backend error message cleanly. Handles both axios errors and
 * the rethrown Error instances created by the response interceptor above.
 *
 * Backend envelope shape: `{ statusCode, message, error }` where `message`
 * may be a string or a string[] (class-validator). We coerce to a single
 * human-readable string.
 */
export function extractApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (!err) return fallback;
  // Already-normalised Error (from the response interceptor)
  if (err instanceof Error && err.message) return err.message;
  const anyErr = err as {
    response?: { data?: { message?: string | string[]; error?: string } };
    message?: string;
  };
  const msg = anyErr.response?.data?.message;
  if (Array.isArray(msg) && msg.length > 0) return msg[0];
  if (typeof msg === 'string' && msg.length > 0) return msg;
  if (anyErr.response?.data?.error) return anyErr.response.data.error;
  if (anyErr.message) return anyErr.message;
  return fallback;
}

export default apiClient;
