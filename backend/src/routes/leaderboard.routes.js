import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  citizenLeaderboard,
  collegeLeaderboard,
  schoolLeaderboard,
  talukaLeaderboard,
} from '../controllers/leaderboard.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/school', schoolLeaderboard);
router.get('/college', collegeLeaderboard);
router.get('/citizen', citizenLeaderboard);
router.get('/taluka', talukaLeaderboard);

export default router;
