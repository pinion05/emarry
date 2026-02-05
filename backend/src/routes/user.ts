import express from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/me', requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, picture, is_active, summary_enabled, preferred_summary_time, timezone FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me', requireAuth, async (req: any, res) => {
  try {
    const { summary_enabled, preferred_summary_time, timezone } = req.body;
    const result = await pool.query(
      `UPDATE users SET summary_enabled = COALESCE($1, summary_enabled), preferred_summary_time = COALESCE($2, preferred_summary_time), timezone = COALESCE($3, timezone), updated_at = NOW() WHERE id = $4 RETURNING id, email, name, picture, summary_enabled, preferred_summary_time, timezone`,
      [summary_enabled, preferred_summary_time, timezone, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
