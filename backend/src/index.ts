// backend/src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();

import passport from './config/passport.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'emarry-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
