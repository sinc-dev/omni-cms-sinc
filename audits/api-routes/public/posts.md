# Public Posts API Route Audit

## Route Information
- **Endpoint**: `GET /api/public/v1/:orgSlug/posts`
- **File**: `apps/api/src/routes/public/posts.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /api/public/v1/:orgSlug/posts`
- Public access (no auth required, but API key can be used)

### Query Parameters
- Pagination: `page`, `per_page`
- Filtering: `post_type`, `search`, `published_from`, `published_to`
- Sorting: `sort`

### Special Features
- Only returns published posts
- Includes full post data (taxonomies, custom fields, media)
- Caching headers set
- Complex query with multiple relations

---

## E. Improvements Needed

### Critical Issues
- [ ] **N+1 Query Problem** - Lines 174-225: Multiple queries in Promise.all per post
- [ ] **Verify caching** - Line 87: Cache-Control headers present

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Optimize query** - Batch fetch relations instead of per-post

---

## Related Audits
- Related pages: Public-facing pages
- Related components: `PostsList` (public)
