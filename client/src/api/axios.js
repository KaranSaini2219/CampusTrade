import axios from 'axios';

// For public endpoints (login, register, verify-email, etc.)
export const authApi = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// For protected endpoints (everything else)
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Only add Authorization header to protected api
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle suspended accounts for both
const handleResponseError = (err) => {
  if (err.response?.status === 403 && err.response?.data?.message?.includes('suspended')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(err);
};

api.interceptors.response.use((res) => res, handleResponseError);
authApi.interceptors.response.use((res) => res, handleResponseError);

export default api;