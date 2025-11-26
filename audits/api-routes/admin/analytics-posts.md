# Analytics Posts API Route Audit

## Route Information
- **Endpoint**: `GET /api/admin/v1/organizations/:orgId/analytics/posts`
- **File**: `apps/api/src/routes/admin/analytics-posts.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /:orgId/analytics/posts`
- Lists posts with aggregated analytics

### Authentication
- Required: Yes
- Permission: `posts:read`

### Query Parameters
- `page`, `per_page` - Pagination

### Response
- Posts with total views and unique views
- Ordered by total views (descending)
- SQL aggregation used

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify query performance** - SQL aggregation may be slow

---

## Related Audits
- Related routes: `api-routes/admin/analytics.md`
- Related pages: `analytics.md`

