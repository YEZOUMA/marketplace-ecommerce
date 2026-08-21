import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listUsersQuerySchema,
  setProductStatusSchema,
  paginationQuerySchema,
  listPaymentsQuerySchema,
} from '../validators/admin.validators.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/users', validate(listUsersQuerySchema), adminController.users);
router.patch('/products/:id/statut', validate(setProductStatusSchema), adminController.setProductStatus);
router.get('/orders', validate(paginationQuerySchema), adminController.orders);
router.get('/payments', validate(listPaymentsQuerySchema), adminController.payments);
router.get('/stats', adminController.stats);

export default router;
