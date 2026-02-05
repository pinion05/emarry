# Deployment Guide

## Railway (Backend)

1. Link repository:
   ```bash
   railway init
   railway up
   ```
   Set root directory to `backend`

2. Set environment variables in Railway dashboard:
   - DATABASE_URL (from PostgreSQL service)
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - GOOGLE_OAUTH_CALLBACK=https://your-app.railway.app/auth/google/callback
   - SESSION_SECRET (generate 64-char random)
   - ENCRYPTION_KEY (generate 64-char hex)
   - OPENROUTER_API_KEY
   - FRONTEND_URL=https://your-frontend.vercel.app

3. Deploy:
   ```bash
   railway deploy
   ```

## Vercel (Frontend)

1. Deploy:
   ```bash
   cd frontend
   vercel
   ```

2. Set environment variable:
   - NEXT_PUBLIC_API_URL=https://your-app.railway.app

3. Update Railway FRONTEND_URL with Vercel URL
