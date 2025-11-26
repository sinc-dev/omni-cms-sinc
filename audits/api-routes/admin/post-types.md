# Post Types API Route Audit

## Route Information
- **Endpoint**: `GET/POST /api/admin/v1/organizations/:orgId/post-types`
- **File**: `apps/api/src/routes/admin/post-types.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /api/admin/v1/organizations/:orgId/post-types` - List post types
- `POST /api/admin/v1/organizations/:orgId/post-types` - Create post type
- Additional endpoints in `post-type-detail.ts`

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware`

### Query Parameters (GET)
- `page`, `per_page` - Pagination
- `search` - Search by name

### Request Body (POST)
- Uses `createPostTypeSchema`
- Validates slug uniqueness
- Handles: name, slug, description, icon, isHierarchical, settings

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify all CRUD operations**
- [ ] **Verify field management** - Post type fields endpoints

---

## Related Audits
- Related pages: `post-types.md`
- Related routes: `api-routes/admin/post-type-detail.md`, `api-routes/admin/post-type-fields.md`

