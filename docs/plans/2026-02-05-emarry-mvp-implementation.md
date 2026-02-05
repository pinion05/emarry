# emarry MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gmail의 읽지 않은 이메일을 AI로 매일 아침 요약하여 웹 대시보드에서 확인하는 서비스 구축

**Architecture:**
- Single Railway service with Express.js backend + node-cron scheduler
- Next.js 14 frontend with shadcn/ui components
- PostgreSQL on Railway for data persistence
- Google OAuth for authentication (no separate signup)
- OpenRouter API with free NVIDIA model for email summarization

**Tech Stack:**
- Backend: Express.js, passport.js, node-cron, pg (PostgreSQL)
- Frontend: Next.js 14 (App Router), shadcn/ui, Tailwind CSS, TypeScript
- External APIs: Gmail API (OAuth 2.0), OpenRouter API
- Deployment: Railway
- Repository: pinion05/emarry (monorepo)

---

## Phase 1: Project Setup & Infrastructure

### Task 1: Create GitHub Repository

**Files:**
- N/A (GitHub operation)

**Step 1: Create repository using gh CLI**

```bash
gh repo create emarry --public --description "AI-powered email summarization service" --clone
```

Expected: Repository created and cloned to current directory

**Step 2: Initialize basic structure**

```bash
cd emarry
mkdir -p frontend backend docs/plans
touch README.md
```

**Step 3: Create initial README**

```markdown
# emarry

AI-powered email summarization service that delivers daily summaries of unread Gmail emails.

## Overview

emarry (Email + Marriage) connects to your Gmail account and uses AI to summarize unread emails every morning.

## Tech Stack

- **Frontend**: Next.js 14 + shadcn/ui
- **Backend**: Express.js + node-cron
- **Database**: PostgreSQL
- **Deployment**: Railway

## Development

See [docs/](./docs/) for detailed documentation.

## License

MIT
```

**Step 4: Commit initial setup**

```bash
git add .
git commit -m "chore: initialize repository structure"
git push -u origin main
```

---

### Task 2: Set Up PostgreSQL Database on Railway

**Files:**
- N/A (Railway operation)

**Step 1: Install Railway CLI**

```bash
bun install -g @railway/cli
```

Expected: Railway CLI installed successfully

**Step 2: Login to Railway**

```bash
railway login
```

Expected: Browser opens for authentication

**Step 3: Create Railway project**

```bash
railway init
```

Enter project name: `emarry`

**Step 4: Add PostgreSQL database**

```bash
railway add postgresql
```

Expected: Database service added to project

**Step 5: Get database URL**

```bash
railway variables
```

Copy `DATABASE_URL` for later use

---

### Task 3: Create Database Migration Scripts

**Files:**
- Create: `backend/migrations/001_initial_schema.sql`

**Step 1: Create migrations directory**

```bash
mkdir -p backend/migrations
```

**Step 2: Write initial schema**

```sql
-- backend/migrations/001_initial_schema.sql

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture TEXT,
    -- OAuth tokens (encrypted with AES-256-GCM)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expiry TIMESTAMP NOT NULL,
    -- Settings
    is_active BOOLEAN DEFAULT true,
    summary_enabled BOOLEAN DEFAULT true,
    preferred_summary_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
    email_notification BOOLEAN DEFAULT false,
    -- Metadata
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
```

**Step 3: Create migration runner script**

Create `backend/migrations/run.ts`:

```typescript
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
```

**Step 4: Commit migration files**

```bash
git add backend/migrations/
git commit -m "feat: add initial database schema and migration runner"
```

---

### Task 4: Run Initial Migration

**Step 1: Set DATABASE_URL environment variable**

```bash
export DATABASE_URL="your-railway-database-url"
```

**Step 2: Install dependencies**

```bash
cd backend
bun add pg @types/pg
```

**Step 3: Run migration**

```bash
bun run migrations/run.ts
```

Expected: "✅ Migrations completed successfully"

---

## Phase 2: Backend Authentication

### Task 5: Initialize Express.js Backend

**Files:**
- Create: `backend/src/index.ts`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`

**Step 1: Create package.json**

```json
{
  "name": "emarry-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "tsx migrations/run.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "express-session": "^1.17.3",
    "node-cron": "^3.0.3",
    "dotenv": "^16.3.1",
    "googleapis": "^128.0.0",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/passport": "^1.0.16",
    "@types/passport-google-oauth20": "^2.0.14",
    "@types/express-session": "^1.17.10",
    "@types/node-cron": "^3.0.11",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create basic Express server**

```typescript
// backend/src/index.ts
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes will be added here
// app.use('/auth', authRoutes);
// app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

**Step 4: Install dependencies**

```bash
cd backend
bun install
```

**Step 5: Test server startup**

```bash
bun run dev
```

Expected: "🚀 Server running on port 3001"

**Step 6: Commit Express setup**

```bash
git add backend/
git commit -m "feat: initialize Express.js server with basic configuration"
```

---

### Task 6: Implement Google OAuth

**Files:**
- Create: `backend/src/config/passport.ts`
- Create: `backend/src/routes/auth.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create passport configuration**

```typescript
// backend/src/config/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_OAUTH_CALLBACK
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (result.rows.length > 0) {
      return done(null, result.rows[0]);
    }

    const newUser = await pool.query(
      `INSERT INTO users (google_id, email, name, picture, access_token_encrypted, refresh_token_encrypted, token_expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0].value, accessToken, refreshToken, new Date(Date.now() + 3600 * 1000)]
    );

    done(null, newUser.rows[0]);
  } catch (error) {
    done(error);
  }
}));

export default passport;
```

**Step 2: Create auth routes**

```typescript
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
  req.logout(() => {
    res.json({ message: 'Logged out' });
  });
});

export default router;
```

**Step 3: Update main server file**

Add to `backend/src/index.ts` after middleware:

```typescript
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
```

**Step 4: Commit OAuth implementation**

```bash
git add backend/src/
git commit -m "feat: implement Google OAuth authentication"
```

---

## Phase 3: Core Services

### Task 7: Implement Crypto Service for Token Encryption

**Files:**
- Create: `backend/src/services/crypto.service.ts`

**Step 1: Write crypto service**

```typescript
// backend/src/services/crypto.service.ts
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Step 2: Commit crypto service**

```bash
git add backend/src/services/crypto.service.ts
git commit -m "feat: add token encryption/decryption service"
```

---

### Task 8: Implement Gmail Service

**Files:**
- Create: `backend/src/services/gmail.service.ts`

**Step 1: Write Gmail service**

```typescript
// backend/src/services/gmail.service.ts
import { google } from 'googleapis';
import { decrypt } from './crypto.service.js';

interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: Date;
}

export async function getUnreadEmails(
  accessTokenEncrypted: string,
  maxResults: number = 50
): Promise<Email[]> {
  const accessToken = decrypt(accessTokenEncrypted);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    // Get list of unread messages
    const messagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults
    });

    if (!messagesResponse.data.messages) {
      return [];
    }

    // Fetch details for each message
    const emails: Email[] = [];

    for (const message of messagesResponse.data.messages) {
      const messageResponse = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });

      const payload = messageResponse.data.payload!;
      const headers = payload.headers || [];

      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = new Date(parseInt(messageResponse.data.internalDate || '0'));

      // Extract plain text body
      let body = '';
      if (payload.body?.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } else if (payload.parts) {
        const textPart = payload.parts.find(part =>
          part.mimeType === 'text/plain'
        );
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }

      emails.push({
        id: message.id!,
        threadId: message.threadId!,
        subject,
        from,
        snippet: messageResponse.data.snippet || '',
        body: body.substring(0, 5000), // Limit body length
        date
      });
    }

    return emails;
  } catch (error) {
    console.error('Gmail API error:', error);
    throw error;
  }
}
```

**Step 2: Commit Gmail service**

```bash
git add backend/src/services/gmail.service.ts
git commit -m "feat: add Gmail API service for fetching unread emails"
```

---

### Task 9: Implement OpenRouter Service

**Files:**
- Create: `backend/src/services/openrouter.service.ts`

**Step 1: Write OpenRouter service**

```typescript
// backend/src/services/openrouter.service.ts
interface EmailData {
  subject: string;
  from: string;
  snippet: string;
}

export async function summarizeEmails(emails: EmailData[]): Promise<string> {
  const prompt = `다음 이메일들을 3문장 이내로 요약해주세요. 중요한 내용 위주로 정리해주세요:\n\n${
    emails.map((e, i) =>
      `${i + 1}. ${e.subject} (${e.from})\n${e.snippet}`
    ).join('\n\n')
  }`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://emarry.app',
        'X-Title': 'emarry'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter error:', error);
    throw error;
  }
}
```

**Step 2: Commit OpenRouter service**

```bash
git add backend/src/services/openrouter.service.ts
git commit -m "feat: add OpenRouter service for AI email summarization"
```

---

## Phase 4: Cron Jobs

### Task 10: Implement Email Summary Cron Job

**Files:**
- Create: `backend/src/cron/email-summary.job.ts`

**Step 1: Write email summary cron job**

```typescript
// backend/src/cron/email-summary.job.ts
import cron from 'node-cron';
import { Pool } from 'pg';
import { getUnreadEmails } from '../services/gmail.service.js';
import { summarizeEmails } from '../services/openrouter.service.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function generateSummaryForUser(userId: number) {
  const client = await pool.connect();

  try {
    // Get user data
    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    // Check if summary already sent today
    const existingSummary = await client.query(
      `SELECT id FROM email_summaries
       WHERE user_id = $1 AND summary_date = CURRENT_DATE`,
      [userId]
    );

    if (existingSummary.rows.length > 0) {
      console.log(`Summary already sent for user ${userId} today`);
      return;
    }

    // Fetch unread emails
    const emails = await getUnreadEmails(user.access_token_encrypted);

    if (emails.length === 0) {
      console.log(`No unread emails for user ${userId}`);
      return;
    }

    // Generate summary
    const summaryText = await summarizeEmails(
      emails.map(e => ({
        subject: e.subject,
        from: e.from,
        snippet: e.snippet
      }))
    );

    // Save summary
    await client.query(
      `INSERT INTO email_summaries (user_id, summary_date, email_count, summary_text, status, sent_at)
       VALUES ($1, CURRENT_DATE, $2, $3, 'completed', NOW())`,
      [userId, emails.length, summaryText]
    );

    // Update last_summary_sent
    await client.query(
      'UPDATE users SET last_summary_sent = CURRENT_DATE WHERE id = $1',
      [userId]
    );

    console.log(`✅ Summary generated for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error generating summary for user ${userId}:`, error);

    // Log error
    await client.query(
      `INSERT INTO processing_logs (user_id, action, status, error_message)
       VALUES ($1, 'email_summary', 'failed', $2)`,
      [userId, error.message]
    );
  } finally {
    client.release();
  }
}

export async function generateAllSummaries() {
  try {
    // Get all active users with summary enabled
    const result = await pool.query(
      `SELECT id FROM users
       WHERE is_active = true
       AND summary_enabled = true
       AND token_expiry > NOW()`
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

// Schedule cron job for 9:00 AM daily
export const emailSummaryJob = cron.schedule('0 9 * * *', generateAllSummaries, {
  timezone: 'Asia/Seoul'
});
```

**Step 2: Commit cron job**

```bash
git add backend/src/cron/email-summary.job.ts
git commit -m "feat: add daily email summary cron job"
```

---

### Task 11: Implement Token Refresh Cron Job

**Files:**
- Create: `backend/src/cron/token-refresh.job.ts`

**Step 1: Write token refresh cron job**

```typescript
// backend/src/cron/token-refresh.job.ts
import cron from 'node-cron';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function refreshUserToken(userId: number) {
  const client = await pool.connect();

  try {
    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

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

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();

    await client.query(
      `UPDATE users
       SET access_token_encrypted = $1,
           token_expiry = NOW() + INTERVAL '1 hour'
       WHERE id = $2`,
      [data.access_token, userId]
    );

    await client.query(
      `INSERT INTO processing_logs (user_id, action, status)
       VALUES ($1, 'token_refresh', 'success')`,
      [userId]
    );

    console.log(`✅ Token refreshed for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error refreshing token for user ${userId}:`, error);

    await client.query(
      `INSERT INTO processing_logs (user_id, action, status, error_message)
       VALUES ($1, 'token_refresh', 'failed', $2)`,
      [userId, error.message]
    );
  } finally {
    client.release();
  }
}

export async function refreshAllTokens() {
  try {
    const result = await pool.query(
      `SELECT id FROM users
       WHERE token_expiry < NOW() + INTERVAL '1 hour'`
    );

    console.log(`Refreshing tokens for ${result.rows.length} users`);

    for (const row of result.rows) {
      await refreshUserToken(row.id);
    }

    console.log('✅ All tokens refreshed');
  } catch (error) {
    console.error('❌ Error in refreshAllTokens:', error);
  }
}

// Schedule cron job to run every hour
export const tokenRefreshJob = cron.schedule('0 * * * *', refreshAllTokens, {
  timezone: 'Asia/Seoul'
});
```

**Step 2: Commit token refresh job**

```bash
git add backend/src/cron/token-refresh.job.ts
git commit -m "feat: add hourly token refresh cron job"
```

---

### Task 12: Register Cron Jobs in Main Server

**Files:**
- Modify: `backend/src/index.ts`

**Step 1: Import and start cron jobs**

Add to top of `backend/src/index.ts`:

```typescript
import { emailSummaryJob } from './cron/email-summary.job.js';
import { tokenRefreshJob } from './cron/token-refresh.job.js';

// Cron jobs are started automatically on import
console.log('✅ Cron jobs registered');
```

**Step 2: Commit cron job registration**

```bash
git add backend/src/index.ts
git commit -m "feat: register cron jobs in main server"
```

---

## Phase 5: API Routes

### Task 13: Implement Summary API Routes

**Files:**
- Create: `backend/src/routes/summary.ts`
- Modify: `backend/src/index.ts`

**Step 1: Write summary routes**

```typescript
// backend/src/routes/summary.ts
import express from 'express';
import { Pool } from 'pg';
import { generateSummaryForUser } from '../cron/email-summary.job.js';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware to check authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all summaries for current user
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_summaries
       WHERE user_id = $1
       ORDER BY summary_date DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific summary
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM email_summaries
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually trigger summary generation (for testing)
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
```

**Step 2: Register summary routes in main server**

Add to `backend/src/index.ts`:

```typescript
import summaryRoutes from './routes/summary.js';

app.use('/api/summaries', summaryRoutes);
```

**Step 3: Commit summary API**

```bash
git add backend/src/
git commit -m "feat: add summary API routes"
```

---

### Task 14: Implement User API Routes

**Files:**
- Create: `backend/src/routes/user.ts`
- Modify: `backend/src/index.ts`

**Step 1: Write user routes**

```typescript
// backend/src/routes/user.ts
import express from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get current user profile
router.get('/me', requireAuth, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, picture, is_active, summary_enabled, preferred_summary_time, timezone FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/me', requireAuth, async (req: any, res) => {
  try {
    const { summary_enabled, preferred_summary_time, timezone } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET summary_enabled = COALESCE($1, summary_enabled),
           preferred_summary_time = COALESCE($2, preferred_summary_time),
           timezone = COALESCE($3, timezone),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, name, picture, summary_enabled, preferred_summary_time, timezone`,
      [summary_enabled, preferred_summary_time, timezone, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**Step 2: Register user routes in main server**

Add to `backend/src/index.ts`:

```typescript
import userRoutes from './routes/user.js';

app.use('/api/user', userRoutes);
```

**Step 3: Commit user API**

```bash
git add backend/src/
git commit -m "feat: add user settings API routes"
```

---

## Phase 6: Frontend Development

### Task 15: Initialize Next.js Frontend

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.ts`

**Step 1: Create Next.js project**

```bash
cd frontend
bun create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

**Step 2: Install additional dependencies**

```bash
cd frontend
bun add @radix-ui/react-dialog @radix-ui/react-scroll-area
bun add -D @types/node
```

**Step 3: Initialize shadcn/ui**

```bash
bunx shadcn-ui@latest init -y
```

**Step 4: Add required shadcn components**

```bash
bunx shadcn-ui@latest add button card avatar badge scroll-area
```

**Step 5: Test Next.js startup**

```bash
bun run dev
```

Expected: Next.js server running on port 3000

**Step 6: Commit frontend setup**

```bash
git add frontend/
git commit -m "feat: initialize Next.js frontend with shadcn/ui"
```

---

### Task 16: Create Homepage

**Files:**
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/Header.tsx`

**Step 1: Write homepage**

```typescript
// frontend/src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">emarry</h1>
          <Link href="http://localhost:3001/auth/google">
            <Button>시작하기</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            이메일 과부하에서 해방됩니다
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Gmail의 읽지 않은 이메일을 AI가 매일 아침 요약해드립니다.
            <br />
            중요한 정보만 빠르게 파악하세요.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-2">자동 수집</h3>
              <p className="text-gray-600">
                읽지 않은 이메일을 자동으로 수집합니다
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI 요약</h3>
              <p className="text-gray-600">
                LLM으로 중요한 내용만 요약합니다
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-2">매일 아침</h3>
              <p className="text-gray-600">
                매일 정해진 시간에 요약을 받습니다
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link href="http://localhost:3001/auth/google">
              <Button size="lg" className="text-lg">
                Google로 무료 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Step 2: Commit homepage**

```bash
git add frontend/src/
git commit -m "feat: add homepage with hero section and feature cards"
```

---

### Task 17: Create Dashboard Page

**Files:**
- Create: `frontend/src/app/dashboard/page.tsx`
- Create: `frontend/src/components/SummaryCard.tsx`
- Create: `frontend/src/components/SummaryList.tsx`
- Create: `frontend/src/lib/api.ts`

**Step 1: Write API client**

```typescript
// frontend/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchSummaries() {
  const response = await fetch(`${API_BASE}/api/summaries`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch summaries');
  }

  return response.json();
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE}/api/user/me`, {
    credentials: 'include'
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
```

**Step 2: Write summary card component**

```typescript
// frontend/src/components/SummaryCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SummaryCardProps {
  summary: {
    id: number;
    summary_date: string;
    email_count: number;
    summary_text: string;
    status: string;
  };
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {new Date(summary.summary_date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </CardTitle>
          <Badge variant={summary.status === 'completed' ? 'default' : 'secondary'}>
            {summary.email_count}개의 이메일
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{summary.summary_text}</p>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Write summary list component**

```typescript
// frontend/src/components/SummaryList.tsx
import { SummaryCard } from './SummaryCard';

interface SummaryListProps {
  summaries: any[];
}

export function SummaryList({ summaries }: SummaryListProps) {
  if (summaries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">아직 요약이 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">
          첫 요약은 내일 아침 9시에 생성됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary) => (
        <SummaryCard key={summary.id} summary={summary} />
      ))}
    </div>
  );
}
```

**Step 4: Write dashboard page**

```typescript
// frontend/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { SummaryList } from '@/components/SummaryList';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summariesData, userData] = await Promise.all([
          fetchSummaries(),
          fetchCurrentUser()
        ]);

        setSummaries(summariesData);
        setUser(userData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => window.location.href = 'http://localhost:3001/auth/google'}>
            Google로 로그인
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">emarry</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = 'http://localhost:3001/api/logout'}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">이메일 요약</h2>
          <p className="text-gray-600">
            최근 {summaries.length}일간의 요약입니다
          </p>
        </div>

        <SummaryList summaries={summaries} />
      </main>
    </div>
  );
}
```

**Step 5: Commit dashboard**

```bash
git add frontend/src/
git commit -m "feat: add dashboard page with summary list"
```

---

## Phase 7: Deployment

### Task 18: Configure Railway Deployment

**Files:**
- Create: `railway.toml`
- Create: `.env.example`

**Step 1: Create railway.toml**

```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
```

**Step 2: Create environment variables template**

```bash
# .env.example
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_CALLBACK=
SESSION_SECRET=
ENCRYPTION_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
PORT=3001
FRONTEND_URL=
```

**Step 3: Update package.json scripts**

Add to `backend/package.json`:

```json
{
  "scripts": {
    "railway": "bun run migrations/run.ts && bun start"
  }
}
```

**Step 4: Commit deployment config**

```bash
git add railway.toml .env.example backend/package.json
git commit -m "chore: add Railway deployment configuration"
```

---

### Task 19: Deploy to Railway

**Step 1: Link repository to Railway**

```bash
railway init
```

Select existing `emarry` project

**Step 2: Add backend service**

```bash
railway up
```

Set root directory to `backend`

**Step 3: Configure environment variables**

```bash
railway variables set DATABASE_URL="your-database-url"
railway variables set GOOGLE_CLIENT_ID="your-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-client-secret"
railway variables set GOOGLE_OAUTH_CALLBACK="https://your-app.railway.app/auth/google/callback"
railway variables set SESSION_SECRET="generate-64-char-random-string"
railway variables set ENCRYPTION_KEY="generate-64-char-hex-key"
railway variables set OPENROUTER_API_KEY="sk-or-v1-..."
railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
```

**Step 4: Deploy backend**

```bash
railway deploy
```

**Step 5: Verify deployment**

```bash
# Get deployed URL
railway domain

# Check health
curl https://your-app.railway.app/health
```

**Step 6: Update OAuth callback URL**

Update Google Cloud Console OAuth consent screen with the Railway URL

**Step 7: Commit deployment updates**

```bash
git add .
git commit -m "chore: configure Railway deployment settings"
git push
```

---

### Task 20: Deploy Frontend to Vercel

**Step 1: Install Vercel CLI**

```bash
bun install -g vercel
```

**Step 2: Deploy frontend**

```bash
cd frontend
vercel
```

**Step 3: Configure environment variables**

Set `NEXT_PUBLIC_API_URL` to Railway backend URL

**Step 4: Update Railway FRONTEND_URL**

```bash
railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
```

**Step 5: Test end-to-end**

1. Visit frontend URL
2. Click "Google로 시작하기"
3. Authorize with Google
4. Verify redirect to dashboard
5. Check database for user record

---

## Phase 8: Testing & Documentation

### Task 21: Write API Documentation

**Files:**
- Create: `docs/api.md`

**Step 1: Write API documentation**

```markdown
# emarry API Documentation

## Base URL

```
https://your-app.railway.app
```

## Authentication

All API endpoints require session authentication. Obtain session by logging in with Google OAuth.

## Endpoints

### Authentication

#### GET /auth/google
Initiate Google OAuth flow

#### GET /auth/google/callback
OAuth callback endpoint

#### GET /api/me
Get current user info

#### POST /api/logout
Logout current user

### Summaries

#### GET /api/summaries
Get all summaries for current user

Response:
```json
[
  {
    "id": 1,
    "user_id": 1,
    "summary_date": "2026-02-05",
    "email_count": 15,
    "summary_text": "...",
    "status": "completed",
    "created_at": "2026-02-05T09:00:00Z"
  }
]
```

#### GET /api/summaries/:id
Get specific summary

#### POST /api/summaries/manual
Manually trigger summary generation (for testing)

### User

#### GET /api/user/me
Get current user profile

#### PUT /api/user/me
Update user settings

Body:
```json
{
  "summary_enabled": true,
  "preferred_summary_time": "09:00:00",
  "timezone": "Asia/Seoul"
}
```

### Health

#### GET /health
Health check endpoint
```

**Step 2: Commit API docs**

```bash
git add docs/api.md
git commit -m "docs: add API documentation"
```

---

### Task 22: Create CONTRIBUTING Guide

**Files:**
- Create: `CONTRIBUTING.md`

**Step 1: Write contributing guide**

```markdown
# Contributing to emarry

## Development Setup

### Prerequisites

- Node.js 18+
- bun
- PostgreSQL 14+
- Google Cloud Project (for OAuth)

### Backend Setup

```bash
cd backend
bun install
cp .env.example .env
# Edit .env with your credentials
bun run migrate
bun run dev
```

### Frontend Setup

```bash
cd frontend
bun install
cp .env.example .env.local
# Edit .env.local with your API URL
bun run dev
```

## Running Tests

```bash
# Backend
cd backend
bun test

# Frontend
cd frontend
bun test
```

## Project Structure

```
emarry/
├── backend/          # Express.js backend
│   ├── src/
│   │   ├── config/   # Passport, database config
│   │   ├── cron/     # Scheduled jobs
│   │   ├── routes/   # API endpoints
│   │   └── services/ # Business logic
│   └── migrations/   # Database migrations
├── frontend/         # Next.js frontend
│   └── src/
│       ├── app/      # App router pages
│       └── components/
└── docs/             # Documentation
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
```

**Step 2: Commit contributing guide**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add contributing guide"
```

---

### Task 23: Final Testing Checklist

**Step 1: Local testing**

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Database migrations run successfully
- [ ] OAuth flow works end-to-end
- [ ] Manual summary generation works
- [ ] Cron jobs are registered

**Step 2: Production testing**

- [ ] Railway deployment succeeds
- [ ] Vercel deployment succeeds
- [ ] OAuth callback works in production
- [ ] Health check endpoint responds
- [ ] Environment variables are set correctly
- [ ] Database is accessible from Railway

**Step 3: Integration testing**

- [ ] User can login with Google
- [ ] User appears in database
- [ ] Manual summary generation works
- [ ] Summary appears in dashboard
- [ ] Logout works

**Step 4: Create final commit**

```bash
git add .
git commit -m "chore: complete MVP implementation"
git tag v1.0.0
git push --tags
```

---

## Success Criteria

After completing this plan, you should have:

✅ Working Gmail OAuth integration
✅ Automated email summarization (via cron)
✅ Web dashboard for viewing summaries
✅ Deployed on Railway (backend) and Vercel (frontend)
✅ Database with proper schema and indexes
✅ Token refresh mechanism
✅ API documentation
✅ Contribution guidelines

## Next Steps (Post-MVP)

1. Add email notifications (SMTP)
2. Support multiple email providers
3. Add payment integration (Stripe)
4. Implement PDF/image OCR
5. Mobile app development
6. Analytics dashboard

---

**Implementation estimated time**: 20-30 hours
**Difficulty**: Intermediate
**Priority**: High
