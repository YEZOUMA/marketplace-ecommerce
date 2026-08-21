import { apiClient } from './client.js';

export const adminListUsers = (params) => apiClient.get('/admin/users', { params }).then((r) => r.data);
export const adminSetProductStatus = (id, statut) =>
  apiClient.patch(`/admin/products/${id}/statut`, { statut }).then((r) => r.data);
export const adminListOrders = (params) => apiClient.get('/admin/orders', { params }).then((r) => r.data);
export const adminListPayments = (params) => apiClient.get('/admin/payments', { params }).then((r) => r.data);
export const adminStats = () => apiClient.get('/admin/stats').then((r) => r.data);
