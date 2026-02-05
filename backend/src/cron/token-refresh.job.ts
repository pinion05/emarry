import cron from 'node-cron';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function refreshUserToken(userId: number) {
  const client = await pool.connect();
  try {
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.refresh_token_encrypted,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!
      })
    });

    if (!response.ok) throw new Error(`Token refresh failed: ${response.statusText}`);

    const data = await response.json();

    await client.query(
      `UPDATE users SET access_token_encrypted = $1, token_expiry = NOW() + INTERVAL '1 hour' WHERE id = $2`,
      [data.access_token, userId]
    );

    await client.query(`INSERT INTO processing_logs (user_id, action, status) VALUES ($1, 'token_refresh', 'success')`, [userId]);
    console.log(`✅ Token refreshed for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error refreshing token for user ${userId}:`, error);
    await client.query(
      `INSERT INTO processing_logs (user_id, action, status, error_message) VALUES ($1, 'token_refresh', 'failed', $2)`,
      [userId, error.message]
    );
  } finally {
    client.release();
  }
}

export async function refreshAllTokens() {
  try {
    const result = await pool.query(`SELECT id FROM users WHERE token_expiry < NOW() + INTERVAL '1 hour'`);
    console.log(`Refreshing tokens for ${result.rows.length} users`);
    for (const row of result.rows) {
      await refreshUserToken(row.id);
    }
    console.log('✅ All tokens refreshed');
  } catch (error) {
    console.error('❌ Error in refreshAllTokens:', error);
  }
}

export const tokenRefreshJob = cron.schedule('0 * * * *', refreshAllTokens, { timezone: 'Asia/Seoul' });
