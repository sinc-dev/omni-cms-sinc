# Post Versions API Route Audit

## Route Information
- **Endpoint**: `GET /api/admin/v1/organizations/:orgId/posts/:postId/versions`
- **File**: `apps/api/src/routes/admin/post-versions.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /:orgId/posts/:postId/versions` - List all versions
- `GET /:orgId/posts/:postId/versions/:versionId` - Get specific version

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('posts:read')`

### Special Features
- Includes creator info for each version
- Ordered by version number (descending)

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Optimize creator queries** - Currently N+1 (one per version)

---

## Related Audits
- Related routes: `api-routes/admin/post-version-restore.md`

