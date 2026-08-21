import { apiClient } from './client.js';

export const registerUser = (payload) => apiClient.post('/auth/register', payload).then((r) => r.data);
export const loginUser = (payload) => apiClient.post('/auth/login', payload).then((r) => r.data);
export const logoutUser = (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data);
export const fetchMe = () => apiClient.get('/auth/me').then((r) => r.data);
