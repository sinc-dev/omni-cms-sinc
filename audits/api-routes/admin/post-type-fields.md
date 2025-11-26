# Post Type Fields API Route Audit

## Route Information
- **Endpoint**: `GET/POST/PATCH/DELETE /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields`
- **File**: `apps/api/src/routes/admin/post-type-fields.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /:orgId/post-types/:postTypeId/fields` - List attached fields
- `POST /:orgId/post-types/:postTypeId/fields` - Attach field
- `PATCH /:orgId/post-types/:postTypeId/fields/reorder` - Reorder fields
- `DELETE /:orgId/post-types/:postTypeId/fields/:fieldId` - Detach field

### Authentication
- Required: Yes
- Permissions: `post-types:read`, `post-types:update`

### Special Features
- Field ordering support
- Required field designation
- Default values

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify field validation** - Ensure custom field exists

---

## Related Audits
- Related pages: `post-types.md`
- Related routes: `api-routes/admin/post-types.md`

