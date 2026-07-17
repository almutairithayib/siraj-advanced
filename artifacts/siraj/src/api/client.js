import axios from 'axios';

// Use relative URL so it works through the Replit proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('siraj_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 Unauthorized
// FIX: Do NOT use window.location.href (hard reload wipes React state and
// causes a redirect race if a pre-login 401 arrives after navigation).
// Instead, dispatch a custom event that AuthContext listens to and handles
// gracefully inside React (soft logout → AppLayout redirects via React Router).
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Skip logout for the login request itself — it returns 401 on bad credentials
      const isAuthRequest = error.config?.url?.includes('/auth/');
      if (!isAuthRequest) {
        localStorage.removeItem('siraj_token');
        localStorage.removeItem('siraj_user');
        // Signal AuthContext to clear state (React Router handles redirect)
        window.dispatchEvent(new CustomEvent('siraj:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
