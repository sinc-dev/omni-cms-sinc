# API Key Rotate API Route Audit

## Route Information
- **Endpoint**: `POST /api/admin/v1/organizations/:orgId/api-keys/:keyId/rotate`
- **File**: `apps/api/src/routes/admin/api-key-rotate.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `POST /:orgId/api-keys/:keyId/rotate`
- Rotates an API key

### Authentication
- Required: Yes
- Permission: `organizations:update`

### Special Features
- Creates new key with same scopes
- Revokes old key immediately
- Tracks rotation chain (`rotatedFromId`)
- Returns new plain key (only shown once)

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify key uniqueness** - Retry logic implemented
- [ ] **Verify transaction handling** - Ensure atomic rotation

---

## Related Audits
- Related routes: `api-routes/admin/api-key-detail.md`

