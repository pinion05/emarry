# emarry

AI-powered email summarization service that delivers daily summaries of unread Gmail emails.

## Overview

emarry (Email + Marriage) connects to your Gmail account and uses AI to summarize unread emails every morning.

## Tech Stack

- **Frontend**: Next.js 14 + shadcn/ui
- **Backend**: Express.js + node-cron
- **Database**: PostgreSQL
- **Deployment**: Railway (backend) + Vercel (frontend)

## Quick Start

### Prerequisites
- Node.js 18+
- bun
- Google Cloud Project with OAuth credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pinion05/emarry.git
   cd emarry
   ```

2. Set up backend:
   ```bash
   cd backend
   bun install
   cp .env.example .env
   # Edit .env with your credentials
   bun run migrate
   bun run dev
   ```

3. Set up frontend:
   ```bash
   cd frontend
   bun install
   cp .env.example .env.local
   bun run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

See [docs/deployment.md](./docs/deployment.md) for detailed deployment instructions.

## Documentation

- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Testing Checklist](./docs/testing-checklist.md)
- [Contributing Guide](./CONTRIBUTING.md)

## License

MIT
