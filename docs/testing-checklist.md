# Testing Checklist

## Local Testing
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Database migrations run successfully
- [ ] OAuth flow works end-to-end
- [ ] Manual summary generation works
- [ ] Cron jobs are registered

## Production Testing
- [ ] Railway deployment succeeds
- [ ] Vercel deployment succeeds
- [ ] OAuth callback works in production
- [ ] Health check endpoint responds
- [ ] Environment variables are set correctly
- [ ] Database is accessible from Railway

## Integration Testing
- [ ] User can login with Google
- [ ] User appears in database
- [ ] Manual summary generation works
- [ ] Summary appears in dashboard
- [ ] Logout works

## Success Criteria
- Working Gmail OAuth integration
- Automated email summarization
- Web dashboard for viewing summaries
- Deployed on Railway and Vercel
- Database with proper schema
- Token refresh mechanism
- API documentation
- Contribution guidelines
