import { apiClient } from './client.js';

export const createOrder = (payload) => apiClient.post('/orders', payload).then((r) => r.data);
export const listMyOrders = () => apiClient.get('/orders/mine').then((r) => r.data);
export const getOrder = (id) => apiClient.get(`/orders/${id}`).then((r) => r.data);
export const listReceivedOrders = () => apiClient.get('/orders/received').then((r) => r.data);
export const updateOrderStatus = (id, statut) => apiClient.patch(`/orders/${id}/statut`, { statut }).then((r) => r.data);
