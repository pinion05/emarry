import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const schema = `
-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture TEXT,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expiry TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    summary_enabled BOOLEAN DEFAULT true,
    preferred_summary_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    email_notification BOOLEAN DEFAULT false,
    last_summary_sent DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Email summaries table
CREATE TABLE IF NOT EXISTS email_summaries (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    email_count INTEGER DEFAULT 0,
    summary_text TEXT NOT NULL,
    categories JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    sent_via VARCHAR(20) DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, summary_date)
);

-- 3. Processing logs table
CREATE TABLE IF NOT EXISTS processing_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_summary_enabled ON users(summary_enabled) WHERE summary_enabled = true;
CREATE INDEX IF NOT EXISTS idx_users_token_expiry ON users(token_expiry)
    WHERE token_expiry < CURRENT_TIMESTAMP + INTERVAL '1 hour';
CREATE INDEX IF NOT EXISTS idx_users_last_summary ON users(last_summary_sent)
    WHERE last_summary_sent < CURRENT_DATE - INTERVAL '1 day';
CREATE INDEX IF NOT EXISTS idx_email_summaries_categories ON email_summaries USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_email_summaries_user_date ON email_summaries(user_id, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_processing_logs_user_created ON processing_logs(user_id, created_at DESC);
`;

async function runMigration() {
  try {
    console.log('🚀 Starting migration...');
    await pool.query(schema);
    console.log('✅ Migrations completed successfully');

    // Verify tables
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log('📊 Tables created:', result.rows.map(r => r.table_name).join(', '));

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
