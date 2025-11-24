# Omni-CMS

A headless content management system built on Cloudflare infrastructure with Next.js.

## Features

- **Multi-Tenancy**: Manage multiple websites from a single platform
- **Custom Content Types**: Define flexible content structures
- **Rich Text Editor**: TipTap-based editor (coming soon)
- **Media Management**: Cloudflare R2 storage integration
- **Role-Based Access Control**: Granular permissions system
- **Cloudflare Infrastructure**: D1 database, R2 storage, Access authentication

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Cloudflare D1 (SQLite), Drizzle ORM
- **Auth**: Cloudflare Access with JWT validation
- **Storage**: Cloudflare R2
- **UI**: shadcn/ui components

## Project Structure

```
web/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── db/              # Database schemas
│   │   └── schema/      # Drizzle schemas
│   ├── lib/             # Utilities
│   │   ├── auth/        # Authentication utilities
│   │   └── db/          # Database utilities
│   └── types/           # TypeScript types
├── drizzle/             # Database migrations
├── drizzle.config.ts    # Drizzle configuration
├── wrangler.toml        # Cloudflare configuration
└── package.json
```

## Getting Started

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **pnpm**: Install with `npm install -g pnpm`

### Setup

1. **Clone and Install**
   ```bash
   cd web
   pnpm install
   ```

2. **Create Cloudflare D1 Database**
   ```bash
   wrangler d1 create omni-cms
   ```
   Copy the database ID and update `wrangler.toml`

3. **Create Cloudflare R2 Bucket**
   ```bash
   wrangler r2 bucket create omni-cms-media
   ```

4. **Configure Environment Variables**
   Copy `env.example` to `.env.local` and fill in your Cloudflare credentials:
   ```bash
   cp env.example .env.local
   ```

5. **Generate and Run Migrations**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

6. **Seed Default Roles**
   ```bash
   pnpm db:seed
   ```
   Copy the generated SQL and run it with:
   ```bash
   wrangler d1 execute omni-cms --local --command="<paste SQL>"
   ```

7. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Database Scripts

- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:migrate` - Apply migrations to local D1 database
- `pnpm db:migrate:prod` - Apply migrations to production D1 database
- `pnpm db:seed` - Generate SQL for seeding default roles
- `pnpm db:studio` - Open Drizzle Studio to browse database

## Database Schema

The database includes the following tables:

- **organizations** - Multi-tenant organizations
- **users** - Global user accounts
- **roles** - RBAC roles with permissions
- **users_organizations** - User-organization-role relationships
- **post_types** - Custom content type definitions
- **custom_fields** - Reusable field definitions
- **posts** - Content instances
- **post_field_values** - Custom field values for posts
- **post_relationships** - Relationships between posts
- **taxonomies** - Taxonomy definitions (categories, tags)
- **taxonomy_terms** - Taxonomy terms
- **post_taxonomies** - Post-taxonomy relationships
- **media** - File metadata for R2 storage

## Authentication

The CMS uses **Cloudflare Access** for authentication:

1. Configure Cloudflare Access for your domain
2. Set up identity providers (Google, GitHub, Email OTP, etc.)
3. Add `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` to `.env.local`
4. Users are auto-provisioned on first login

## Permissions

The system implements RBAC with the following default roles:

- **super_admin** - Full system access
- **org_admin** - Full access within organization(s)
- **editor** - Create, edit, and publish content
- **author** - Create and edit own content
- **viewer** - Read-only access

Permissions follow the format `resource:action` (e.g., `posts:create`, `media:upload`).

## Development Status

✅ **Phase 1**: Project Setup & Infrastructure (Complete)
✅ **Phase 2**: Core Database & Authentication (Complete)
✅ **Phase 3**: Admin API Development (Complete)
✅ **Phase 4**: Media Storage & Management (Complete)
✅ **Phase 5**: CMS Admin Panel UI (Complete)
✅ **Phase 6**: Public API & Integration (Complete)
✅ **Phase 7**: Testing & Refinement (Complete)
✅ **Phase 8**: Deployment & Documentation (Complete)

## Documentation

See the `docs/` directory for detailed documentation:

- [01-project-overview.md](../docs/01-project-overview.md)
- [02-database-schema.md](../docs/02-database-schema.md)
- [03-api-endpoints.md](../docs/03-api-endpoints.md)
- [04-authentication-permissions.md](../docs/04-authentication-permissions.md)
- [05-implementation-roadmap.md](../docs/05-implementation-roadmap.md)
- [06-technology-stack.md](../docs/06-technology-stack.md)
- [07-public-api-guide.md](../docs/07-public-api-guide.md)
- [08-deployment-guide.md](../docs/08-deployment-guide.md)
- [09-user-manual.md](../docs/09-user-manual.md)
- [10-troubleshooting.md](../docs/10-troubleshooting.md)

## License

MIT
