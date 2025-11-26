# Taxonomy Term Detail API Route Audit

## Route Information
- **Endpoint**: `PATCH/DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId`
- **File**: `apps/api/src/routes/admin/taxonomy-term-detail.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `PATCH` - Update taxonomy term
- `DELETE` - Delete taxonomy term

### Authentication
- Required: Yes
- Permission: `taxonomies:update`

### Special Features
- Validates parentId exists in same taxonomy
- Handles hierarchical terms

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify circular parent prevention**

---

## Related Audits
- Related routes: `api-routes/admin/taxonomy-terms.md`

