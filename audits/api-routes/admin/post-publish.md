# Post Publish API Route Audit

## Route Information
- **Endpoint**: `POST/DELETE /api/admin/v1/organizations/:orgId/posts/:postId/publish`
- **File**: `apps/api/src/routes/admin/post-publish.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `POST /:orgId/posts/:postId/publish` - Publish post
- `DELETE /:orgId/posts/:postId/publish` - Unpublish post

### Authentication
- Required: Yes
- Permission: `posts:publish`

### Special Features
- Cache invalidation on publish/unpublish
- Webhook dispatching (`post.published`, `post.unpublished`)
- Sets `publishedAt` timestamp

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify cache invalidation** - Ensure cache cleared properly
- [ ] **Verify webhook delivery** - Test webhook dispatching

---

## Related Audits
- Related routes: `api-routes/admin/post-detail.md`

