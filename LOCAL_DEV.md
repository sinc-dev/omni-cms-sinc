# Local Development Setup Guide

This guide will help you set up and run both the backend API and frontend locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **pnpm** - Package manager
   ```bash
   npm install -g pnpm
   ```
3. **Wrangler CLI** - Cloudflare Workers CLI
   ```bash
   npm install -g wrangler
   ```
4. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)

## Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   # Option 1: Use the setup script (recommended)
   pnpm dev:setup
   
   # Option 2: Manual setup
   cd apps/web
   # Next.js automatically loads .env.development for dev
   # Create .env.local for your actual secrets (gitignored)
   cp .env.development .env.local
   # Edit .env.local with your Cloudflare credentials
   ```

3. **Set up backend secrets** (for R2 storage)
   ```bash
   cd apps/api
   wrangler secret put R2_ACCESS_KEY_ID
   wrangler secret put R2_SECRET_ACCESS_KEY
   ```
   Or create `apps/api/.dev.vars` file for local development:
   ```bash
   R2_ACCESS_KEY_ID=your-access-key-id
   R2_SECRET_ACCESS_KEY=your-secret-access-key
   ```

4. **Run database migrations**
   ```bash
   # From root directory
   pnpm db:migrate
   ```

5. **Seed default roles and demo data** (recommended for local dev):
   ```bash
   # Seed roles first
   cd apps/web
   pnpm db:seed
   
   # Then seed demo data (user, organization, posts)
   pnpm db:seed:demo
   ```

6. **Enable local auth bypass** (optional but recommended):
   ```bash
   # Add to apps/api/.dev.vars:
   ENABLE_LOCAL_AUTH_BYPASS=true
   ```

7. **Start both services**
   ```bash
   # From root directory
   pnpm dev:all
   ```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:8787`.

**Note:** With local auth bypass enabled, you'll be automatically authenticated as `demo@example.com` without needing Cloudflare Access.

## Detailed Setup

### Step 1: Install Dependencies

From the root directory:
```bash
pnpm install
```

This installs dependencies for both the frontend (`apps/web`) and backend (`apps/api`).

### Step 2: Configure Frontend Environment

Next.js supports multiple environment files that load automatically:

- **`.env.development`** - Loaded when `NODE_ENV=development` (committed, with defaults)
- **`.env.production`** - Loaded when `NODE_ENV=production` (committed, with defaults)
- **`.env.local`** - Always loaded, gitignored (use for actual secrets)
- **`.env.dev`** / **`.env.prod`** - Alternative naming (copy to `.env.local` if preferred)

**Recommended approach:**

1. The project includes `.env.development` and `.env.production` with default values
2. Create `.env.local` for your actual credentials (this file is gitignored):

   ```bash
   cd apps/web
   cp .env.development .env.local
   # Or use: cp .env.dev .env.local
   ```

3. Edit `.env.local` and set the following **required** variables:
   ```bash
   # REQUIRED: Backend API URL for local development
   NEXT_PUBLIC_API_URL=http://localhost:8787
   
   # REQUIRED: Frontend URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Cloudflare credentials (get from Cloudflare dashboard)
   CLOUDFLARE_ACCOUNT_ID=your-account-id
   CLOUDFLARE_API_TOKEN=your-api-token
   
   # R2 Storage (optional for basic testing)
   R2_ACCOUNT_ID=your-r2-account-id
   R2_ACCESS_KEY_ID=your-r2-access-key-id
   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
   R2_BUCKET_NAME=omni-cms-media
   
   # Cloudflare Access (for authentication)
   CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
   CF_ACCESS_AUD=your-access-aud
   ```

**Environment File Priority:**

Next.js loads environment files in this order (later files override earlier ones):
1. `.env` - Base defaults
2. `.env.development` or `.env.production` - Based on `NODE_ENV`
3. `.env.local` - Your local secrets (gitignored, highest priority)

**File Structure:**
- **`.env.development`** - Committed, contains development defaults (localhost URLs)
- **`.env.production`** - Committed, contains production defaults (production URLs)
- **`.env.dev`** / **`.env.prod`** - Alternative naming, can be committed as templates
- **`.env.local`** - Gitignored, contains your actual credentials

**Best Practice:**
- Keep `.env.development` and `.env.production` committed with placeholder values
- Use `.env.local` for actual secrets (never commit this)
- The setup script (`pnpm dev:setup`) will create `.env.local` from `.env.development`

### Step 3: Configure Backend Secrets

The backend API needs R2 storage credentials. You have two options:

#### Option A: Using Wrangler Secrets (Recommended for Production)

```bash
cd apps/api
wrangler login  # Authenticate with Cloudflare
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
```

#### Option B: Using .dev.vars (Recommended for Local Dev)

Create `apps/api/.dev.vars` file (this file is gitignored):
```bash
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
```

This file is automatically loaded by `wrangler dev` for local development.

### Step 4: Set Up Database

1. **Create local D1 database** (if not already created):
   ```bash
   cd apps/api
   wrangler d1 create omni-cms --local
   ```

2. **Run migrations**:
   ```bash
   # From root directory
   pnpm db:migrate
   ```

   This applies database migrations to your local D1 database.

3. **Seed default roles** (required for demo data):
   ```bash
   cd apps/web
   pnpm db:seed
   # If miniflare is available, it will seed automatically
   # Otherwise, copy the generated SQL and run:
   # wrangler d1 execute omni-cms --local --command="<paste SQL>"
   ```

4. **Seed demo data** (optional, for local development):
   ```bash
   cd apps/web
   pnpm db:seed:demo
   # This creates:
   # - Demo user: demo@example.com (super_admin)
   # - Demo organization: Demo Organization
   # - Sample posts and content
   # If miniflare is available, it will seed automatically
   # Otherwise, copy the generated SQL and run manually
   ```

### Step 5: Configure Local Authentication Bypass

For local development, you can bypass Cloudflare Access authentication:

1. **Create or edit `apps/api/.dev.vars`**:
   ```bash
   # Add this line to enable local auth bypass
   ENABLE_LOCAL_AUTH_BYPASS=true
   ```

2. **How it works:**
   - When `ENABLE_LOCAL_AUTH_BYPASS=true` and no JWT token is present, the API automatically authenticates as `demo@example.com`
   - The demo user is created automatically if it doesn't exist
   - The demo user has `super_admin` privileges
   - **Important:** This only works in local development and is disabled in production

3. **Using demo data:**
   - After running `pnpm db:seed:demo`, you'll have:
     - User: `demo@example.com` (super_admin)
     - Organization: `Demo Organization` (slug: `demo-org`)
     - Sample blog posts (published and draft)
   - The demo user is automatically linked to the demo organization

### Step 6: Start Development Servers

You can start both services in several ways:

#### Option 1: Start Both Together (Recommended)
```bash
# From root directory
pnpm dev:all
```

This starts both the frontend (port 3000) and backend (port 8787) simultaneously.

#### Option 2: Start Separately

**Terminal 1 - Backend:**
```bash
pnpm dev:api
# or
cd apps/api && pnpm dev
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
# or
cd apps/web && pnpm dev
```

## Port Configuration

- **Frontend (Next.js)**: `http://localhost:3000`
- **Backend API (Cloudflare Workers)**: `http://localhost:8787`

The frontend is configured to connect to the backend via the `NEXT_PUBLIC_API_URL` environment variable.

## Available Scripts

From the root directory:

- `pnpm dev:all` - Start both frontend and backend in parallel
- `pnpm dev` - Start only the frontend
- `pnpm dev:api` - Start only the backend API
- `pnpm db:migrate` - Run database migrations locally
- `pnpm db:migrate:prod` - Run database migrations in production
- `pnpm build` - Build frontend for production
- `pnpm build:api` - Build/deploy backend API

## Troubleshooting

### Frontend can't connect to backend

1. **Check that backend is running**:
   - Verify `http://localhost:8787` is accessible
   - Check terminal for backend startup messages

2. **Verify environment variable**:
   - Ensure `NEXT_PUBLIC_API_URL=http://localhost:8787` is set in `apps/web/.env.local`
   - Restart the frontend dev server after changing `.env.local`

3. **Check for CORS issues**:
   - The backend should have CORS enabled for local development
   - Check browser console for CORS error messages

### Backend not starting

1. **Check Wrangler authentication**:
   ```bash
   wrangler whoami
   ```
   If not logged in, run `wrangler login`

2. **Verify database exists**:
   ```bash
   cd apps/api
   wrangler d1 list
   ```

3. **Check for missing secrets**:
   - Ensure R2 secrets are set (via `wrangler secret put` or `.dev.vars`)
   - Check `apps/api/wrangler.toml` for correct configuration

### Database migration errors

1. **Reset local database** (if needed):
   ```bash
   cd apps/api
   # Delete local database file (usually in .wrangler/state/v3/d1/)
   # Then re-run migrations
   pnpm db:migrate
   ```

2. **Check migration files**:
   - Verify `apps/api/drizzle/migrations/` contains migration files
   - Ensure migrations are in correct order

### Local authentication issues

1. **Enable local auth bypass**:
   - Ensure `ENABLE_LOCAL_AUTH_BYPASS=true` is in `apps/api/.dev.vars`
   - Restart the API server after adding the variable
   - The bypass only works when no Cloudflare Access JWT is present

2. **Demo user not found**:
   - Run `pnpm db:seed:demo` to create the demo user and organization
   - Or the demo user will be auto-created on first API request when bypass is enabled

3. **No organization available**:
   - Run `pnpm db:seed:demo` to create demo organization
   - The demo user is automatically linked to the demo organization

### Port already in use

If port 3000 or 8787 is already in use:

1. **Find and kill the process**:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:3000 | xargs kill
   ```

2. **Or change the port**:
   - Frontend: `cd apps/web && PORT=3001 pnpm dev`
   - Backend: Edit `apps/api/wrangler.toml` or use `wrangler dev --port 8788`

## Development Workflow

1. **Make changes** to either frontend or backend code
2. **Hot reload** is enabled - changes will automatically refresh
3. **Check logs** in both terminal windows for errors
4. **Test API endpoints** directly at `http://localhost:8787`
5. **Test frontend** at `http://localhost:3000`

## Next Steps

- Read the [API Documentation](docs/03-api-endpoints.md)
- Check the [Database Schema](docs/02-database-schema.md)
- Review [Authentication Setup](docs/04-authentication-permissions.md)
- See [Troubleshooting Guide](docs/10-troubleshooting.md) for more help

## Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Next.js Docs](https://nextjs.org/docs)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)

