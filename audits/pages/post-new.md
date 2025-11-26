# Create Post Page Audit

## Page Information
- **Route**: `/:orgId/posts/new`
- **File**: `apps/web/src/app/[orgId]/posts/new/page.tsx`
- **Status**: ⏳ Pending Review

---

## A. Current State Analysis

### Route Structure
- URL pattern: `/:orgId/posts/new`
- Authentication required: Yes
- Organization-scoped: Yes

### Component Structure
- Similar to EditPostPage
- TipTapEditor
- Custom fields
- Media picker
- Taxonomy selector
- Auto-save

---

## B. User Experience Analysis

### What Users See
- Similar to edit page but with empty form
- Auto-save starts when fields are filled
- Post type selection required

### User Thoughts
- ✅ Clear purpose
- ❓ What post type should I choose?
- ❓ Can I duplicate an existing post?

---

## E. Improvements Needed

### High Priority
- [ ] Add post type selection if not chosen
- [ ] Add template selection
- [ ] Add "Duplicate from existing" option
- [ ] Better onboarding for new users

---

## Related Audits
- Related pages: `post-detail.md`, `posts.md`
- Related components: Editor components

