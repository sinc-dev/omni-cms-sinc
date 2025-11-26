# Posts API Route Audit

## Route Information
- **Endpoint**: `GET/POST/PUT/PATCH/DELETE /api/admin/v1/organizations/:orgId/posts`
- **File**: `apps/api/src/routes/admin/posts.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /api/admin/v1/organizations/:orgId/posts` - List posts with filters
- `POST /api/admin/v1/organizations/:orgId/posts` - Create post
- `GET /api/admin/v1/organizations/:orgId/posts/:id` - Get post detail (likely in post-detail.ts)
- `PATCH /api/admin/v1/organizations/:orgId/posts/:id` - Update post (likely in post-detail.ts)
- `DELETE /api/admin/v1/organizations/:orgId/posts/:id` - Delete post (likely in post-detail.ts)

### Authentication
- Required: Yes
- Method: Cloudflare Access or API Key
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('posts:read')`

### Authorization
- Organization access: `orgAccessMiddleware`
- Permission checks: `permissionMiddleware('posts:read')` for GET
- **To verify**: Permissions for POST/PATCH/DELETE

### Query Parameters
- `page`, `per_page` - Pagination
- `post_type` - Filter by post type
- `status` - Filter by status
- `search` - Search in title/content/excerpt
- `author_id` - Filter by author
- `created_from`, `created_to` - Date range
- `published_from`, `published_to` - Published date range
- `sort` - Sort order

### Request Body (POST/PATCH)
- **To verify**: Schema validation
- **To verify**: Required fields

### Response Structure
- Paginated response with `data` and `meta`
- Includes related data (author, postType)

---

## B. Implementation Analysis

### Database Queries
- Uses Drizzle ORM
- Multiple where conditions built dynamically
- **Potential issue**: LIKE queries on content may be slow
- **To verify**: Indexes on searchable fields

### Input Validation
- ✅ Uses `getPaginationParams` for pagination
- ✅ Uses `parseDateParam` for date filters
- ✅ Uses `parseSortParam` for sorting
- **To verify**: Schema validation for POST/PATCH

### Error Handling
- ✅ Date format validation with error responses
- ✅ Standard error response format
- **To verify**: All error cases covered

### Caching
- Mentions `invalidatePostCache` - cache invalidation on updates
- **To verify**: Caching strategy implementation

### Webhooks
- Mentions `dispatchWebhook` - webhook dispatching
- **To verify**: Webhook events triggered correctly

---

## C. Documentation Analysis

### MCP Documentation
- **Status**: To be verified in `apps/api/src/routes/public/mcp.ts`
- **Priority**: High (per cursor rules)

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation** - Ensure all endpoints documented
- [ ] **Verify permissions** - Check all CRUD operations have proper permissions
- [ ] **Verify schema validation** - POST/PATCH operations
- [ ] **Optimize search queries** - Full-text search indexes
- [ ] **Verify webhook events** - Correct events dispatched

### Medium Priority
- [ ] **Add rate limiting** - Prevent abuse
- [ ] **Optimize large result sets** - Cursor-based pagination option
- [ ] **Add caching headers** - For public/read endpoints

---

## Related Audits
- Related pages: `posts.md`, `post-detail.md`
- Related routes: `api-routes/admin/post-detail.md`

