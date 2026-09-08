import { Router } from 'express';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import {
  betaLeaderboardOverview,
  citizenLeaderboard,
  collegeLeaderboard,
  leaderboardOverview,
  schoolLeaderboard,
  talukaLeaderboard,
} from '../controllers/leaderboard.controller.js';

const router = Router();

router.use(optionalAuth);

router.get('/beta', betaLeaderboardOverview);
router.get('/', leaderboardOverview);
router.get('/school', schoolLeaderboard);
router.get('/college', collegeLeaderboard);
router.get('/citizen', citizenLeaderboard);
router.get('/taluka', talukaLeaderboard);

export default router;
