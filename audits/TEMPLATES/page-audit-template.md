# Page Audit Template

## Page Information
- **Route**: `/path/to/page`
- **File**: `apps/web/src/app/path/to/page.tsx`
- **Status**: [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Needs Review

---

## A. Current State Analysis

### Route Structure
- URL pattern: 
- Authentication required: Yes/No
- Authorization required: Yes/No
- Organization-scoped: Yes/No

### Data Fetching
- Methods used: `useEffect`, `useQuery`, etc.
- API endpoints called:
- Loading states:
- Error handling:

### Component Structure
```
Component Hierarchy:
- Page Component
  - Sub-component 1
  - Sub-component 2
```

### State Management
- Local state (useState):
- Context usage:
- Props drilling:

---

## B. User Experience Analysis

### What Users See
```
Visual Layout (ASCII or description):
┌─────────────────────────────────────┐
│  Header/Navigation                   │
│  ┌───────────────────────────────┐  │
│  │  Content Area                  │  │
│  │                                │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### User Thoughts & Expectations
- What users expect to see:
- What users might be confused about:
- Missing context or information:

### Information Hierarchy
- Primary actions:
- Secondary actions:
- Information display order:

### Loading States
- Initial load:
- Data refresh:
- Action feedback:

### Empty States
- When no data:
- When no permissions:
- When error occurs:

### Error States
- Network errors:
- Validation errors:
- Permission errors:

### Mobile Responsiveness
- Layout on mobile:
- Touch targets:
- Navigation:

---

## C. Code Quality Analysis

### useEffect Dependencies
- Dependencies array:
- Potential infinite loops:
- Missing dependencies:
- Fetch guards present: Yes/No

### Error Handling
- Try-catch blocks:
- Error boundaries:
- User-facing error messages:
- Error logging:

### TypeScript
- Type safety:
- Any types used:
- Missing type definitions:

### Code Duplication
- Duplicated logic:
- Opportunities for reuse:

### Performance
- Unnecessary re-renders:
- Missing memoization:
- Large bundle impact:
- API call optimization:

---

## D. Functionality Analysis

### Missing Features
- Features mentioned but not implemented:
- Expected features not present:

### Broken Features
- Features that don't work:
- Edge cases not handled:

### Incomplete Implementations
- Partially implemented features:
- Placeholder code:

### Edge Cases
- Empty data:
- Large datasets:
- Network failures:
- Concurrent modifications:

---

## E. Improvements Needed

### Critical Issues
- [ ] Issue 1: Description
- [ ] Issue 2: Description

### High Priority
- [ ] Improvement 1: Description
- [ ] Improvement 2: Description

### Medium Priority
- [ ] Improvement 1: Description
- [ ] Improvement 2: Description

### Low Priority
- [ ] Improvement 1: Description
- [ ] Improvement 2: Description

---

## Recommendations

### Immediate Actions
1. Action item 1
2. Action item 2

### Future Considerations
1. Future improvement 1
2. Future improvement 2

---

## Related Audits
- Related pages:
- Related components:
- Related API routes:

