# emarry API Documentation

## Base URL
```
https://your-app.railway.app
```

## Authentication
All API endpoints require session authentication via Google OAuth.

## Endpoints

### Authentication
- GET /auth/google - Initiate Google OAuth flow
- GET /auth/google/callback - OAuth callback
- GET /auth/me - Get current user info
- POST /auth/logout - Logout

### Summaries
- GET /api/summaries - Get all summaries for current user
- GET /api/summaries/:id - Get specific summary
- POST /api/summaries/manual - Manually trigger summary generation

### User
- GET /api/user/me - Get current user profile
- PUT /api/user/me - Update user settings

### Health
- GET /health - Health check endpoint
