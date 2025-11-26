# Admin Search API Route Audit

## Route Information
- **Endpoint**: `POST/GET /api/admin/v1/organizations/:orgId/search`
- **File**: `apps/api/src/routes/admin/search.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `POST /api/admin/v1/organizations/:orgId/search` - Advanced search (HubSpot-style)
- `GET /api/admin/v1/organizations/:orgId/search` - Simple search (backward compatibility)

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('posts:read')`

### Special Features
- Advanced search with filter groups
- Cursor pagination support
- Property selection
- Simple GET endpoint for backward compatibility

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify search performance**
- [ ] **Add caching for common searches**

---

## Related Audits
- Related pages: `search.md`
- Related routes: `api-routes/public/search.md`

