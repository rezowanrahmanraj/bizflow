import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('bizflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// ── Issues ────────────────────────────────────────────
export const createIssue = (data) =>
  API.post('/issues', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getMyIssues = () => API.get('/issues/my');
export const getAssignedIssues = () => API.get('/issues/assigned');
export const getStats = () => API.get('/issues/stats');
export const resolveIssue = (id, data) => API.patch(`/issues/${id}/resolve`, data);