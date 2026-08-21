import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validators.js';

const router = Router();

router.get('/', categoryController.list);
router.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), categoryController.create);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateCategorySchema), categoryController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.remove);

export default router;
