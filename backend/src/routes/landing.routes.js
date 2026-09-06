import { Router } from 'express';
import { getLandingSummary } from '../controllers/landing.controller.js';

const router = Router();

router.get('/summary', getLandingSummary);

export default router;
