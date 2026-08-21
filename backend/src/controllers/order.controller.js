import { asyncHandler } from '../utils/asyncHandler.js';
import * as orderService from '../services/order.service.js';

export const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(order);
});

export const listMine = asyncHandler(async (req, res) => {
  const orders = await orderService.listClientOrders(req.user.id);
  res.json(orders);
});

export const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getClientOrderById(req.user.id, req.params.id);
  res.json(order);
});

export const listReceived = asyncHandler(async (req, res) => {
  const orders = await orderService.listVendorOrders(req.user.id);
  res.json(orders);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatusByVendor(req.user.id, req.params.id, req.body.statut);
  res.json(order);
});
