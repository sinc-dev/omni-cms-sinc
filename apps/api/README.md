# Omni-CMS API

Hono-based backend API for Omni-CMS, deployed to Cloudflare Workers.

## Setup

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm run db:migrate

# Start development server
pnpm dev
```

## Development

The API runs on `http://localhost:8787` by default.

### Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm deploy` - Deploy to Cloudflare Workers
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run migrations locally
- `pnpm db:migrate:prod` - Run migrations in production
- `pnpm db:seed` - Seed the database
- `pnpm db:studio` - Open Drizzle Studio

## Project Structure

```
apps/api/
├── src/
│   ├── db/              # Database schemas and client
│   ├── lib/             # Backend libraries
│   │   ├── api/         # API utilities (auth, validation, etc.)
│   │   ├── auth/        # Authentication
│   │   ├── storage/     # R2 storage
│   │   └── ...
│   ├── routes/          # Hono route handlers
│   │   ├── admin/       # Admin API routes
│   │   └── public/      # Public API routes
│   ├── index.ts         # Main entry point
│   └── types.ts         # TypeScript types
├── drizzle/             # Database migrations
├── wrangler.toml        # Cloudflare Workers config
└── package.json
```

## Route Conversion Status

See `MONOREPO_MIGRATION.md` in the root for full migration status.

### Completed Routes
- ✅ `/api/admin/v1/organizations` (GET list, GET by ID)
- ✅ `/api/public/v1/:orgSlug/posts` (GET list, GET by slug)

### Remaining Routes
- 🚧 ~56 more routes to convert

## Environment Variables

Set in Cloudflare Workers dashboard or `wrangler.toml`:

- `R2_ACCOUNT_ID` - Cloudflare R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name (default: `omni-cms-media`)
- `R2_PUBLIC_URL` - Public URL for R2 assets (optional)
- `OPENAI_API_KEY` - OpenAI API key for AI features (optional)

## Deployment

```bash
# Deploy to Cloudflare Workers
pnpm deploy

# Or from root directory
pnpm deploy:api
```

The API will be deployed as a Cloudflare Worker and accessible at your Workers URL.
