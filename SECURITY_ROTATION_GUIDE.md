# Security Rotation Guide - Exposed Credentials

## ⚠️ CRITICAL: Immediate Action Required

Sensitive credentials were previously committed to the repository. This guide provides step-by-step instructions to rotate all exposed credentials.

## Exposed Credentials Summary

The following credentials were exposed and MUST be rotated:

1. **R2 Storage Credentials** (CRITICAL):
   - `R2_ACCESS_KEY_ID=64d3af705113e6b991eb198778080aa7`
   - `R2_SECRET_ACCESS_KEY=64e1077ead95173a34867a14a2e251a6cd9b824a8ed51d9c9697d45717702bcd`

2. **Cloudflare Access Configuration**:
   - `CF_ACCESS_AUD=7291b33d4c255188f0d63a05cf91f9e72e1e6606fb2acb148360886c42e52083`
   - `CF_ACCESS_TEAM_DOMAIN=sincdev.cloudflareaccess.com`

3. **R2 Account ID**:
   - `R2_ACCOUNT_ID=9a2b6956cc47f63e13beb91af5363970`

## Step 1: Rotate R2 Storage Credentials

### 1.1 Create New R2 API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure the token:
   - **Token Name**: `omni-cms-api-production` (or similar)
   - **Permissions**: Read and Write
   - **TTL**: Set expiration if desired (or leave as "Never expire")
4. Click **Create API Token**
5. **IMPORTANT**: Copy both values immediately:
   - **Access Key ID** (starts with `64...`)
   - **Secret Access Key** (long hex string)
   - ⚠️ The Secret Access Key is only shown once - save it securely!

### 1.2 Update Production Secrets

Update the secrets in your Cloudflare Worker:

```bash
cd apps/api

# Update R2 Access Key ID
wrangler secret put R2_ACCESS_KEY_ID
# When prompted, paste the NEW Access Key ID

# Update R2 Secret Access Key
wrangler secret put R2_SECRET_ACCESS_KEY
# When prompted, paste the NEW Secret Access Key
```

### 1.3 Update Local Development

If you have a local `.dev.vars` file (which should be gitignored):

1. Open `apps/api/.dev.vars`
2. Update the values:
   ```
   R2_ACCESS_KEY_ID=your-new-access-key-id
   R2_SECRET_ACCESS_KEY=your-new-secret-access-key
   ```

### 1.4 Revoke Old R2 Token

**After confirming the new credentials work:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2** → **Manage R2 API Tokens**
2. Find the old token (Access Key ID: `64d3af705113e6b991eb198778080aa7`)
3. Click **Revoke** or **Delete**
4. Confirm the deletion

### 1.5 Verify New Credentials

Test that the new credentials work:

```bash
# Test R2 access (if you have wrangler configured)
cd apps/api
wrangler dev
# Try uploading a file or accessing R2 storage
```

## Step 2: Regenerate Cloudflare Access Application Audience (Optional but Recommended)

If you suspect the `CF_ACCESS_AUD` was compromised, you may need to regenerate it:

### 2.1 Check Current Access Configuration

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Access** → **Applications**
3. Find your application (likely named something like "omni-cms" or "sincdev")
4. Note the current **Application Audience (AUD)** value

### 2.2 Regenerate AUD (If Needed)

**Note**: Regenerating the AUD will require updating all clients/applications that use this value.

1. In the application settings, look for **Application Audience (AUD)**
2. If there's a "Regenerate" option, use it
3. **OR** Create a new Access Application with a new AUD
4. Update all environment variables and configurations with the new AUD

### 2.3 Update Configuration

Update the new AUD in:

1. **Cloudflare Pages Environment Variables**:
   - Go to Pages → omni-cms-sinc → Settings → Environment Variables
   - Update `CF_ACCESS_AUD` with the new value

2. **Local Development** (if using `.dev.vars` or `.env.local`):
   - Update `CF_ACCESS_AUD` in your local environment files

3. **Any CI/CD pipelines** that use this value

## Step 3: Review Access Logs

### 3.1 Check Cloudflare Access Logs

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Access** → **Logs**
3. Review recent access attempts for:
   - Unusual IP addresses
   - Unauthorized access attempts
   - Access from unexpected locations

### 3.2 Check R2 Access Logs

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **R2**
2. Review bucket access logs (if available)
3. Check for:
   - Unusual file uploads/downloads
   - Access from unexpected sources
   - Unusual activity patterns

## Step 4: Update Documentation

After rotating credentials, ensure all documentation is updated:

- ✅ `apps/api/SET_SECRETS.md` - Already updated with placeholders
- ✅ `apps/api/wrangler.toml` - Already cleaned
- ✅ `.gitignore` - Already updated to ignore `.dev.vars`

## Step 5: Verify Git History (Advanced)

**Note**: The exposed credentials remain in git history even after removing them from current files.

### Option A: Accept Risk (Simpler)
- The credentials are already rotated, so old values in history are invalid
- This is acceptable if you've rotated all credentials

### Option B: Clean Git History (Advanced)
If you want to remove secrets from git history entirely:

**⚠️ WARNING**: This rewrites git history and requires force-pushing. Coordinate with your team.

1. Install [git-filter-repo](https://github.com/newren/git-filter-repo) or [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

2. Remove sensitive files from history:
   ```bash
   # Using git-filter-repo
   git filter-repo --path apps/api/.dev.vars --invert-paths
   git filter-repo --path apps/api/SET_SECRETS.md --invert-paths
   
   # Or using BFG
   bfg --delete-files .dev.vars
   ```

3. Force push (coordinate with team first!):
   ```bash
   git push --force --all
   ```

## Verification Checklist

After completing all steps, verify:

- [ ] New R2 credentials are working in production
- [ ] Old R2 token has been revoked
- [ ] Cloudflare Access is working with new/updated AUD (if changed)
- [ ] Local development environment updated (if applicable)
- [ ] All team members have been notified of credential changes
- [ ] Access logs reviewed for suspicious activity
- [ ] Documentation updated (already done)

## Prevention for Future

To prevent this from happening again:

1. ✅ `.dev.vars` is now in `.gitignore`
2. ✅ Sensitive values removed from `wrangler.toml`
3. ✅ Documentation uses placeholders instead of real values
4. **Always use** `wrangler secret put` for production secrets
5. **Never commit** files containing:
   - API keys
   - Secret keys
   - Access tokens
   - Passwords
   - Private keys

## Additional Resources

- [Cloudflare R2 API Tokens Documentation](https://developers.cloudflare.com/r2/api/s3/tokens/)
- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Wrangler Secrets Documentation](https://developers.cloudflare.com/workers/wrangler/commands/#secret)

## Support

If you encounter issues during rotation:

1. Check Cloudflare Dashboard for error messages
2. Review wrangler logs: `wrangler tail`
3. Verify secrets are set: `wrangler secret list`
4. Check application logs in Cloudflare Dashboard

---

**Last Updated**: After credential leak remediation
**Status**: Credentials removed from repository, rotation required

