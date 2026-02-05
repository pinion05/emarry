# Contributing to emarry

## Development Setup

### Prerequisites
- Node.js 18+
- bun
- PostgreSQL 14+
- Google Cloud Project

### Backend Setup
```bash
cd backend
bun install
cp .env.example .env
bun run migrate
bun run dev
```

### Frontend Setup
```bash
cd frontend
bun install
cp .env.example .env.local
bun run dev
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

## Code Style
- Use TypeScript
- Follow ESLint rules
- Write meaningful commit messages
