# Error Card Components Audit

## Component Category
- **Location**: `apps/web/src/components/errors/`
- **Status**: ⚠️ **HAS BROKEN LINK**

---

## Components

### 1. ForbiddenCard (`forbidden-card.tsx`)
- **Purpose**: Display 403 Forbidden errors
- **Issue**: Default `backUrl` is `/admin` (line 18) - should be `/select-organization`
- **Props**: `message`, `requiredPermission`, `backUrl`, `className`

### 2. UnauthorizedCard (`unauthorized-card.tsx`)
- **Purpose**: Display 401 Unauthorized errors
- **Props**: `message`, `onRetry`, `className`

### 3. ErrorCard (`error-card.tsx`)
- **Purpose**: Generic error display
- **Props**: `title`, `message`, `error`, `onRetry`, `showDetails`, `actions`, `className`

---

## E. Improvements Needed

### Critical Issues
- [ ] **Fix ForbiddenCard default backUrl** - Change from `/admin` to `/select-organization`

### High Priority
- [ ] Verify all error cards used correctly
- [ ] Consistent error card styling
- [ ] Better error recovery actions

---

## Related Audits
- Related pages: `forbidden.md`, `unauthorized.md`, `error-boundary.md`

