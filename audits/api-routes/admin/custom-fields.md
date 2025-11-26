# Custom Fields API Route Audit

## Route Information
- **Endpoint**: `GET/POST /api/admin/v1/organizations/:orgId/custom-fields`
- **File**: `apps/api/src/routes/admin/custom-fields.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /api/admin/v1/organizations/:orgId/custom-fields` - List custom fields
- `POST /api/admin/v1/organizations/:orgId/custom-fields` - Create custom field
- Additional endpoints in `custom-field-detail.ts`

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('custom-fields:read'|'create')`

### Query Parameters (GET)
- `page`, `per_page` - Pagination
- `search` - Search by name
- `field_type` - Filter by field type
- `sort` - Sort order

### Request Body (POST)
- Uses `createCustomFieldSchema`
- Validates slug uniqueness

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify all CRUD operations** - Check detail routes

---

## Related Audits
- Related pages: `custom-fields.md`
- Related routes: `api-routes/admin/custom-field-detail.md`

