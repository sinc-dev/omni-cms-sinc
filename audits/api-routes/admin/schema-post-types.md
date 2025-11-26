# Post Type Schema API Route Audit

## Route Information
- **Endpoint**: `GET /api/admin/v1/organizations/:orgId/schema/post-types/:postTypeId`
- **File**: `apps/api/src/routes/admin/schema-post-types.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /:orgId/schema/post-types/:postTypeId`
- Returns schema for a specific post type

### Purpose
- API discovery (HubSpot-style)
- Properties, validation rules, enums
- Custom fields for post type

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Add caching** - Schema changes infrequently

---

## Related Audits
- Related routes: `api-routes/admin/schema.md`
- Related components: `PostTypeSchemaViewer`

