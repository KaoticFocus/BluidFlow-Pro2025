# BuildFlow Pro

AI-powered construction management platform with review-first workflows, immutable audit trails, and enterprise-grade security.

## 🏗️ Architecture

This is a **monorepo** built with:

- **pnpm** - Fast, disk space efficient package manager
- **Turborepo** - High-performance build system for monorepos
- **TypeScript** - End-to-end type safety

### Apps

| App | Description | Port |
|-----|-------------|------|
| `apps/web` | Next.js 14 web application | 3000 |
| `apps/api` | Hono API server | 3001 |

### Packages

| Package | Description |
|---------|-------------|
| `packages/db` | Prisma schema and database client |
| `packages/shared` | Shared types, Zod schemas, and utilities |
| `packages/events` | Event schemas for the event bus |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis (for BullMQ queues)

### Setup

1. **Clone and install dependencies**

```bash
pnpm install
```

2. **Set up environment variables**

```bash
cp config/env.example .env.local
# Edit .env.local with your values
```

3. **Set up the database**

```bash
# Generate Prisma client
pnpm --filter @buildflow/db db:generate

# Push schema to database
pnpm --filter @buildflow/db db:push

# Seed default roles and permissions
pnpm --filter @buildflow/db db:seed
```

4. **Start development servers**

```bash
pnpm dev
```

This starts:
- Web app at http://localhost:3000
- API at http://localhost:3001

## 📁 Project Structure

```
.
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/            # App router pages
│   │   └── components/     # React components
│   └── api/                # Hono API backend
│       ├── src/
│       │   ├── routes/     # API route handlers
│       │   ├── middleware/ # Auth, tenant isolation
│       │   └── lib/        # Utilities
│       └── package.json
├── packages/
│   ├── db/                 # Prisma schema
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   ├── shared/             # Shared types & schemas
│   │   └── src/
│   │       ├── auth.ts
│   │       ├── tenant.ts
│   │       ├── rbac.ts
│   │       ├── ai-action.ts
│   │       └── consent.ts
│   └── events/             # Event schemas
│       └── src/
│           └── foundation.ts
├── .codespring/
│   └── PRDs/               # Product Requirements Documents
├── config/
│   └── env.example
├── turbo.json
└── pnpm-workspace.yaml
```

## 🎯 Modules

### Foundation Layer

- **Auth + Tenant + RBAC** - Multi-tenant authentication with role-based access control
- **Event Bus + Outbox** - Reliable event publishing with transactional outbox pattern
- **AIActionLog** - Immutable audit trail for all AI actions with review-first workflows
- **Consent Management** - GDPR-compliant consent capture and tracking

### Feature Modules

- **TaskFlow** - Task management with voice/photo/text input and AI-powered daily plans
- **MeetingFlow** - Meeting recording, transcription (Whisper), and AI summaries
- **ScheduleFlow** - Baseline schedule generation with constraint tracking
- **TimeClockFlow** - Mobile-first timeclock with anomaly detection
- **CloserFlow** - Lead management with AI-assisted discovery and follow-ups
- **Document Intelligence** - OCR, classification, and structured data extraction

## 🔐 Security

- **Review-First AI**: All AI outputs require human approval before external side effects
- **Tenant Isolation**: Every query is scoped by `tenant_id`
- **Immutable Audit**: AI actions are append-only with hash chains
- **PII Redaction**: Sensitive data is redacted before AI processing
- **Consent Tracking**: All data processing requires explicit consent

## 🛠️ Development

### Commands

```bash
# Install dependencies
pnpm install

# Start all dev servers
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Type check
pnpm typecheck

# Database commands
pnpm --filter @buildflow/db db:generate  # Generate Prisma client
pnpm --filter @buildflow/db db:push      # Push schema to DB
pnpm --filter @buildflow/db db:migrate   # Run migrations
pnpm --filter @buildflow/db db:seed      # Seed roles/permissions
pnpm --filter @buildflow/db db:studio    # Open Prisma Studio
```

### Adding a New Package

```bash
mkdir packages/new-package
cd packages/new-package
pnpm init
```

### Environment Variables

See `config/env.example` for all required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `REDIS_URL` - Redis connection for BullMQ
- `R2_*` - Cloudflare R2 storage credentials
- `RESEND_API_KEY` - Email sending
- `TWILIO_*` - SMS notifications

## 📚 PRDs

Product Requirements Documents are stored in `.codespring/PRDs/` and synced with CodeSpring. Each module has:

- Frontend PRD - UI/UX requirements
- Backend PRD - API and business logic
- Database PRD - Schema and data model

## 📄 License

Proprietary - All rights reserved
