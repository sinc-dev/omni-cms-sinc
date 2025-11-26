# Relation Picker Component Audit

## Component Information
- **Component Name**: RelationPicker
- **File**: `apps/web/src/components/editor/relation-picker.tsx`
- **Type**: Editor/Form
- **Status**: ⏳ Needs Review

---

## A. Current State Analysis

### Component Purpose
- Pick related posts
- Dialog for searching and selecting posts

### Issues Identified
- **Line 37-41**: Uses `setTimeout` workaround (anti-pattern)
- **Missing fetch guards** - Line 35-64 useEffect
- Uses `any` types (line 26, 43, 66)

---

## E. Improvements Needed

### Critical Issues
- [ ] **Remove setTimeout anti-pattern**
- [ ] **Add fetch guards**
- [ ] **Fix TypeScript types** - Remove `any`

---

## Related Audits
- Related pages: `post-detail.md`
- Related components: `MediaPicker`

