# Railway PostgreSQL Setup Guide

## Project Information
- **Project Name:** emarry
- **Project ID:** 80c63ce5-cf9f-4ef0-8a8d-4ea601bc133a
- **Dashboard URL:** https://railway.com/project/80c63ce5-cf9f-4ef0-8a8d-4ea601bc133a

## Setup Status
- ✅ Railway CLI installed (v4.29.0)
- ✅ Railway project created
- ✅ PostgreSQL database added (Postgres-wd5w)

## Next Steps

### 1. Add PostgreSQL via Railway Dashboard
Visit the dashboard and add PostgreSQL:
```
https://railway.com/project/80c63ce5-cf9f-4ef0-8a8d-4ea601bc133a
```

Steps:
1. Click "New Service"
2. Select "Database"
3. Click "Add PostgreSQL"

### 2. Get DATABASE_URL
Once PostgreSQL is added:
1. Click on the PostgreSQL service
2. Go to "Variables" tab
3. Copy the `DATABASE_URL`

Format:
```
postgresql://postgres:password@host.railway.app:5432/railway
```

### 3. Set Environment Variables
Add to your project's `.env` file:
```env
DATABASE_URL=postgresql://postgres:password@host.railway.app:5432/railway
```

## Railway CLI Commands

```bash
# Link service
railway service link

# View variables
railway variables list

# Set variable
railway variables set DATABASE_URL="..."

# View status
railway status
```

## Reference
- Railway CLI version: 4.29.0
- Project workspace: ParkMyeongCheol_박명철's Projects
