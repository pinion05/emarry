// backend/src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import summaryRoutes from './routes/summary.js';
import userRoutes from './routes/user.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || (() => { throw new Error('SESSION_SECRET environment variable is required'); })(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

import { emailSummaryJob } from './cron/email-summary.job.js';
import { tokenRefreshJob } from './cron/token-refresh.job.js';

console.log('✅ Cron jobs registered');

app.use('/auth', authRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
