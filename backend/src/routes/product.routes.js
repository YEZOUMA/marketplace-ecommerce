import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  idParamSchema,
} from '../validators/product.validators.js';

const router = Router();

router.get('/', optionalAuthenticate, validate(listProductsQuerySchema), productController.list);
router.get('/vendeur/stats', authenticate, authorize('VENDEUR'), productController.vendorStats);
router.get('/:id', optionalAuthenticate, validate(idParamSchema), productController.getOne);

router.post('/', authenticate, authorize('VENDEUR'), validate(createProductSchema), productController.create);
router.patch('/:id', authenticate, authorize('VENDEUR'), validate(updateProductSchema), productController.update);
router.delete('/:id', authenticate, authorize('VENDEUR'), validate(idParamSchema), productController.remove);

export default router;
