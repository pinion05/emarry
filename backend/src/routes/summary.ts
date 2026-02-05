import express from 'express';
import { Pool } from 'pg';
import { generateSummaryForUser } from '../cron/email-summary.job.js';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.get('/', requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(`SELECT * FROM email_summaries WHERE user_id = $1 ORDER BY summary_date DESC`, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(`SELECT * FROM email_summaries WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Summary not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manual', requireAuth, async (req: any, res) => {
  try {
    await generateSummaryForUser(req.user.id);
    res.json({ message: 'Summary generation started' });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
