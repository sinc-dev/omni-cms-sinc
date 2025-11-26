# Editor Toolbar Component Audit

## Component Information
- **Component Name**: EditorToolbar
- **File**: `apps/web/src/components/editor/toolbar.tsx`
- **Type**: Editor
- **Status**: ⏳ Needs Review

---

## A. Current State Analysis

### Component Purpose
- Toolbar for TipTap rich text editor
- Formatting buttons (bold, italic, headings, etc.)
- Link and image insertion

### Issues Identified
- **Line 29, 36**: Uses `window.prompt()` (poor UX)
- No proper link/image insertion dialogs

---

## E. Improvements Needed

### High Priority
- [ ] **Replace window.prompt** - Use proper dialogs for link/image insertion
- [ ] **Better UX** - Visual dialogs with validation

---

## Related Audits
- Related components: `TipTapEditor`

