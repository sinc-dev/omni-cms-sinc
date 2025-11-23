# Omni-CMS

A headless content management system built on Cloudflare infrastructure with Next.js. This is a monorepo containing the web application and comprehensive documentation.

## Overview

Omni-CMS is a multi-tenant headless CMS designed to manage content for multiple websites from a single platform. Built on Cloudflare's infrastructure, it provides a scalable, performant, and globally distributed solution for content management.

## Repository Structure

```
omni-cms/
├── docs/              # Comprehensive project documentation
├── web/               # Next.js web application
│   ├── src/          # Application source code
│   ├── public/       # Static assets
│   └── ...
├── package.json      # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml
└── README.md         # This file
```

## Key Features

- **Multi-Tenancy**: Manage multiple websites from a single platform
- **Custom Content Types**: Define flexible content structures
- **Rich Text Editor**: TipTap-based editor with full formatting
- **Media Management**: Cloudflare R2 storage integration
- **Role-Based Access Control**: Granular permissions system
- **Cloudflare Infrastructure**: D1 database, R2 storage, Access authentication
- **Public & Admin APIs**: RESTful endpoints for content management

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Cloudflare D1 (SQLite), Drizzle ORM
- **Auth**: Cloudflare Access with JWT validation
- **Storage**: Cloudflare R2
- **UI**: shadcn/ui components
- **Package Manager**: pnpm (workspace)

## Getting Started

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **pnpm**: Install with `npm install -g pnpm`

### Setup

1. **Clone and Install**
   ```bash
   pnpm install
   ```

2. **Navigate to Web Directory**
   ```bash
   cd web
   ```

3. **Create Cloudflare D1 Database**
   ```bash
   wrangler d1 create omni-cms
   ```
   Copy the database ID and update `web/wrangler.toml`

4. **Create Cloudflare R2 Bucket**
   ```bash
   wrangler r2 bucket create omni-cms-media
   ```

5. **Configure Environment Variables**
   Copy `web/env.example` to `web/.env.local` and fill in your Cloudflare credentials:
   ```bash
   cd web
   cp env.example .env.local
   ```

6. **Generate and Run Migrations**
   ```bash
   cd web
   pnpm db:generate
   pnpm db:migrate
   ```

7. **Seed Default Roles**
   ```bash
   cd web
   pnpm db:seed
   ```
   Copy the generated SQL and run it with:
   ```bash
   wrangler d1 execute omni-cms --local --command="<paste SQL>"
   ```

8. **Start Development Server**
   ```bash
   # From root directory
   pnpm dev
   
   # Or from web directory
   cd web
   pnpm dev
   ```

## Available Scripts

From the root directory:

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linter

See `web/README.md` for additional web-specific scripts and database commands.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [01-project-overview.md](docs/01-project-overview.md) - Project introduction and overview
- [02-database-schema.md](docs/02-database-schema.md) - Database structure and relationships
- [03-api-endpoints.md](docs/03-api-endpoints.md) - API documentation
- [04-authentication-permissions.md](docs/04-authentication-permissions.md) - Auth and RBAC system
- [05-implementation-roadmap.md](docs/05-implementation-roadmap.md) - Development roadmap
- [06-technology-stack.md](docs/06-technology-stack.md) - Technology choices and rationale
- [07-public-api-guide.md](docs/07-public-api-guide.md) - Public API usage guide
- [08-deployment-guide.md](docs/08-deployment-guide.md) - Deployment instructions
- [09-user-manual.md](docs/09-user-manual.md) - User guide
- [10-troubleshooting.md](docs/10-troubleshooting.md) - Common issues and solutions

For detailed setup and development instructions, see [web/README.md](web/README.md).

## Project Status

✅ **Phase 1**: Project Setup & Infrastructure (Complete)
✅ **Phase 2**: Core Database & Authentication (Complete)
✅ **Phase 3**: Admin API Development (Complete)
✅ **Phase 4**: Media Storage & Management (Complete)
✅ **Phase 5**: CMS Admin Panel UI (Complete)
✅ **Phase 6**: Public API & Integration (Complete)
✅ **Phase 7**: Testing & Refinement (Complete)
✅ **Phase 8**: Deployment & Documentation (Complete)

## License

MIT

