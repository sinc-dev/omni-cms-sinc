# Component Audit Template

## Component Information
- **Component Name**: ComponentName
- **File**: `apps/web/src/components/category/component-name.tsx`
- **Type**: Form | Navigation | Data Display | Modal | Feedback
- **Status**: [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Needs Review

---

## A. Current State Analysis

### Component Purpose
- Primary function:
- Used in pages:
- Reusability:

### Props Interface
```typescript
interface ComponentProps {
  // Props definition
}
```

### State Management
- Internal state:
- External state (context/props):
- Side effects:

### Dependencies
- External libraries:
- Internal dependencies:
- Peer dependencies:

---

## B. User Experience Analysis

### Visual Design
- Appearance:
- Accessibility:
- Responsive design:
- Dark mode support:

### Interaction Patterns
- User interactions:
- Feedback mechanisms:
- Loading states:
- Error states:

### Accessibility
- ARIA labels:
- Keyboard navigation:
- Screen reader support:
- Focus management:

---

## C. Code Quality Analysis

### TypeScript
- Type safety:
- Prop types:
- Generic types:
- Type inference:

### Performance
- Re-render optimization:
- Memoization:
- Lazy loading:
- Bundle size impact:

### Code Organization
- Component structure:
- Separation of concerns:
- Code duplication:
- Reusability:

### Error Handling
- Error boundaries:
- Error states:
- Fallback UI:
- Error logging:

---

## D. Functionality Analysis

### Features
- Implemented features:
- Missing features:
- Broken features:

### Edge Cases
- Empty states:
- Loading states:
- Error states:
- Boundary conditions:

### Integration
- Works with other components:
- API integration:
- State management:

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

## Usage Examples

```tsx
// Example usage
<ComponentName
  prop1="value1"
  prop2={value2}
/>
```

## Related Audits
- Related components:
- Related pages:
- Related API routes:

