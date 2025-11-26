# Relationship Selector Component Audit

## Component Information
- **Component Name**: RelationshipSelector
- **File**: `apps/web/src/components/posts/relationship-selector.tsx`
- **Type**: Form/Editor
- **Status**: ⏳ Needs Review

---

## A. Current State Analysis

### Component Purpose
- Dialog for creating relationships
- Search and select posts
- Choose relationship type

### Issues Identified
- **Uses setTimeout workaround** - Line 62-66 (anti-pattern)
- **Missing fetch guards** - Line 69-88 useEffect
- Dependencies include functions

---

## E. Improvements Needed

### High Priority
- [ ] **Remove setTimeout anti-pattern**
- [ ] **Add fetch guards**
- [ ] **Fix dependencies**

---

## Related Audits
- Related pages: `post-detail.md`
- Related components: `RelationshipList`

