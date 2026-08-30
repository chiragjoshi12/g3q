import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  schoolLeaderboard,
  talukaLeaderboard,
} from '../controllers/leaderboard.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/school', schoolLeaderboard);
router.get('/taluka', talukaLeaderboard);

export default router;
