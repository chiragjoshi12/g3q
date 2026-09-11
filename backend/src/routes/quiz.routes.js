import { Router } from 'express';
import { getPracticeBundle } from '../controllers/quiz.controller.js';

const router = Router();

router.get('/practice/bundle', getPracticeBundle);

export default router;
