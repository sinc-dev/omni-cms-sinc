# Unauthorized Page Audit

## Page Information
- **Route**: `/unauthorized`
- **File**: `apps/web/src/app/unauthorized/page.tsx`
- **Status**: ✅ Good (needs minor improvements)

---

## A. Current State Analysis

### Route Structure
- URL pattern: `/unauthorized`
- Authentication required: No (error page)
- Organization-scoped: No

### Component Structure
- Simple error page with card layout
- Sign in button with redirect
- Home button

---

## B. User Experience Analysis

### What Users See
```
┌─────────────────────────────────────┐
│         [Alert Icon]                │
│    Authentication Required          │
│                                     │
│  You need to be authenticated...    │
│                                     │
│  [Sign In]                          │
│  [Go to Home]                       │
│                                     │
│  Contact admin if issue persists    │
└─────────────────────────────────────┘
```

### Issues
- ✅ Clear message
- ✅ Good navigation options
- ⚠️ "Go to Home" redirects to `/` which then redirects (could be more direct)

---

## E. Improvements Needed

### Medium Priority
- [ ] Make "Go to Home" redirect to `/select-organization` if authenticated, `/sign-in` if not
- [ ] Add helpful context about why they're seeing this page

---

## Related Audits
- Related pages: `forbidden.md`, `error-boundary.md`

