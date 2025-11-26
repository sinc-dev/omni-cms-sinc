# Export API Route Audit

## Route Information
- **Endpoint**: `POST /api/admin/v1/organizations/:orgId/export`
- **File**: `apps/api/src/routes/admin/export.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `POST /api/admin/v1/organizations/:orgId/export`
- Exports organization data as JSON

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('organizations:read')`

### Response
- Returns JSON file (text/plain)
- Content-Disposition header for download

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify large data handling** - Streaming for large exports
- [ ] **Add progress tracking** - For long-running exports

---

## Related Audits
- Related components: `ExportDialog`
- Related pages: `settings.md`

