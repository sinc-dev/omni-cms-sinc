# Post Workflow API Route Audit

## Route Information
- **Endpoint**: `POST /api/admin/v1/organizations/:orgId/posts/:postId/workflow`
- **File**: `apps/api/src/routes/admin/post-workflow.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### Purpose
- Content review workflow
- Submit, approve, reject actions
- Reviewer assignment
- Comments on workflow actions

### Query Parameters
- `action` - submit, approve, reject

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Verify notification system** - Notify reviewers

---

## Related Audits
- Related pages: `reviews.md`

