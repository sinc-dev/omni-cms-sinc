# User Detail API Route Audit

## Route Information
- **Endpoint**: `GET/PATCH/DELETE /api/admin/v1/organizations/:orgId/users/:userId`
- **File**: `apps/api/src/routes/admin/user-detail.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Methods & Paths
- `GET` - Get user membership details
- `PATCH` - Update user role in organization
- `DELETE` - Remove user from organization

### Authentication
- Required: Yes
- Permissions: `users:read`, `users:update`, `users:delete`

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify last admin prevention** - Can't remove last admin
- [ ] **Verify cascade cleanup** - User data when removed

---

## Related Audits
- Related pages: `users.md`
- Related routes: `api-routes/admin/users.md`

