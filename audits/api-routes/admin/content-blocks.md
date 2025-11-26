# Content Blocks API Route Audit

## Route Information
- **Endpoint**: `GET/POST /api/admin/v1/organizations/:orgId/content-blocks`
- **File**: `apps/api/src/routes/admin/content-blocks.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /api/admin/v1/organizations/:orgId/content-blocks` - List content blocks
- `POST /api/admin/v1/organizations/:orgId/content-blocks` - Create content block
- Additional endpoints in `content-block-detail.ts`

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('posts:read'|'create')`

### Request Body (POST)
- Uses `createContentBlockSchema`
- Block types: text, image, video, gallery, cta, code, embed
- Validates slug uniqueness

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify all CRUD operations**
- [ ] **Verify block type validation**

---

## Related Audits
- Related pages: `content-blocks.md`
- Related routes: `api-routes/admin/content-block-detail.md`

