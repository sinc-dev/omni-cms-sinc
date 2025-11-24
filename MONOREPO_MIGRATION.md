# Monorepo Migration Guide

This document outlines the migration from a single Next.js app to a split monorepo architecture.

## New Structure

```
omni-cms-sinc/
├── apps/
│   ├── web/          # Next.js Frontend (Cloudflare Pages)
│   └── api/          # Hono Backend (Cloudflare Workers)
├── packages/         # Shared code (optional, for future)
└── pnpm-workspace.yaml
```

## Migration Status

### ✅ Completed
- [x] Updated `pnpm-workspace.yaml` to support `apps/*` structure
- [x] Created `apps/` directory
- [x] Moved `web/` to `apps/web/`
- [x] Initialized Hono API in `apps/api/`
- [x] Set up API package.json with dependencies
- [x] Created API wrangler.toml
- [x] Copied database schemas to `apps/api/src/db/`
- [x] Copied backend lib files to `apps/api/src/lib/`
- [x] Created Hono middleware adapters (`hono-middleware.ts`, `hono-public-middleware.ts`)
- [x] Created example routes:
  - `apps/api/src/routes/admin/organizations.ts`
  - `apps/api/src/routes/public/posts.ts`
- [x] Updated main `apps/api/src/index.ts` with route mounting
- [x] Created root deployment scripts in `package.json`
- [x] Updated tsconfig.json with path aliases

### 🚧 Remaining Work

#### 1. Convert Remaining API Routes (58 routes total)

The following routes need to be converted from Next.js to Hono:

**Admin Routes** (48 routes):
- `/api/admin/v1/organizations/[orgId]/posts/*` (multiple routes)
- `/api/admin/v1/organizations/[orgId]/media/*`
- `/api/admin/v1/organizations/[orgId]/users/*`
- `/api/admin/v1/organizations/[orgId]/taxonomies/*`
- `/api/admin/v1/organizations/[orgId]/custom-fields/*`
- `/api/admin/v1/organizations/[orgId]/api-keys/*`
- `/api/admin/v1/organizations/[orgId]/webhooks/*`
- `/api/admin/v1/organizations/[orgId]/ai/*`
- `/api/admin/v1/organizations/[orgId]/search`
- `/api/admin/v1/organizations/[orgId]/schema/*`
- `/api/admin/v1/organizations/[orgId]/import`
- `/api/admin/v1/organizations/[orgId]/export`
- `/api/admin/v1/organizations/[orgId]/analytics/*`
- `/api/admin/v1/roles`
- And more...

**Public Routes** (9 routes):
- `/api/public/v1/[orgSlug]/posts/*` (partially done)
- `/api/public/v1/[orgSlug]/search`
- `/api/public/v1/[orgSlug]/taxonomies/*`
- `/api/public/v1/[orgSlug]/analytics/track`
- `/api/public/v1/[orgSlug]/sitemap.xml`

**GraphQL Route**:
- `/api/graphql`

#### 2. Update Frontend

- [ ] Remove `apps/web/src/app/api/` directory
- [ ] Update `apps/web/src/lib/api-client/` to point to backend URL
- [ ] Add environment variable `NEXT_PUBLIC_API_URL` for API endpoint
- [ ] Update all API client calls to use the new backend

#### 3. Fix Import Paths

Some files may need import path updates. The `@/` alias is configured in `apps/api/tsconfig.json`, but verify all imports work correctly.

#### 4. Testing

- [ ] Test API routes locally with `pnpm dev:api`
- [ ] Test frontend locally with `pnpm dev:web`
- [ ] Test full stack with `pnpm dev:all`
- [ ] Verify database migrations work
- [ ] Test deployment to Cloudflare

## Conversion Pattern

### Next.js Route → Hono Route

**Before (Next.js):**
```typescript
// apps/web/src/app/api/admin/v1/organizations/[orgId]/posts/route.ts
import { withAuth } from '@/lib/api/auth-wrapper';

export const GET = withAuth(
  async (request, { db, organizationId }) => {
    // handler logic
    return successResponse(data);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);
```

**After (Hono):**
```typescript
// apps/api/src/routes/admin/posts.ts
import { Hono } from 'hono';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse } from '../../lib/api/response';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get(
  '/:orgId/posts',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    // handler logic
    return c.json(successResponse(data));
  }
);

export default app;
```

Then mount in `apps/api/src/index.ts`:
```typescript
import adminPosts from './routes/admin/posts';
app.route('/api/admin/v1/organizations', adminPosts);
```

## Deployment

### Backend (Workers)
```bash
cd apps/api
pnpm deploy
# Or from root:
pnpm deploy:api
```

### Frontend (Pages)
```bash
cd apps/web
pnpm run build:cf
# Or from root:
pnpm deploy:web
```

### Both
```bash
pnpm deploy:all
```

## Environment Variables

### Backend (Workers)
Set in Cloudflare Workers dashboard or `wrangler.toml`:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `OPENAI_API_KEY` (for AI features)

### Frontend (Pages)
Set in Cloudflare Pages dashboard:
- `NEXT_PUBLIC_API_URL` - URL of the deployed API Worker
- `NEXT_PUBLIC_APP_URL` - URL of the frontend
- Other Next.js environment variables

## Benefits

1. **Zero Bundle Bloat**: Frontend only contains React code (~5-10MB vs 64MB)
2. **Independent Deployments**: Deploy frontend and backend separately
3. **Better Type Safety**: Share types between frontend and backend via workspace
4. **Optimized Workers**: Backend optimized for Cloudflare Workers runtime
5. **No Path Resolution Issues**: No more symlink tricks needed

## Next Steps

1. Continue converting routes using the pattern above
2. Test each route as it's converted
3. Update frontend API client
4. Deploy and test in production
