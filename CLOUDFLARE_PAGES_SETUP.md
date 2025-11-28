# Cloudflare Pages Setup Instructions

## Critical Fix Required

### 1. Set Deploy Command in Cloudflare Pages Dashboard

**Location**: Cloudflare Dashboard → Pages → omni-cms-sinc → Settings → Builds & deployments

**Deploy Command**:
```
npx wrangler pages deploy .vercel/output/static
```

**Note**: The `@cloudflare/next-on-pages` adapter outputs to `.vercel/output/static` directory. This command deploys that output to Cloudflare Pages.

**Alternative**: If you must have a deploy command, use:
```
echo "Build completed successfully"
```

## Remaining Setup Steps

### 2. Configure Bindings (Required)

**How to find the bindings settings:**

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. In the left sidebar, click **Workers & Pages**
3. Click **Pages** (or go directly to [Pages](https://dash.cloudflare.com/?to=/:account/pages))
4. Click on your project: **omni-cms-sinc**
5. Click **Settings** tab (at the top)
6. Scroll down and click **Functions** in the left sidebar (under Settings)

**In the Functions section, add bindings:**

#### D1 Database Binding:
1. Scroll to **D1 Database bindings** section
2. Click **Add binding**
3. Fill in:
   - **Variable name**: `DB`
   - **Database**: Select `omni-cms` from dropdown (or create new if needed)
   - **Database ID**: `12aad490-4c2d-4cdb-b07f-0f536e20e994`
4. Click **Save**

#### R2 Bucket Binding:
1. Scroll to **R2 Bucket bindings** section
2. Click **Add binding**
3. Fill in:
   - **Variable name**: `R2_BUCKET`
   - **Bucket**: Select `omni-cms-media` from dropdown (or create new if needed)
4. Click **Save**

### 3. Set Environment Variables (Required)

**How to find environment variables:**

1. In your **omni-cms-sinc** project (same as above)
2. Click **Settings** tab
3. Scroll down and click **Environment Variables** in the left sidebar (under Settings)
4. You'll see sections for **Production**, **Preview**, **Branch previews**, and **Build**
5. Add variables to **Production** (and Preview if needed)

#### ⚠️ CRITICAL: Set NODE_OPTIONS for Build

**IMPORTANT**: To prevent "JavaScript heap out of memory" errors during build, you **MUST** set `NODE_OPTIONS` in the **Build** environment variables section:

1. In the **Environment Variables** page, scroll to the **Build** section (separate from Production/Preview)
2. Click **Add variable** in the Build section
3. Set:
   - **Variable name**: `NODE_OPTIONS`
   - **Value**: `--max-old-space-size=3584` (or `4096` if you have more headroom)
4. Click **Save**

**Why this is needed:**
- The `@cloudflare/next-on-pages` tool runs `pnpm dlx vercel build` internally
- `pnpm dlx` creates an isolated environment that doesn't inherit NODE_OPTIONS from parent processes
- `vercel build` is extremely memory-intensive and needs the increased heap size
- Build environment variables are separate from runtime variables
- **Without this, builds WILL fail with out-of-memory errors** - this is NOT optional

**Note**: This is different from runtime environment variables. Build variables are only available during the build process.

**⚠️ CRITICAL**: Even though the build script tries to set NODE_OPTIONS, the `pnpm dlx` command inside `@cloudflare/next-on-pages` runs in an isolated environment. Setting it in the Cloudflare Pages dashboard Build environment variables is the ONLY reliable way to ensure it reaches the `vercel build` process.

**Add these variables:**

**Required Variables:**

#### `CF_ACCESS_TEAM_DOMAIN` - Cloudflare Access Team Domain

**Where to find it:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Left sidebar → **Zero Trust** (or **Access**)
3. Look at the URL or your team name - it will be in the format: `your-team-name.cloudflareaccess.com`
4. **OR** go to **Access** → **Applications** → Click on any application → The team domain is shown at the top

**Example format**: `mycompany.cloudflareaccess.com`

#### `CF_ACCESS_AUD` - Cloudflare Access Audience Tag (AUD)

**Where to find it:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Left sidebar → **Zero Trust** → **Access** → **Applications**
3. Click on your application (or create a new one for your Pages site)
4. Scroll to **Application Audience (AUD) Tag** section
5. Copy the AUD tag value (it's a long string like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
6. **If you don't have an application yet:**
   - Click **Add an application**
   - Choose **Self-hosted** application type
   - Fill in application name (e.g., "Omni CMS")
   - Set the application domain to your Pages URL (e.g., `omni-cms-sinc.pages.dev`)
   - The AUD tag will be generated automatically and shown in the application settings

**Note**: You need to create a Cloudflare Access application for your Pages site to get the AUD tag.

**If you don't have Cloudflare Access set up yet:**
1. Go to **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure:
   - **Application name**: `Omni CMS` (or your preferred name)
   - **Session duration**: Choose your preference
   - **Application domain**: Your Pages URL (e.g., `omni-cms-sinc.pages.dev`)
   - **Identity providers**: Add Google, GitHub, Email OTP, etc.
   - **Policies**: Set who can access (e.g., "Allow all emails from your domain")
4. After creating, the AUD tag will be visible in the application settings
5. The team domain is usually visible in the URL or at the top of the Access dashboard  
- `R2_ACCOUNT_ID` - Your R2 account ID
- `R2_ACCESS_KEY_ID` - Your R2 access key ID
- `R2_SECRET_ACCESS_KEY` - Your R2 secret access key
- `R2_BUCKET_NAME` - `omni-cms-media`
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://omni-cms-sinc.pages.dev`)

**Optional:**
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_PUBLIC_URL` - Custom domain for R2 media (if using)

**Build Environment Variables (Required for successful builds):**
- `NODE_OPTIONS` = `--max-old-space-size=4096` ⚠️ **CRITICAL** - Prevents out-of-memory errors during build

### 4. Create/Verify Resources

#### D1 Database:
The database should already exist with ID `12aad490-4c2d-4cdb-b07f-0f536e20e994`. If not:
- Go to Cloudflare Dashboard → D1
- Create database named `omni-cms`
- Note the database ID and update `wrangler.toml` if different

#### R2 Bucket:
- Go to Cloudflare Dashboard → R2
- Create bucket named `omni-cms-media` if it doesn't exist
- Configure CORS if needed for public media access

### 5. Apply Database Migrations

After bindings are configured, run locally:
```bash
cd web
pnpm db:migrate:prod
```

This applies all migrations to production D1 database.

### 6. Trigger Deployment

After fixing the deploy command and configuring bindings:
- Push to main branch (if GitHub connected), OR
- Manually trigger deployment in Cloudflare Pages dashboard

## Build Configuration Summary

- **Root directory**: `web` ✅
- **Build command**: `pnpm build` ✅ (now includes next-on-pages adapter)
- **Build output directory**: `.next` (auto-detected)
- **Deploy command**: **REMOVE THIS** (leave empty)

## Testing Builds Locally

**Before deploying, always test the build locally:**

```bash
cd apps/web
pnpm run build:simulate
```

This simulates the Cloudflare Pages build environment and catches errors early. See `apps/web/LOCAL_BUILD_TEST.md` for details.

**Why test locally?**
- Catch build errors before deploying
- Verify memory usage is acceptable
- Check for recursive copying issues (symlinks)
- Save time and build minutes

## Notes

- The `@cloudflare/next-on-pages` adapter has been added to the build process
- Next.js 16 should work natively, but the adapter ensures compatibility
- All admin pages are configured as dynamic routes to prevent build errors

