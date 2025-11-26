# Content Block Detail API Route Audit

## Route Information
- **Endpoint**: `GET/PATCH/DELETE /api/admin/v1/organizations/:orgId/content-blocks/:blockId`
- **File**: `apps/api/src/routes/admin/content-block-detail.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET` - Get content block
- `PATCH` - Update content block
- `DELETE` - Delete content block

### Authentication
- Required: Yes
- Permissions: `posts:read`, `posts:update`, `posts:delete`

### Special Features
- Slug conflict checking on update

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**

---

## Related Audits
- Related routes: `api-routes/admin/content-blocks.md`

