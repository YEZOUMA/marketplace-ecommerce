import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminService from '../services/admin.service.js';

export const users = asyncHandler(async (req, res) => {
  const result = await adminService.listUsers(req.query);
  res.json(result);
});

export const setProductStatus = asyncHandler(async (req, res) => {
  const product = await adminService.setProductStatus(req.params.id, req.body.statut);
  res.json(product);
});

export const orders = asyncHandler(async (req, res) => {
  const result = await adminService.listAllOrders(req.query);
  res.json(result);
});

export const payments = asyncHandler(async (req, res) => {
  const result = await adminService.listAllPublicationPayments(req.query);
  res.json(result);
});

export const stats = asyncHandler(async (req, res) => {
  const result = await adminService.globalStats();
  res.json(result);
});
