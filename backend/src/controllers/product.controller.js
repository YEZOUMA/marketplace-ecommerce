import { asyncHandler } from '../utils/asyncHandler.js';
import * as productService from '../services/product.service.js';

export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user.id, req.body);
  res.status(201).json(product);
});

export const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, req.user);
  res.json(result);
});

export const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id, req.user);
  res.json(product);
});

export const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.user.id, req.body);
  res.json(product);
});

export const remove = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.user.id);
  res.status(204).send();
});

export const vendorStats = asyncHandler(async (req, res) => {
  const stats = await productService.getVendorDashboardStats(req.user.id);
  res.json(stats);
});
