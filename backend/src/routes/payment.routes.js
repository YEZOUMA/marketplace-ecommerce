import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { initiatePaymentSchema, webhookParamsSchema, mockSimulateSchema } from '../validators/payment.validators.js';

const router = Router();

router.get('/providers', paymentController.providers);
router.get('/mine', authenticate, authorize('VENDEUR'), paymentController.myPayments);

router.post(
  '/publish/:productId',
  authenticate,
  authorize('VENDEUR'),
  validate(initiatePaymentSchema),
  paymentController.initiate,
);

// Public endpoint called by the mobile money provider's servers — auth is the HMAC
// signature verified inside the controller, not a JWT.
router.post('/webhook/:prestataire', validate(webhookParamsSchema), paymentController.webhook);

router.post('/mock/simulate', authenticate, authorize('VENDEUR'), validate(mockSimulateSchema), paymentController.mockSimulate);

export default router;
