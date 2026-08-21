import { apiClient } from './client.js';

export const listProducts = (params) => apiClient.get('/products', { params }).then((r) => r.data);
export const getProduct = (id) => apiClient.get(`/products/${id}`).then((r) => r.data);
export const createProduct = (payload) => apiClient.post('/products', payload).then((r) => r.data);
export const updateProduct = (id, payload) => apiClient.patch(`/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`).then((r) => r.data);
export const getVendorStats = () => apiClient.get('/products/vendeur/stats').then((r) => r.data);
export const uploadImages = (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  return apiClient
    .post('/uploads/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};
