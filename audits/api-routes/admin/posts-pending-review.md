# Posts Pending Review API Route Audit

## Route Information
- **Endpoint**: `GET /api/admin/v1/organizations/:orgId/posts/pending-review`
- **File**: `apps/api/src/routes/admin/posts-pending-review.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /:orgId/posts/pending-review`
- Lists posts with `workflowStatus: 'pending_review'`

### Authentication
- Required: Yes
- Permission: `posts:read`

### Response
- Includes author and postType info
- Ordered by `updatedAt` (descending)

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Add pagination** - Currently no pagination
- [ ] **Add filtering** - Filter by reviewer, date range

---

## Related Audits
- Related pages: `reviews.md`
- Related routes: `api-routes/admin/post-workflow.md`

