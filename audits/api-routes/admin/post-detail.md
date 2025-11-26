# Post Detail API Route Audit

## Route Information
- **Endpoint**: `GET/PATCH/DELETE /api/admin/v1/organizations/:orgId/posts/:postId`
- **File**: `apps/api/src/routes/admin/post-detail.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /api/admin/v1/organizations/:orgId/posts/:postId` - Get post with related data
- `PATCH /api/admin/v1/organizations/:orgId/posts/:postId` - Update post
- `DELETE` - Likely in this file or posts.ts

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('posts:read'|'posts:update')`

### Authorization
- Organization access: `orgAccessMiddleware`
- Permission checks: `permissionMiddleware` with specific permissions

### Request Body (PATCH)
- Uses `updatePostSchema` for validation
- Handles: customFields, taxonomies, relationships, autoSave, scheduledPublishAt
- **To verify**: All fields validated correctly

### Response Structure
- Includes related data (author, postType, fieldValues)
- Taxonomies fetched separately

---

## B. Implementation Analysis

### Database Queries
- Uses Drizzle ORM with relationships
- Multiple queries (post, taxonomies separately)
- **Potential issue**: Separate taxonomy query (could be optimized)

### Input Validation
- ✅ Uses Zod schema (`updatePostSchema`)
- ✅ Proper error handling for validation
- ✅ Handles complex nested data

### Special Features
- Auto-save support (bypasses versioning)
- Version creation (via `createPostVersion`)
- Cache invalidation
- Webhook dispatching

### Error Handling
- ✅ Proper error responses
- ✅ Validation error handling
- ✅ Not found handling

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation** - Ensure all endpoints documented
- [ ] **Optimize taxonomy query** - Include in main query if possible
- [ ] **Verify versioning** - Ensure versions created correctly
- [ ] **Verify cache invalidation** - Cache cleared on updates

### Medium Priority
- [ ] **Verify auto-save behavior** - No versioning created
- [ ] **Verify webhook events** - Correct events dispatched

---

## Related Audits
- Related pages: `post-detail.md`, `post-new.md`
- Related routes: `api-routes/admin/posts.md`

