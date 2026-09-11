import { Router } from 'express';
import { getMe, uploadProfilePhoto } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { uploadProfilePhotoSchema } from '../validators/user.validator.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.post(
  '/me/photo',
  requireAuth,
  validateRequest(uploadProfilePhotoSchema),
  uploadProfilePhoto
);

export default router;
