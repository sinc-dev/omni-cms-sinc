# OpenNext Config File Fix

## Problem

The build was failing because OpenNext couldn't find `opennext.config.ts` and was trying to prompt interactively (which doesn't work in CI).

## Solution

1. **Simplified config file**: Updated `opennext.config.ts` to use minimal configuration
2. **Build script update**: Modified `build-opennext.js` to:
   - Check if config file exists, create it if missing
   - Use `--yes` flag to skip interactive prompts

## Changes Made

### 1. opennext.config.ts
Simplified to minimal configuration:
```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

### 2. build-opennext.js
Added:
- Config file existence check and auto-creation
- `--yes` flag to skip prompts

## Next Steps

1. Commit the updated files:
   ```bash
   git add apps/web/opennext.config.ts
   git add apps/web/scripts/build-opennext.js
   git commit -m "Fix OpenNext config file handling for CI builds"
   git push
   ```

2. The build should now work without interactive prompts.

## Why This Happened

OpenNext CLI tries to be helpful by prompting to create a config file if it's missing. In CI environments, this fails because there's no way to answer the prompt. The fix ensures:
- Config file exists before running OpenNext
- Non-interactive mode is used with `--yes` flag
