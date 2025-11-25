# Route Migration Checklist: `/admin` → `/[orgId]`

## Overview

This document tracks the migration of routes from `/admin` to `/[orgId]` to support multi-tenant organization-scoped routing.

## Migration Status

### ✅ Routes Already Migrated

These routes exist in `apps/web/src/app/[orgId]/` and are working:

- ✅ `/[orgId]/dashboard`
- ✅ `/[orgId]/posts` (list, new, detail)
- ✅ `/[orgId]/media`
- ✅ `/[orgId]/users`
- ✅ `/[orgId]/templates`
- ✅ `/[orgId]/webhooks`
- ✅ `/[orgId]/api-keys`
- ✅ `/[orgId]/content-blocks`
- ✅ `/[orgId]/models`
- ✅ `/[orgId]/reviews`
- ✅ `/[orgId]/search`
- ✅ `/[orgId]/settings`
- ✅ `/[orgId]/taxonomies`

### ❌ Routes Still Needing Migration

These routes exist in `apps/web/src/app/admin/` and need to be migrated:

1. **`/[orgId]/analytics`**
   - Source: `apps/web/src/app/admin/analytics/page.tsx`
   - Status: Not migrated
   - Notes: Uses `useOrganization()` hook

2. **`/[orgId]/custom-fields`**
   - Source: `apps/web/src/app/admin/custom-fields/page.tsx`
   - Status: Not migrated
   - Notes: Uses `useOrganization()` hook

3. **`/[orgId]/post-types`** (list, detail, edit)
   - Source: 
     - `apps/web/src/app/admin/post-types/page.tsx`
     - `apps/web/src/app/admin/post-types/[id]/page.tsx`
     - `apps/web/src/app/admin/post-types/[id]/edit/page.tsx`
   - Status: Not migrated
   - Notes: **Has hardcoded `/admin` links** - needs special attention

4. **`/[orgId]/profile`**
   - Source: `apps/web/src/app/admin/profile/page.tsx`
   - Status: Not migrated
   - Notes: May be user-scoped rather than org-scoped - verify requirements

5. **`/[orgId]/relationships`**
   - Source: `apps/web/src/app/admin/relationships/page.tsx`
   - Status: Not migrated
   - Notes: Uses `useOrganization()` hook

### 🚫 Routes That Should NOT Be Migrated

These routes should remain at root level (super admin only):

- `/organizations` - Organization management (already at root)
- `/select-organization` - Organization selection page (already at root)

## Migration Process

### Step-by-Step Migration Guide

For each route that needs migration:

1. **Copy the route file(s)**
   ```bash
   # Example for analytics
   cp apps/web/src/app/admin/analytics/page.tsx apps/web/src/app/[orgId]/analytics/page.tsx
   ```

2. **Update imports and hooks**
   - Ensure `useOrganization()` is imported from `@/lib/context/organization-context`
   - Add `useOrgUrl()` hook import: `import { useOrgUrl } from '@/lib/hooks/use-org-url';`
   - Initialize the hook: `const { getUrl } = useOrgUrl();`

3. **Replace hardcoded `/admin` links**
   - Find all instances of `/admin/...` links
   - Replace with `getUrl('...')` calls
   - Example:
     ```tsx
     // Before
     <Link href="/admin/posts">Posts</Link>
     
     // After
     <Link href={getUrl('posts')}>Posts</Link>
     ```

4. **Update router.push() calls**
   - Find all `router.push('/admin/...')` calls
   - Replace with `router.push(getUrl('...'))`
   - Example:
     ```tsx
     // Before
     router.push('/admin/posts');
     
     // After
     router.push(getUrl('posts'));
     ```

5. **Update window.location.href**
   - Find all `window.location.href = '/admin/...'` calls
   - Replace with `window.location.href = getUrl('...')`
   - Example:
     ```tsx
     // Before
     window.location.href = '/admin/posts';
     
     // After
     window.location.href = getUrl('posts');
     ```

6. **Verify organization context**
   - Ensure the page uses `useOrganization()` hook
   - Add loading/error states if organization is required
   - Example pattern:
     ```tsx
     const { organization, isLoading: orgLoading } = useOrganization();
     
     if (orgLoading || !organization) {
       return <div>Loading...</div>;
     }
     ```

7. **Test the migrated route**
   - Navigate to `/[orgId]/route-name`
   - Verify all links work correctly
   - Verify API calls include organization context
   - Check for any console errors

### Special Cases

#### Post Types Routes

The post-types routes have hardcoded `/admin` links that need updating:

**Files to update:**
- `apps/web/src/app/admin/post-types/page.tsx` (lines 342, 372)
- `apps/web/src/app/admin/post-types/[id]/page.tsx` (lines 173, 187, 199)
- `apps/web/src/app/admin/post-types/[id]/edit/page.tsx` (lines 95, 136, 150, 310)

**Pattern to replace:**
```tsx
// Find and replace these patterns:
href={`/admin/post-types/${id}`}  →  href={getUrl(`post-types/${id}`)}
href="/admin/post-types"          →  href={getUrl('post-types')}
router.push(`/admin/post-types/${id}`)  →  router.push(getUrl(`post-types/${id}`))
```

#### Profile Route

The profile route may be user-scoped rather than organization-scoped. Verify:
- Should it be `/[orgId]/profile` or `/profile`?
- Does it need organization context?
- Check if it's used in navigation components

## Component Updates

### ✅ Components Already Updated

These components already use `useOrgUrl()`:

- ✅ `nav-user.tsx`
- ✅ `not-found.tsx`
- ✅ `header.tsx`
- ✅ `app-sidebar.tsx`
- ✅ `organization-switcher.tsx`
- ✅ `use-breadcrumbs.ts`

### ⚠️ Components That May Need Updates

After migrating routes, check these components for any remaining `/admin` references:

- `nav-main.tsx` - Main navigation component
- `breadcrumbs.tsx` - Breadcrumb component
- Any route-specific components

## Testing Checklist

For each migrated route, verify:

- [ ] Route is accessible at `/[orgId]/route-name`
- [ ] All internal links work correctly
- [ ] Navigation breadcrumbs are correct
- [ ] API calls include organization context
- [ ] Loading states work correctly
- [ ] Error handling works correctly
- [ ] Organization context is available
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Page renders correctly with organization data

## Common Patterns

### Pattern 1: Basic Route Migration

```tsx
'use client';

import { useOrganization } from '@/lib/context/organization-context';
import { useOrgUrl } from '@/lib/hooks/use-org-url';
import Link from 'next/link';

export default function MyPage() {
  const { getUrl } = useOrgUrl();
  const { organization, isLoading: orgLoading } = useOrganization();
  
  if (orgLoading || !organization) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <Link href={getUrl('other-route')}>Other Route</Link>
    </div>
  );
}
```

### Pattern 2: Router Navigation

```tsx
import { useRouter } from 'next/navigation';
import { useOrgUrl } from '@/lib/hooks/use-org-url';

export default function MyPage() {
  const router = useRouter();
  const { getUrl } = useOrgUrl();
  
  const handleAction = () => {
    router.push(getUrl('target-route'));
  };
  
  return <button onClick={handleAction}>Go</button>;
}
```

### Pattern 3: Window Location

```tsx
import { useOrgUrl } from '@/lib/hooks/use-org-url';

export default function MyPage() {
  const { getUrl } = useOrgUrl();
  
  const handleAction = () => {
    window.location.href = getUrl('target-route');
  };
  
  return <button onClick={handleAction}>Go</button>;
}
```

## Files with Hardcoded `/admin` Links

These files need to be updated after migration:

1. **Post Types Pages** (Priority: High)
   - `apps/web/src/app/admin/post-types/page.tsx`
   - `apps/web/src/app/admin/post-types/[id]/page.tsx`
   - `apps/web/src/app/admin/post-types/[id]/edit/page.tsx`

2. **Other Pages** (Check after migration)
   - Any other pages that reference `/admin` routes

## Cleanup Tasks

After all routes are migrated:

1. **Remove old `/admin` route files**
   - Delete migrated route files from `apps/web/src/app/admin/`
   - Keep only routes that should remain at `/admin` level

2. **Update redirects**
   - Add redirects from `/admin/*` to `/[orgId]/*` if needed
   - Or show "route not found" for old `/admin` routes

3. **Update documentation**
   - Update any documentation referencing `/admin` routes
   - Update API documentation if routes changed

4. **Verify navigation**
   - Check all navigation components
   - Verify breadcrumbs work correctly
   - Test organization switching

## Notes

1. **Another agent is working in reverse order** - They're migrating from the end of the admin folder list
2. **Most routes don't have hardcoded links** - Copying and updating imports should be sufficient
3. **The `useOrgUrl()` hook is available** - Use it for generating org-scoped URLs
4. **The `[orgId]/layout.tsx` handles organization context** - It extracts and validates organization context automatically

## Progress Tracking

### Remaining Route Migrations

- [ ] `/[orgId]/analytics`
- [ ] `/[orgId]/custom-fields`
- [ ] `/[orgId]/post-types` (list, detail, edit)
- [ ] `/[orgId]/profile` (verify if org-scoped)
- [ ] `/[orgId]/relationships`

### Remaining Component Updates

- [ ] Update post-types pages with hardcoded `/admin` links
- [ ] Verify all navigation components use `useOrgUrl()`
- [ ] Check for any remaining `/admin` references

### Other Tasks

- [ ] Route audit: Compare API documentation with actual routes
- [ ] Test all migrated routes
- [ ] Remove old `/admin` route files (after migration complete)

## Quick Reference

### useOrgUrl Hook

```tsx
import { useOrgUrl } from '@/lib/hooks/use-org-url';

const { getUrl, orgId } = useOrgUrl();

// Generate URLs
getUrl('posts')              // → /[orgId]/posts
getUrl('posts/123')          // → /[orgId]/posts/123
getUrl('post-types/new')     // → /[orgId]/post-types/new
```

### useOrganization Hook

```tsx
import { useOrganization } from '@/lib/context/organization-context';

const { organization, isLoading: orgLoading } = useOrganization();

// organization: { id: string, name: string, slug: string, ... }
// orgLoading: boolean
```

---

**Last Updated:** Based on current codebase state
**Next Steps:** Continue migrating remaining routes, starting with analytics, custom-fields, post-types, profile, and relationships

