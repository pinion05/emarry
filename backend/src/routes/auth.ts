// backend/src/routes/auth.ts
import express from 'express';
import passport from '../config/passport.js';

const router = express.Router();

router.get('/google', passport.authenticate('google', {
  scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly']
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
  }
);

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(req.user);
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out' });
  });
});

export default router;
