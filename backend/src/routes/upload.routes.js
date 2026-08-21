import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { saveImage } from '../services/storage.service.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 8;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(ApiError.badRequest('Format d\'image non supporté (jpeg, png, webp uniquement)'));
    }
    cb(null, true);
  },
});

const router = Router();

// Uploads standalone images (used by the product form before/without a product id yet).
// Vendors and admins only.
router.post(
  '/images',
  authenticate,
  authorize('VENDEUR', 'ADMIN'),
  upload.array('images', MAX_FILES),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) {
      throw ApiError.badRequest('Aucune image fournie');
    }
    const urls = await Promise.all(req.files.map((file) => saveImage(file)));
    res.status(201).json({ urls });
  }),
);

export default router;
