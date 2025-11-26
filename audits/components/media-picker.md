# Media Picker Component Audit

## Component Information
- **Component Name**: MediaPicker
- **File**: `apps/web/src/components/editor/media-picker.tsx`
- **Type**: Media/Editor
- **Status**: ⏳ Pending Review

---

## A. Current State Analysis

### Component Purpose
- Dialog for selecting existing media
- Shows selected media thumbnail
- Allows changing/removing selected media

### Props Interface
```typescript
interface MediaPickerProps {
  value: string | null; // Media ID
  onChange: (mediaId: string | null) => void;
}
```

### Issues Identified
- Uses `setTimeout` to avoid setState in effect (line 35) - anti-pattern
- No fetch guards on media fetch
- Uses `any` types (line 24, 40)
- Effect dependency includes `handleError` which may cause re-renders

---

## C. Code Quality Analysis

### useEffect Dependencies
- Line 61: Includes `handleError` which may cause unnecessary re-fetches
- **Missing**: Fetch guards, AbortController
- Uses `setTimeout` workaround (anti-pattern)

### TypeScript
- Uses `any` types instead of proper interfaces
- Missing type definitions for media objects

---

## E. Improvements Needed

### Critical Issues
- [ ] Remove `setTimeout` anti-pattern
- [ ] Add fetch guards
- [ ] Fix TypeScript types (remove `any`)

### High Priority
- [ ] Add media browser dialog
- [ ] Add search/filter in picker
- [ ] Better loading states

---

## Related Audits
- Related pages: `post-detail.md`
- Related components: `MediaUploader`
- Related API routes: `api-routes/admin/media.md`

