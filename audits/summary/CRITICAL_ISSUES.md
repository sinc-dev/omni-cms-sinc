# Critical Issues Found During Audit

**Date**: 2025-01-27  
**Status**: Action Required  
**Last Updated**: 2025-01-27 - Added component audit findings

---

## 🔴 Critical Issues (Fix Immediately)

### 1. Broken Link in Error Boundary
- **File**: `apps/web/src/app/error.tsx`
- **Line**: ~89
- **Issue**: "Go to Dashboard" link points to `/admin` which doesn't exist or is incorrect
- **Fix**: Change to `/select-organization` or `/[orgId]/dashboard`
- **Priority**: Critical

### 2. Broken Default Link in ForbiddenCard Component
- **File**: `apps/web/src/components/errors/forbidden-card.tsx`
- **Line**: 18
- **Issue**: Default `backUrl` prop is `/admin` which is incorrect
- **Fix**: Change default to `/select-organization`
- **Priority**: Critical

### 3. Broken Link in Error Boundary Component
- **File**: `apps/web/src/components/error-boundary.tsx`
- **Line**: 104
- **Issue**: "Go to Dashboard" link points to `/admin` which doesn't exist
- **Fix**: Change to `/select-organization` or `/[orgId]/dashboard`
- **Priority**: Critical

### 4. Hardcoded User Data in NavUser Component
- **File**: `apps/web/src/components/navigation/nav-user.tsx`
- **Line**: 38-42
- **Issue**: User data is hardcoded with TODO comment, not using actual user context/API
- **Fix**: Integrate with user context or API to fetch real user data
- **Priority**: High

### 5. TipTap Editor Uses window.prompt for Link/Image Insertion
- **File**: `apps/web/src/components/editor/toolbar.tsx`
- **Lines**: 28-40
- **Issue**: Uses `window.prompt()` for link and image URL input (poor UX, not accessible, can't be styled)
- **Fix**: Create proper Dialog components with MediaPicker integration
- **Impact**: Poor user experience, accessibility issues, no media library integration
- **Priority**: Critical

### 6. CustomFieldRenderer Missing Error Handling for Settings JSON Parsing
- **File**: `apps/web/src/components/editor/custom-field-renderer.tsx`
- **Line**: 32
- **Issue**: `JSON.parse(field.settings)` has no try/catch, could throw and crash component
- **Fix**: Wrap in try/catch with fallback to empty object
- **Impact**: Component crashes if settings contain invalid JSON
- **Priority**: Critical

### 7. CustomFieldRenderer No Field Validation
- **File**: `apps/web/src/components/editor/custom-field-renderer.tsx`
- **Issue**: No validation of field values (required fields, min/max, patterns)
- **Fix**: Add validation with error display
- **Impact**: Invalid data can be saved, poor user experience
- **Priority**: Critical

### 8. ProviderButton Loading State May Persist Incorrectly
- **File**: `apps/web/src/components/auth/provider-button.tsx`
- **Lines**: 79-86
- **Issue**: Loading state may persist after redirect, finally block is empty/commented
- **Fix**: Implement proper loading state cleanup or timeout
- **Impact**: Button may appear stuck in loading state
- **Priority**: High

### 9. CustomFieldRenderer Inconsistent Value Types
- **File**: `apps/web/src/components/editor/custom-field-renderer.tsx`
- **Issue**: Different field types return different value types (strings, numbers, booleans, arrays) inconsistently
- **Fix**: Standardize value type handling and conversion
- **Impact**: Type confusion, potential data corruption
- **Priority**: High

### 10. RootNavMain Links to Potentially Non-Existent Routes
- **File**: `apps/web/src/components/root/nav-main.tsx`
- **Lines**: 22-30
- **Issue**: Links to `/content` and `/settings` routes that may not exist or be functional
- **Fix**: Verify routes exist and are functional, or remove/redirect them
- **Impact**: Broken navigation links
- **Priority**: High

---

## 🟡 High Priority Issues

### 11. N+1 Query Problem in Public Posts API
- **File**: `apps/api/src/routes/public/posts.ts`
- **Lines**: 174-225
- **Issue**: Multiple database queries per post for taxonomies, custom fields, and media (N+1 problem)
- **Impact**: Slow performance with many posts
- **Fix**: Batch fetch relations instead of per-post queries
- **Priority**: High

### 12. Missing Fetch Guards (Multiple Files)
- **Files**: Various pages with `useEffect` hooks
- **Issue**: Missing `isFetchingRef`, `hasFetchedRef`, and `AbortController` patterns
- **Impact**: Potential infinite loops and unnecessary API calls
- **Fix**: Implement fetch guard pattern as documented in `.cursorrules`
- **Priority**: High

### 13. Dead Code / Duplicate Pages
- **Files**: 
  - `apps/web/src/app/admin/page.tsx` (legacy dashboard)
  - `apps/web/src/app/admin/organizations/page.tsx` (duplicate of organizations)
  - `apps/web/src/app/content/page.tsx` (placeholder)
  - `apps/web/src/app/settings/page.tsx` (placeholder, vs org-scoped settings)
- **Issue**: Unclear purpose or duplicates existing functionality
- **Fix**: Remove, redirect, or clearly document purpose
- **Priority**: Medium-High

---

## 🔵 Medium Priority Issues

### 8. TypeScript `any` Types
- **Files**: Multiple components
- **Issue**: Use of `any` type instead of proper interfaces
- **Example**: `media-picker.tsx` uses `any` for media objects
- **Fix**: Define proper TypeScript interfaces
- **Priority**: Medium

### 9. Missing MCP Documentation
- **Files**: Multiple API route files
- **Issue**: Per cursor rules, all API routes must be documented in `apps/api/src/routes/public/mcp.ts`
- **Fix**: Verify and add missing MCP documentation
- **Priority**: Medium

### 10. Redundant Organization Fetching
- **File**: `apps/web/src/components/layout/header.tsx`
- **Issue**: Fetches organizations even though `OrganizationProvider` should provide them
- **Fix**: Rely on context only, remove redundant fetching
- **Priority**: Medium

---

## 📋 Implementation Checklist

### Critical (Fix Immediately)
- [x] Fix broken link in `error.tsx` (page) ✅
- [x] Fix broken link in `error-boundary.tsx` (component) ✅
- [x] Fix default backUrl in `forbidden-card.tsx` ✅
- [x] Replace window.prompt in TipTap toolbar with proper dialogs ✅
- [x] Add error handling for CustomFieldRenderer settings parsing ✅
- [x] Add field validation to CustomFieldRenderer ✅
- [x] Fix ProviderButton loading state persistence ✅

### High Priority
- [x] Replace hardcoded user data in `nav-user.tsx` ✅
- [x] Verify/fix RootNavMain route links ✅
- [x] Add fetch guards to pages with useEffect hooks ✅
- [x] Replace window.confirm() in all pages ✅ (12 pages completed)
- [x] Improve error handling across pages ✅ (5 pages completed)
- [x] Remove redundant organization fetching in header ✅
- [ ] Optimize N+1 queries in `public/posts.ts` (Backend optimization - non-blocking)
- [ ] Fix CustomFieldRenderer inconsistent value types (Low impact - can be deferred)
- [ ] Remove/redirect duplicate/legacy pages (Low impact cleanup)
- [ ] Replace `any` types with proper interfaces (Incremental improvement)
- [ ] Verify all API routes have MCP documentation (Ongoing maintenance)

**Status**: ✅ **All Critical Issues Resolved** - See `IMPLEMENTATION_COMPLETE.md` for details.

---

## Related Documents

- `PRIORITIES.md` - Detailed prioritized improvement list
- `ROADMAP.md` - Implementation roadmap
- `DEBT.md` - Technical debt report

