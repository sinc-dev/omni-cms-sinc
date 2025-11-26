# Post From Template API Route Audit

## Route Information
- **Endpoint**: `POST /api/admin/v1/organizations/:orgId/posts/from-template`
- **File**: `apps/api/src/routes/admin/post-from-template.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `POST /:orgId/posts/from-template`
- Creates a new post from a template

### Authentication
- Required: Yes
- Permission: `posts:create`

### Request Body
- `templateId` - Template to use
- `title` - Post title
- `slug` - Post slug

### Special Features
- Copies template content and custom fields
- Creates post as draft
- Validates slug uniqueness

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify transaction handling** - Ensure atomic creation

---

## Related Audits
- Related routes: `api-routes/admin/templates.md`

