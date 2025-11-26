# Performance Audit

## Overview
This document identifies performance bottlenecks and optimization opportunities.

**Last Updated**: 2025-01-26

---

## Identified Issues

### API Call Optimization

**Issue**: Redundant API calls
- **Location**: Multiple pages
- **Impact**: Slower loads, unnecessary server load
- **Examples**:
  - Posts page refetches filter data on every org change
  - Dashboard refetches stats on every org change
- **Solution**: Implement caching strategy
- **Priority**: High

### Rendering Performance

**Issue**: Large dependency arrays causing re-renders
- **Location**: Posts page, others
- **Impact**: Unnecessary re-renders
- **Solution**: Memoization, ref patterns
- **Priority**: Medium

### Loading States

**Issue**: Generic spinners instead of skeletons
- **Location**: Posts page, others
- **Impact**: Poor perceived performance
- **Solution**: Skeleton loaders
- **Priority**: Medium

---

## Recommendations

1. **Implement caching layer** (React Query, SWR, or custom)
2. **Add request cancellation** (AbortController)
3. **Optimize useEffect dependencies**
4. **Add skeleton loaders** throughout
5. **Consider code splitting** for large pages

---

## Metrics to Track

- API call count per page load
- Time to interactive
- First contentful paint
- Bundle size
- Re-render frequency

---

## Related Audits
- Related pages: All pages
- Related components: All components
- Related: `DEBT.md`

