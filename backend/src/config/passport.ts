// backend/src/config/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Pool } from 'pg';
import { encrypt } from '../services/crypto.service.js';

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

    const encryptedAccess = encrypt(accessToken);
    const encryptedRefresh = encrypt(refreshToken || '');
    const tokenExpiry = new Date(Date.now() + 3600 * 1000);

    const newUser = await pool.query(
      `INSERT INTO users (google_id, email, name, picture, access_token_encrypted, refresh_token_encrypted, token_expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [profile.id, profile.emails?.[0]?.value || null, profile.displayName || '', profile.photos?.[0]?.value || null, encryptedAccess, encryptedRefresh, tokenExpiry]
    );

    done(null, newUser.rows[0]);
  } catch (error) {
    done(error);
  }
}));

export default passport;
