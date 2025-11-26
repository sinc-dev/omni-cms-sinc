# Prioritized Improvements List

This document compiles all findings from the systematic audit and prioritizes improvements.

**Last Updated**: 2025-01-27  
**Status**: In Progress - Updated with component audit findings

---

## Critical Issues (Must Fix Immediately)

### Components
1. **Replace window.prompt in TipTap Editor Toolbar**
   - File: `apps/web/src/components/editor/toolbar.tsx`
   - Issue: Uses `window.prompt()` for link/image insertion (poor UX, not accessible)
   - Fix: Create proper Dialog components, integrate MediaPicker
   - Impact: Critical UX and accessibility issue

2. **Add Error Handling for CustomFieldRenderer Settings Parsing**
   - File: `apps/web/src/components/editor/custom-field-renderer.tsx`
   - Issue: `JSON.parse(field.settings)` can throw, no try/catch
   - Fix: Wrap in try/catch with error handling
   - Impact: Component crashes on invalid JSON

3. **Add Field Validation to CustomFieldRenderer**
   - File: `apps/web/src/components/editor/custom-field-renderer.tsx`
   - Issue: No validation for required fields, min/max, patterns
   - Fix: Add validation with error display
   - Impact: Invalid data can be saved

### Authentication & Security
4. **Fix broken link in error.tsx** (Line 89)
   - File: `apps/web/src/app/error.tsx`
   - Issue: Links to `/admin` which redirects
   - Fix: Change to `/select-organization`
   - Impact: Users can't navigate from error page

### Code Quality
5. **Add fetch guards to posts page**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Issue: Large dependency array, no fetch guards
   - Fix: Add isFetchingRef, hasFetchedRef, AbortController
   - Impact: Prevents infinite loops

6. **Add fetch guards to dashboard page**
   - File: `apps/web/src/app/[orgId]/dashboard/page.tsx`
   - Issue: Missing fetch guards
   - Fix: Add isFetchingRef, AbortController
   - Impact: Prevents duplicate requests

### Dead Code
7. **Remove or redirect admin/page.tsx**
   - File: `apps/web/src/app/admin/page.tsx`
   - Issue: Duplicate of org-scoped dashboard
   - Fix: Remove or redirect to org dashboard
   - Impact: Reduces confusion and maintenance burden

8. **Consolidate duplicate organization pages**
   - Files: `admin/organizations/page.tsx` vs `organizations/page.tsx`
   - Issue: Potential duplicates
   - Fix: Compare and consolidate
   - Impact: Reduces code duplication

---

## High Priority (Should Fix Soon)

### Components
1. **Fix ProviderButton Loading State**
   - File: `apps/web/src/components/auth/provider-button.tsx`
   - Issue: Loading state may persist incorrectly after redirect
   - Fix: Implement proper cleanup or timeout
   - Impact: Button may appear stuck

2. **Fix CustomFieldRenderer Value Type Consistency**
   - File: `apps/web/src/components/editor/custom-field-renderer.tsx`
   - Issue: Inconsistent value types returned (strings, numbers, booleans)
   - Fix: Standardize type handling
   - Impact: Type confusion, potential bugs

3. **Replace Native Select in CustomFieldRenderer**
   - File: `apps/web/src/components/editor/custom-field-renderer.tsx`
   - Issue: Uses native `<select>` instead of shadcn/ui Select
   - Fix: Use shadcn/ui Select component
   - Impact: Inconsistent styling, no search/filter

4. **Improve Date/Time Handling in CustomFieldRenderer**
   - File: `apps/web/src/components/editor/custom-field-renderer.tsx`
   - Issue: Fragile string manipulation for dates
   - Fix: Use proper date picker component
   - Impact: Could fail with unexpected formats

5. **Fix RootNavMain Route Links**
   - File: `apps/web/src/components/root/nav-main.tsx`
   - Issue: Links to `/content` and `/settings` may not exist
   - Fix: Verify routes or remove/redirect
   - Impact: Broken navigation

### User Experience (Existing)

6. **Replace browser confirm with AlertDialog in posts page**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Issue: Uses browser `confirm()` for delete
   - Fix: Use AlertDialog component
   - Impact: Better accessibility and UX

2. **Add skeleton loaders to posts page**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Issue: Uses spinner instead of skeleton
   - Fix: Add skeleton table/cards
   - Impact: Better perceived performance

3. **Fix recent activity links in dashboard**
   - File: `apps/web/src/app/[orgId]/dashboard/page.tsx`
   - Issue: Links are placeholders (`#`)
   - Fix: Add proper navigation links
   - Impact: Users can navigate from activity

4. **Add error handling to filter data fetch in posts**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Issue: Only console.error, no user feedback
   - Fix: Add proper error handling
   - Impact: Users know when filters fail

### Performance
5. **Cache filter data in posts page**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Issue: Refetches postTypes/users on every org change
   - Fix: Cache in context or localStorage
   - Impact: Reduces API calls

6. **Cache dashboard stats**
   - File: `apps/web/src/app/[orgId]/dashboard/page.tsx`
   - Issue: Refetches on every org change
   - Fix: Cache stats data
   - Impact: Faster page loads

### Code Quality
7. **Optimize useEffect dependencies in posts page**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Issue: Large dependency array, `api` may change
   - Fix: Memoize api or use ref pattern
   - Impact: Prevents unnecessary re-renders

8. **Extract duplicate delete button code**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Issue: Delete logic duplicated in table and cards
   - Fix: Create reusable component
   - Impact: Reduces code duplication

---

## Medium Priority (Nice to Have)

### User Experience
1. **Add optimistic updates to posts delete**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Impact: Feels faster, better UX

2. **Improve empty state in posts page**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Impact: Better guidance for new users

3. **Add bulk actions to posts page**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Impact: Better productivity

4. **Add export functionality to posts**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Impact: Data portability

5. **Improve mobile experience for posts**
   - File: `apps/web/src/app/[orgId]/posts/page.tsx`
   - Impact: Better mobile usability

### Features
6. **Add keyboard shortcuts to posts page**
   - Impact: Power user productivity

7. **Add saved filter presets**
   - Impact: Faster filtering

8. **Add column customization**
   - Impact: Personalized experience

---

## Low Priority (Future Consideration)

1. Advanced search with operators
2. Real-time updates (WebSocket/polling)
3. Virtual scrolling for large lists
4. Quick filters as buttons
5. Search functionality in 404 page

---

## Patterns Identified

### Common Issues Across Pages
1. **Missing fetch guards** - Many pages lack isFetchingRef/hasFetchedRef
2. **No AbortController** - Requests not cancelled on unmount
3. **Large dependency arrays** - May cause unnecessary re-renders
4. **Browser confirm()** - Should use proper dialogs
5. **No skeleton loaders** - Generic spinners instead
6. **Duplicate code** - Similar patterns repeated

### Recommendations
- Create reusable hooks for common patterns
- Standardize error handling
- Create component library for common UI patterns
- Document best practices

---

## Next Steps

1. Fix critical issues first
2. Address high priority items
3. Create reusable components/hooks
4. Document patterns and best practices
5. Continue systematic audit of remaining pages

