# Taxonomy Terms API Route Audit

## Route Information
- **Endpoint**: `GET/POST /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms`
- **File**: `apps/api/src/routes/admin/taxonomy-terms.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms` - List terms
- `POST /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms` - Create term
- Additional endpoints in `taxonomy-term-detail.ts`

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware`

### Special Features
- Hierarchical terms support (parentId)
- Validates parent exists in same taxonomy
- Includes parent/children relationships

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify circular parent prevention**
- [ ] **Verify all CRUD operations**

---

## Related Audits
- Related pages: `taxonomies.md`
- Related routes: `api-routes/admin/taxonomy-term-detail.md`

