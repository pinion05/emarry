# emarry

AI-powered email summarization service that delivers daily summaries of unread Gmail emails.

## Overview

emarry (Email + Marriage) connects to your Gmail account and uses AI to summarize unread emails every morning.

## Tech Stack

- **Frontend**: Next.js 14 + shadcn/ui
- **Backend**: Express.js + node-cron
- **Database**: PostgreSQL
- **Deployment**: Railway (full-stack)

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

2. Install dependencies (root directory):
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. Run database migration:
   ```bash
   bun run migrate
   ```

5. Start development server:
   ```bash
   bun run dev
   ```

6. Access the application:
   - App: http://localhost:3000
   - API: http://localhost:3001

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
