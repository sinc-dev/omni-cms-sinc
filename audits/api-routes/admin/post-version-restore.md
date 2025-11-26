# Post Version Restore API Route Audit

## Route Information
- **Endpoint**: `POST /api/admin/v1/organizations/:orgId/posts/:postId/versions/:versionId/restore`
- **File**: `apps/api/src/routes/admin/post-version-restore.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `POST /:orgId/posts/:postId/versions/:versionId/restore`
- Restores a post to a previous version

### Authentication
- Required: Yes
- Permission: `posts:update`

### Special Features
- Creates a new version from current state before restore
- Restores post content and custom fields
- Increments version number

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify transaction handling** - Ensure atomic restore

---

## Related Audits
- Related routes: `api-routes/admin/post-versions.md`

