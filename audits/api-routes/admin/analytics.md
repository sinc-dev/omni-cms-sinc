# Analytics API Route Audit

## Route Information
- **Endpoint**: `GET /api/admin/v1/organizations/:orgId/analytics`
- **File**: `apps/api/src/routes/admin/analytics.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /api/admin/v1/organizations/:orgId/analytics`
- Optional query params: `from`, `to`, `post_id`

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('posts:read')`

### Query Parameters
- `from` - Start date (default: 30 days ago)
- `to` - End date (default: now)
- `post_id` - Specific post analytics (optional)

### Response Structure
- For specific post: Analytics array + totals
- For overview: Aggregated analytics for all posts

---

## B. Implementation Analysis

### Database Queries
- Queries `postAnalytics` table
- Aggregates data in application layer (may be inefficient)
- **To verify**: Query performance for large datasets

### Date Range
- Default: Last 30 days
- **To verify**: Date validation

---

## E. Improvements Needed

### High Priority
- [ ] **Optimize aggregations** - Use SQL aggregations instead of application-level
- [ ] **Add caching** - Analytics can be cached
- [ ] **Verify MCP documentation**
- [ ] **Add date validation**

### Medium Priority
- [ ] **Add rate limiting**
- [ ] **Add data export**

---

## Related Audits
- Related pages: `analytics.md`
- Related routes: `api-routes/admin/analytics-posts.md`

