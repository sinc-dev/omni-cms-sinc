# Schema API Route Audit

## Route Information
- **Endpoint**: `GET /api/admin/v1/organizations/:orgId/schema`
- **File**: `apps/api/src/routes/admin/schema.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /api/admin/v1/organizations/:orgId/schema`
- Returns comprehensive schema/metadata (HubSpot-style)

### Purpose
- Content structure discovery
- Post types, custom fields, taxonomies
- Relationship types, field types
- Color mappings for visualization

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Add caching** - Schema changes infrequently

---

## Related Audits
- Related components: `DatabaseSchemaViewer`, `PostTypeSchemaViewer`

