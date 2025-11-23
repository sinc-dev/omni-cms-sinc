# Known Issues & Resolutions

## TypeScript Errors with New Schema Tables

**Issue:** TypeScript may show errors for new schema tables (`postEditLocks`, `postVersions`, `presence`, etc.) not being recognized in `db.query`.

**Cause:** Drizzle ORM's TypeScript types need to be regenerated after schema changes. The types are inferred from the actual schema exports.

**Resolution:**
1. Ensure all schema files are properly exported in `web/src/db/schema/index.ts`
2. Run `pnpm db:generate` to generate migrations (this also helps TypeScript recognize changes)
3. Restart TypeScript server in your IDE
4. If errors persist, use direct table imports and `db.select().from(table)` instead of `db.query.tableName`

**Workaround (if needed):**
```typescript
// Instead of:
const lock = await db.query.postEditLocks.findFirst({...});

// Use:
import { postEditLocks } from '@/db/schema/post-edit-locks';
const lock = await db.select().from(postEditLocks).where(...).limit(1);
```

## Missing GraphQL Dependencies

**Issue:** GraphQL API may fail if `graphql` and `@graphql-tools/schema` packages are not installed.

**Resolution:**
```bash
pnpm add graphql @graphql-tools/schema
```

## Cloudflare Workers Cron Configuration

**Issue:** Scheduled publishing won't work without configuring a Cloudflare Workers cron trigger.

**Resolution:**
1. Create a Worker that imports and calls `scheduled-publisher.ts`
2. Configure cron trigger in `wrangler.toml`:
```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

## Webhook HMAC Signature

**Issue:** Webhook HMAC signature generation uses Node.js `crypto` which may not be available in Cloudflare Workers.

**Resolution:**
Use Web Crypto API in Cloudflare Workers:
```typescript
import { createHmac } from 'crypto'; // Replace with Web Crypto API
```

## Analytics IP Hashing

**Issue:** IP hashing uses Node.js `crypto` which may not be available in Cloudflare Workers.

**Resolution:**
Use Web Crypto API for hashing in Cloudflare Workers environment.

## Database Query Builder Types

**Issue:** `db.query.tableName` may not recognize new tables until TypeScript types are regenerated.

**Resolution:**
1. Ensure schema files export tables and relations
2. Restart TypeScript server
3. If needed, use direct table queries: `db.select().from(table)`

## Missing Unique Index on Presence

**Issue:** Presence table may allow duplicate entries for same post+user.

**Resolution:**
Add unique index in migration:
```sql
CREATE UNIQUE INDEX idx_presence_post_user ON presence(post_id, user_id);
```

## Export Manager Post Type Filter

**Issue:** Export manager's `postTypeIds` filter may not work correctly with Drizzle's `inArray`.

**Resolution:**
Ensure `inArray` is imported from `drizzle-orm` and used correctly:
```typescript
import { inArray } from 'drizzle-orm';
where: and(
  eq(posts.organizationId, organizationId),
  inArray(posts.postTypeId, postTypeIds)
)
```

## Workflow Route Action Parameter

**Issue:** Workflow route uses query parameter `?action=submit` which may not be the best API design.

**Resolution:**
Consider using separate routes:
- `POST /posts/:postId/workflow/submit`
- `POST /posts/:postId/workflow/approve`
- `POST /posts/:postId/workflow/reject`

## Auto-Save Debounce

**Issue:** Auto-save may trigger too frequently on fast typing.

**Resolution:**
Adjust debounce delay in `use-auto-save.ts`:
```typescript
delay = 2500, // Increase to 3000 or more if needed
```

## Version Cleanup

**Issue:** Version cleanup keeps last 50 versions, which may be too many for large posts.

**Resolution:**
Make version limit configurable per organization or post type.

## Scheduled Publishing Timezone

**Issue:** Scheduled publishing uses server timezone, not user's timezone.

**Resolution:**
Store timezone with scheduled date or convert to UTC on save.

## Webhook Retry Logic

**Issue:** Webhook retry logic may not handle all failure scenarios.

**Resolution:**
Implement exponential backoff and max retry limits in webhook dispatcher.

## Presence Cleanup

**Issue:** Presence records may accumulate if users don't properly disconnect.

**Resolution:**
Implement automatic cleanup of stale presence records (older than 5 minutes).

## AI Integration API Key

**Issue:** AI features require API key but may fail silently if not configured.

**Resolution:**
Add proper error handling and user-friendly error messages when API key is missing.

## GraphQL Schema Generation

**Issue:** GraphQL schema is manually defined and may get out of sync with database schema.

**Resolution:**
Consider using code generation tools to keep GraphQL schema in sync with database schema.

