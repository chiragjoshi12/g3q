import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { CONFIG } from './config/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import attemptRoutes from './routes/attempt.routes.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sessionRoutes from './routes/session.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import g3qAiRoutes from './routes/g3qAi.routes.js';

const app = express();

//middlewares
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        CONFIG.CORS_ALLOW_ALL ||
        CONFIG.FRONTEND_ORIGINS.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('tiny'));
//middlewares

app.get('/', (req, res) => {
  return res.send('⚡️ ');
});

app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({ status: 'ok', service: 'g3q-backend' });
});

// Mounted at /api (no version prefix) to match the frontend's default
// NEXT_PUBLIC_API_BASE_URL in gujarat-gov-quiz/config/app.config.js — point
// it at this server's origin + /api and the REST data source works as-is.
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/g3q-ai', g3qAiRoutes);
// Admin console paths kept under /api/v1/admin to match the Next.js client.
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
