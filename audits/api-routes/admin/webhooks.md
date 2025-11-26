# Webhooks API Route Audit

## Route Information
- **Endpoint**: `GET/POST /api/admin/v1/organizations/:orgId/webhooks`
- **File**: `apps/api/src/routes/admin/webhooks.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET /api/admin/v1/organizations/:orgId/webhooks` - List webhooks
- `POST /api/admin/v1/organizations/:orgId/webhooks` - Create webhook
- Additional endpoints in `webhook-detail.ts`

### Authentication
- Required: Yes
- Middleware: `authMiddleware`, `orgAccessMiddleware`, `permissionMiddleware('organizations:update')`

### Security
- Secret generation using crypto.getRandomValues (line 14-20)
- Secrets removed from list response (line 56-59)
- HMAC signing for webhooks

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify webhook delivery** - Test webhook dispatching
- [ ] **Verify secret security** - Never expose secrets

---

## Related Audits
- Related pages: `webhooks.md`
- Related routes: `api-routes/admin/webhook-detail.md`

