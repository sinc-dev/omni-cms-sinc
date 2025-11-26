# Taxonomy Detail API Route Audit

## Route Information
- **Endpoint**: `GET/PATCH/DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId`
- **File**: `apps/api/src/routes/admin/taxonomy-detail.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET` - Get taxonomy with terms
- `PATCH` - Update taxonomy
- `DELETE` - Delete taxonomy (checks for existing terms/posts)

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware`

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify cascade delete** - Handle terms when taxonomy deleted

---

## Related Audits
- Related pages: `taxonomies.md`
- Related routes: `api-routes/admin/taxonomies.md`

