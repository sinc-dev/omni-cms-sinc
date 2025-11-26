# Webhook Detail API Route Audit

## Route Information
- **Endpoint**: `GET/PATCH/DELETE /api/admin/v1/organizations/:orgId/webhooks/:webhookId`
- **File**: `apps/api/src/routes/admin/webhook-detail.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET` - Get webhook (secret not returned)
- `PATCH` - Update webhook
- `DELETE` - Delete webhook

### Security
- Secrets never returned in responses

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**

---

## Related Audits
- Related routes: `api-routes/admin/webhooks.md`

