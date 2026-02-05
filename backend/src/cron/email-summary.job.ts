import cron from 'node-cron';
import { Pool } from 'pg';
import { getUnreadEmails } from '../services/gmail.service.js';
import { summarizeEmails } from '../services/openrouter.service.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function generateSummaryForUser(userId: number) {
  const client = await pool.connect();
  try {
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    const existingSummary = await client.query(
      `SELECT id FROM email_summaries WHERE user_id = $1 AND summary_date = CURRENT_DATE`,
      [userId]
    );

    if (existingSummary.rows.length > 0) {
      console.log(`Summary already sent for user ${userId} today`);
      return;
    }

    const emails = await getUnreadEmails(user.access_token_encrypted);

    if (emails.length === 0) {
      console.log(`No unread emails for user ${userId}`);
      return;
    }

    const summaryText = await summarizeEmails(
      emails.map(e => ({ subject: e.subject, from: e.from, snippet: e.snippet }))
    );

    await client.query(
      `INSERT INTO email_summaries (user_id, summary_date, email_count, summary_text, status, sent_at)
       VALUES ($1, CURRENT_DATE, $2, $3, 'completed', NOW())`,
      [userId, emails.length, summaryText]
    );

    await client.query('UPDATE users SET last_summary_sent = CURRENT_DATE WHERE id = $1', [userId]);
    console.log(`✅ Summary generated for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error generating summary for user ${userId}:`, error);
    await client.query(
      `INSERT INTO processing_logs (user_id, action, status, error_message) VALUES ($1, 'email_summary', 'failed', $2)`,
      [userId, error.message]
    );
  } finally {
    client.release();
  }
}

export async function generateAllSummaries() {
  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE is_active = true AND summary_enabled = true AND token_expiry > NOW()`
    );
    console.log(`Generating summaries for ${result.rows.length} users`);
    for (const row of result.rows) {
      await generateSummaryForUser(row.id);
    }
    console.log('✅ All summaries generated');
  } catch (error) {
    console.error('❌ Error in generateAllSummaries:', error);
  }
}

export const emailSummaryJob = cron.schedule('0 9 * * *', generateAllSummaries, { timezone: 'Asia/Seoul' });
