import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Running migrations...');

    const migrationFile = path.join(__dirname, '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    await client.query(sql);

    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
