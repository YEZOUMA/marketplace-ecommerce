import { apiClient } from './client.js';

export const getProviders = () => apiClient.get('/payments/providers').then((r) => r.data);
export const initiatePublicationPayment = (productId, payload) =>
  apiClient.post(`/payments/publish/${productId}`, payload).then((r) => r.data);
export const getMyPayments = () => apiClient.get('/payments/mine').then((r) => r.data);
export const simulatePayment = (payload) => apiClient.post('/payments/mock/simulate', payload).then((r) => r.data);
