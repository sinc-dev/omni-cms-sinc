# Posts Page Audit

## Page Information
- **Route**: `/:orgId/posts`
- **File**: `apps/web/src/app/[orgId]/posts/page.tsx`
- **Status**: ⏳ Pending Review

---

## A. Current State Analysis

### Route Structure
- URL pattern: `/:orgId/posts`
- Authentication required: Yes (via `[orgId]/layout.tsx`)
- Authorization required: Yes (organization access)
- Organization-scoped: Yes

### Data Fetching
- Methods used: `useEffect` with multiple dependencies
- API endpoints called:
  - `api.getPosts(params)` - Main posts list
  - `api.getPostTypes()` - For filter dropdown
  - `api.getUsers()` - For author filter
- Loading states: `loading` state variable
- Error handling: `useErrorHandler` hook with `withErrorHandling` wrapper

### Component Structure
```
PostsPage
  - FilterBar (search, filters, sort)
  - Loading state (Spinner)
  - Error state
  - Empty state
  - Desktop Table View
  - Mobile Card View
  - Pagination
```

### State Management
- Local state (useState):
  - `posts`, `postTypes`, `users`
  - `loading`, `page`, `perPage`, `total`
  - `search`, `debouncedSearch`
  - `createdDateRange`, `publishedDateRange`
- Context usage: `useOrganization`, `useApiClient`
- URL params: `useFilterParams` hook for filter persistence

---

## B. User Experience Analysis

### What Users See
```
┌─────────────────────────────────────────────────────────┐
│  Posts                              [+ New Post]        │
│  Manage your content posts                              │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Search...]  [Status ▼] [Type ▼] [Author ▼]    │  │
│  │  [Date Filters] [Sort ▼] [Clear All]             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Title    │ Type │ Status │ Author │ Updated │ ⚙ │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Post 1   │ Blog │ Pub    │ John   │ 1/1/25  │ ⚙ │  │
│  │  Post 2   │ Page │ Draft  │ Jane   │ 1/2/25  │ ⚙ │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Showing 1-20 of 100 posts  [< Previous] [Next >]      │
└─────────────────────────────────────────────────────────┘
```

### User Thoughts & Expectations
- ✅ Clear what the page does (list of posts)
- ✅ Easy to filter and search
- ❓ What happens if I delete a post? (Uses browser confirm)
- ❓ Can I bulk select/delete?
- ❓ What's the difference between statuses?

### Information Hierarchy
- Primary actions: Create new post (top right)
- Secondary actions: Edit, Delete (per row)
- Information display: Title, Type, Status, Author, Updated date

### Loading States
- Initial load: Shows spinner with "Loading posts..." message
- Data refresh: Same spinner (no skeleton loader)
- Action feedback: No loading state for delete action

### Empty States
- When no data: "No posts found. Create your first post to get started."
- When no organization: "Please select an organization to view posts."
- When error: Shows error message (from error handler)

### Error States
- Network errors: Handled by `useErrorHandler`
- Validation errors: Not applicable (read-only list)
- Permission errors: Handled by layout

### Mobile Responsiveness
- Layout on mobile: Switches to card view (hidden table)
- Touch targets: Buttons are appropriately sized
- Navigation: Mobile-friendly

---

## C. Code Quality Analysis

### useEffect Dependencies
**Issue Found**: Large dependency array in main fetch effect (line 267)
```typescript
}, [organization, page, debouncedSearch, statusFilter, postTypeFilter, 
    authorFilter, createdFrom, createdTo, publishedFrom, publishedTo, 
    sortValue, api, perPage]);
```

**Potential Issues**:
- `api` object may change reference, causing unnecessary re-fetches
- Missing fetch guards (no `isFetchingRef` or `hasFetchedRef`)
- No `AbortController` for request cancellation
- Multiple effects that could be consolidated

**Filter Data Fetch Effect** (line 168-190):
- Missing fetch guards
- No error handling (only console.error)
- Runs on every organization change (could be cached)

### Error Handling
- ✅ Uses `useErrorHandler` hook
- ✅ Wraps async operations with `withErrorHandling`
- ❌ Filter data fetch has no user-facing error handling
- ❌ Delete action uses browser `confirm()` (not accessible)

### TypeScript
- ✅ Good type definitions for interfaces
- ✅ Proper typing for API responses
- ⚠️ Some type assertions (`as PaginatedResponse`)

### Code Duplication
- Delete button logic duplicated in desktop table and mobile cards
- Status badge styling duplicated
- Date formatting could be extracted to utility

### Performance
- ✅ Debounced search (500ms)
- ✅ Pagination implemented
- ⚠️ Filter data (postTypes, users) fetched on every organization change
- ⚠️ No memoization of filter options
- ⚠️ Large dependency array may cause unnecessary re-renders

---

## D. Functionality Analysis

### Missing Features
- Bulk selection/actions
- Export functionality
- Advanced filters (tags, custom fields)
- Quick actions (duplicate, archive)
- Keyboard shortcuts
- Column customization
- Saved filter presets

### Broken Features
- None identified

### Incomplete Implementations
- Delete confirmation uses browser `confirm()` instead of proper dialog
- No optimistic updates for delete action
- Filter data loading has no loading state

### Edge Cases
- ✅ Empty state handled
- ✅ No organization state handled
- ⚠️ Large number of posts (pagination works, but could be optimized)
- ⚠️ Network failure during delete (no rollback)
- ⚠️ Concurrent modifications (no conflict detection)

---

## E. Improvements Needed

### Critical Issues
- [ ] **Add fetch guards to prevent infinite loops**: Implement `isFetchingRef`, `hasFetchedRef`, and `AbortController` in main fetch effect
- [ ] **Fix filter data fetch**: Add error handling and consider caching
- [ ] **Replace browser confirm with proper dialog**: Use AlertDialog component for delete confirmation

### High Priority
- [ ] **Optimize useEffect dependencies**: Memoize `api` or use ref pattern
- [ ] **Add skeleton loaders**: Replace spinner with skeleton table/cards
- [ ] **Cache filter data**: Don't refetch postTypes/users on every org change
- [ ] **Add optimistic updates**: Update UI immediately on delete, rollback on error
- [ ] **Improve empty state**: Add "Create Post" button in empty state

### Medium Priority
- [ ] **Extract duplicate code**: Create reusable delete button component
- [ ] **Add bulk actions**: Select multiple posts, bulk delete/publish
- [ ] **Improve mobile experience**: Better card layout, swipe actions
- [ ] **Add keyboard shortcuts**: Navigate with arrow keys, delete with Del key
- [ ] **Add export functionality**: Export filtered posts as CSV/JSON

### Low Priority
- [ ] **Add column customization**: Show/hide columns
- [ ] **Add saved filter presets**: Save and reuse filter combinations
- [ ] **Add quick filters**: Common filter combinations as buttons
- [ ] **Add advanced search**: Full-text search with operators

---

## Recommendations

### Immediate Actions
1. Add fetch guards and AbortController to main fetch effect
2. Replace browser confirm with AlertDialog
3. Add error handling to filter data fetch
4. Add skeleton loaders for better perceived performance

### Future Considerations
1. Implement bulk actions for better productivity
2. Add export functionality for data portability
3. Consider virtual scrolling for very large lists
4. Add real-time updates (WebSocket/polling) for collaborative editing

---

## Related Audits
- Related pages: `post-detail.md`, `post-new.md`
- Related components: `FilterBar`, `Table`, `Card`
- Related API routes: `api-routes/admin/posts.md`

