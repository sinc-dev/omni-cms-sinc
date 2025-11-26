# Code Patterns Audit

## Overview
This document identifies code patterns, anti-patterns, and opportunities for standardization.

**Last Updated**: 2025-01-26

---

## Patterns Identified

### Good Patterns

1. **Organization Context**
   - Centralized organization state
   - Caching implemented
   - Good pattern to replicate

2. **Error Handler Hook**
   - Centralized error handling
   - Consistent API

### Anti-Patterns

1. **Missing Fetch Guards**
   - Many pages lack isFetchingRef/hasFetchedRef
   - Risk of infinite loops

2. **Browser confirm()**
   - Should use proper dialogs
   - Accessibility issue

3. **Large Components**
   - Some pages are 600+ lines
   - Hard to maintain

4. **Code Duplication**
   - Delete buttons duplicated
   - Similar patterns repeated

---

## Recommendations

1. **Create reusable hooks**
   - `useFetchWithGuards`
   - `useCachedData`
   - `useOptimisticUpdate`

2. **Extract common components**
   - Delete confirmation dialog
   - Common list patterns

3. **Document patterns**
   - Add to cursor rules
   - Create examples

---

## Related Audits
- Related: `DEBT.md`
- Related pages: All pages

