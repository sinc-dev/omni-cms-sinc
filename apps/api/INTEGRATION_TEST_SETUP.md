# Integration Test Setup with Real D1

## Overview

Integration tests now use **real D1 database** via Miniflare, with automatic migrations. Unit tests continue to use fast in-memory mocks.

## How It Works

### Integration Tests (`src/__tests__/integration/*`)
- Use `createIntegrationD1()` from `helpers/integration-d1.ts`
- Creates a real SQLite database using Miniflare
- Automatically runs all migrations from `drizzle/migrations/`
- Database is persisted to `./.wrangler/test-state/d1` (isolated from dev database)
- Returns both database and Miniflare instance for cleanup

### Unit Tests (`src/__tests__/routes/*`)
- Use `createMockBindings()` which defaults to simple in-memory mocks
- Fast execution, no real database needed
- Perfect for testing business logic

## Setup

Integration tests automatically:
1. Create Miniflare instance with D1 database
2. Run all migrations from `drizzle/migrations/*.sql`
3. Return ready-to-use database instance

## Example Usage

```typescript
import { createIntegrationD1, cleanupIntegrationD1 } from '../helpers/integration-d1';
import { getDb } from '../../db/client';
import type { Miniflare } from 'miniflare';

describe('Integration Tests', () => {
  let db: DbClient;
  let mf: Miniflare | undefined;

  beforeAll(async () => {
    const { db: d1, mf: miniflare } = await createIntegrationD1();
    db = getDb(d1);
    mf = miniflare;
  });

  afterAll(async () => {
    if (mf) {
      await cleanupIntegrationD1(mf);
    }
  });

  it('should work with real database', async () => {
    // Your test here - uses real D1 database
  });
});
```

## Benefits

✅ **Real database testing** - Tests run against actual SQLite/D1  
✅ **Automatic migrations** - Schema is set up automatically  
✅ **Isolated test database** - Separate from development database  
✅ **Proper cleanup** - Miniflare instances are disposed after tests  
✅ **Fast unit tests** - Unit tests still use mocks for speed

## Database Location

- Test database: `./.wrangler/test-state/d1`
- Dev database: `./.wrangler/state/v3/d1/` (default wrangler location)

These are separate, so tests won't interfere with development.
