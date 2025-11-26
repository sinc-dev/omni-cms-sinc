# Admin Dashboard Page Audit (Legacy)

## Page Information
- **Route**: `/admin`
- **File**: `apps/web/src/app/admin/page.tsx`
- **Status**: ⚠️ Legacy/Duplicate - Should be consolidated with `/:orgId/dashboard`

---

## A. Current State Analysis

### Route Structure
- URL pattern: `/admin`
- Authentication required: Yes
- Authorization required: Yes
- Organization-scoped: No (legacy route)

### Data Fetching
- Methods used: `useEffect`
- API endpoints called:
  - Same as org-scoped dashboard (posts, media, users, taxonomies)
- Loading states: `orgLoading` from context
- Error handling: `useErrorHandler` hook

### Component Structure
```
AdminDashboard
  - Loading State
  - Empty State (no organization)
  - DashboardContent
    - Stats Grid (4 cards)
    - RecentActivity component
```

---

## B. User Experience Analysis

### What Users See
```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                                               │
│  Welcome to [Organization Name]                         │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Posts    │ │ Media    │ │ Users    │ │ Taxonomies│  │
│  │   128    │ │    45    │ │    12    │ │     8     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Recent Activity                                   │  │
│  │  • Post "Homepage" was updated by Alex (5m ago) │  │
│  │  • Media "hero.jpg" was uploaded (1h ago)        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### User Thoughts & Expectations
- ❓ **Route confusion**: Users might not understand difference between `/admin` and `/:orgId/dashboard`
- ✅ **Same functionality**: Identical to org-scoped dashboard
- ⚠️ **Broken links**: Recent activity links are placeholders (`#`)
- ❓ **Navigation confusion**: Which dashboard should users use?

### Issues Identified
- ⚠️ **Duplicate functionality**: Same as `/:orgId/dashboard`
- ⚠️ **Broken activity links**: All links are `#` placeholders
- ⚠️ **Organization dependency**: Still requires organization context
- ⚠️ **Route inconsistency**: Uses `/admin` instead of org-scoped route

---

## E. Recommendations

### High Priority
- [ ] **CONSOLIDATE**: Redirect `/admin` to `/:orgId/dashboard`
- [ ] **REMOVE**: Delete this page after redirect is implemented
- [ ] Fix activity links if keeping (currently all `#`)

### Status
- **Recommendation**: **Remove/Redirect** - This is a duplicate page that should be consolidated with the org-scoped dashboard.

---

## Related Audits
- Related pages: `dashboard.md` (org-scoped dashboard - use this instead)
- Related components: Dashboard components

