import axios from 'axios';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);
