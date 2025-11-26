# Object Type Schema API Route Audit

## Route Information
- **Endpoint**: `GET /api/admin/v1/organizations/:orgId/schema/:objectType`
- **File**: `apps/api/src/routes/admin/schema-object-type.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /:orgId/schema/:objectType`
- Returns schema for object types: posts, media, users, taxonomies

### Purpose
- API discovery
- Provides properties, enums, validation rules

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Add caching**

---

## Related Audits
- Related routes: `api-routes/admin/schema.md`

