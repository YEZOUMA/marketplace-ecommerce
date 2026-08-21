import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validators.js';

const router = Router();

router.post('/', authenticate, authorize('CLIENT'), validate(createOrderSchema), orderController.create);
router.get('/mine', authenticate, authorize('CLIENT'), orderController.listMine);
router.get('/received', authenticate, authorize('VENDEUR'), orderController.listReceived);
router.get('/:id', authenticate, authorize('CLIENT'), orderController.getOne);
router.patch(
  '/:id/statut',
  authenticate,
  authorize('VENDEUR'),
  validate(updateOrderStatusSchema),
  orderController.updateStatus,
);

export default router;
