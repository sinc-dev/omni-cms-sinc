# Taxonomies Page Audit

## Page Information
- **Route**: `/:orgId/taxonomies`
- **File**: `apps/web/src/app/[orgId]/taxonomies/page.tsx`
- **Status**: ⏳ Pending Review

---

## A. Current State Analysis

### Route Structure
- URL pattern: `/:orgId/taxonomies`
- Authentication required: Yes
- Organization-scoped: Yes

### Data Fetching
- Methods used: `useEffect`, `useCallback`
- API endpoints: `api.getTaxonomies()`
- Hierarchical term tree structure

### Component Structure
```
TaxonomiesPage
  - Taxonomy list
  - TermTree component (recursive)
  - Create/edit dialogs
  - Search functionality
```

### Special Features
- Hierarchical term tree (recursive component)
- Expandable/collapsible terms
- Search filtering

---

## B. User Experience Analysis

### What Users See
```
┌─────────────────────────────────────────────────────────┐
│  Taxonomies                        [+ New Taxonomy]     │
│                                                          │
│  [Search...]                                            │
│                                                          │
│  Categories                             [+ Add Term]   │
│  ├─ Technology          [Edit] [Delete]                │
│  │  ├─ Web Development                                 │
│  │  └─ Mobile Development                              │
│  └─ Business                                           │
│                                                          │
│  Tags                              [+ Add Term]        │
│  ├─ News                                                │
│  └─ Updates                                             │
└─────────────────────────────────────────────────────────┘
```

### User Thoughts
- ✅ Clear hierarchical structure
- ✅ Good visual organization
- ❓ What's the difference between taxonomy and term?
- ❓ How do I reorder terms?

---

## E. Improvements Needed

### High Priority
- [ ] Add fetch guards
- [ ] Improve empty states
- [ ] Add drag-and-drop reordering
- [ ] Better mobile experience for tree

### Medium Priority
- [ ] Bulk term operations
- [ ] Term usage count
- [ ] Import/export taxonomies

---

## Related Audits
- Related components: `TaxonomySelector` (in editor)
- Related API routes: `api-routes/admin/taxonomies.md`

