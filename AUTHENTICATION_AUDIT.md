# Comprehensive Authentication Flow Audit

## Executive Summary

This audit examines the complete authentication and routing flow from sign-in through organization selection to dashboard access. The system supports multiple authentication methods (Cloudflare Access for production, OTP for local development) and must handle various user types and edge cases.

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [User Types & Roles](#user-types--roles)
3. [Complete User Flows](#complete-user-flows)
4. [Layout Hierarchy](#layout-hierarchy)
5. [API Authentication](#api-authentication)
6. [Environment-Specific Behavior](#environment-specific-behavior)
7. [Identified Issues](#identified-issues)
8. [Use Cases & Edge Cases](#use-cases--edge-cases)
9. [Recommendations](#recommendations)

---

## Authentication Methods

### 1. Cloudflare Access (Production)
- **How it works**: Cookie-based authentication via Cloudflare Access JWT tokens
- **Token Location**: Cookies (`CF_Authorization`)
- **Validation**: Server-side JWT verification via `validateAccessJWT()`
- **User Provisioning**: Automatic user creation on first login
- **Entry Point**: `/sign-up` page → redirects to Cloudflare Access login
- **API Usage**: Token extracted from request cookies/headers

### 2. OTP Authentication (Local Development)
- **How it works**: Email-based one-time password
- **Token Storage**: localStorage (`omni-cms:session-token`)
- **Validation**: Database session lookup via `getSessionByToken()`
- **User Provisioning**: User must exist in database before OTP can be sent
- **Entry Point**: `/sign-in` page → OTP form
- **API Usage**: Bearer token in Authorization header

### 3. Local Auth Bypass (Development Only)
- **Trigger**: `ENABLE_LOCAL_AUTH_BYPASS=true`
- **Behavior**: Creates/uses demo user (`demo@example.com`) if no token found
- **Use Case**: Testing without authentication setup

---

## User Types & Roles

### 1. New User (First Time)
- No account in database
- No organizations
- **Flow**: Sign up → Auto-provisioned → No organizations → Cannot proceed

### 2. Regular User
- Has account
- Member of 1+ organizations
- Non-super-admin role
- **Flow**: Sign in → Select organization → Dashboard

### 3. Super Admin
- `isSuperAdmin = true`
- Access to ALL organizations (even if not explicitly member)
- Can create/manage organizations
- **Flow**: Sign in → Can access `/organizations` → Can access any org dashboard

### 4. User with No Organizations
- Has account
- Not member of any organization
- **Flow**: Sign in → `/select-organization` → Empty state (problematic)

### 5. User with Single Organization
- Has account
- Member of exactly 1 organization
- **Flow**: Sign in → Should auto-redirect to dashboard (currently requires selection)

### 6. User with Multiple Organizations
- Has account
- Member of 2+ organizations
- **Flow**: Sign in → `/select-organization` → Choose → Dashboard

### 7. User with Expired Session
- Has localStorage token (OTP) or cookie (Cloudflare Access)
- Session expired in database
- **Flow**: API returns 401 → Should redirect to sign-in

---

## Complete User Flows

### Flow 1: New User - Cloudflare Access (Production)

```
1. User visits /sign-up
2. Redirected to Cloudflare Access login
3. Authenticates with Cloudflare
4. Redirected back with CF_Authorization cookie
5. API auto-provisions user from JWT payload
6. User redirected to /select-organization
7. API returns empty organizations array (user not member of any org)
8. PROBLEM: User sees empty state, cannot proceed
```

**Expected**: User should see message "You need to be invited to an organization" or redirect to waitlist

**Current State**: User stuck with empty organization list

---

### Flow 2: Returning User - OTP (Local Development)

```
1. User visits /sign-in
2. Enters email in OTP form
3. API checks if user exists (PROBLEM: No user = silent failure)
4. OTP sent via email
5. User enters 6-digit code
6. API validates OTP → creates session → returns token
7. Token stored in localStorage
8. Redirected to /select-organization (or redirect URL from query param)
9. API call to /api/admin/v1/organizations with Bearer token
10. User selects organization → redirected to /:orgId/dashboard
```

**Issues**:
- Step 3: If user doesn't exist, OTP request might fail silently
- Step 9: If session expired, 401 handled but redirect might loop

---

### Flow 3: Super Admin Flow

```
1. User signs in (any method)
2. API identifies user.isSuperAdmin = true
3. /api/admin/v1/organizations returns ALL organizations
4. User can access /organizations page (Super Admin only)
5. User can access ANY /:orgId/* route (even if not member)
```

**Implementation**: `userHasAccessToOrganization()` returns `true` for super admins

---

### Flow 4: Organization Selection Flow

```
1. User authenticated, on /select-organization page
2. API call to GET /api/admin/v1/organizations
3. If 1 organization: Should auto-redirect (NOT CURRENTLY IMPLEMENTED)
4. If 0 organizations: Show empty state (PROBLEM: No clear next steps)
5. If 2+ organizations: Show selection UI
6. User clicks organization → router.push(/:orgId/dashboard)
7. /:orgId/layout.tsx validates access → loads dashboard
```

**Issues**:
- Step 3: No auto-redirect for single org
- Step 4: Empty state doesn't guide user
- Step 7: Layout makes another API call (redundant if already fetched)

---

### Flow 5: Protected Route Access

```
1. User directly navigates to /:orgId/dashboard
2. /:orgId/layout.tsx runs
3. Checks if user authenticated (reads session token)
4. Fetches organizations
5. Validates user has access to :orgId
6. If no access: redirect to /select-organization
7. If access: Set organization context → render dashboard
```

**Issues**:
- Step 3: Relies on localStorage/cookies (client-side only check initially)
- Step 5: API validates but client-side redirect happens first
- Step 6: Should redirect to /unauthorized if access denied

---

### Flow 6: Session Expiry Handling

```
1. User has valid session token
2. User makes API request
3. API validates session → expired or invalid
4. API returns 401
5. ApiClient.request() catches 401
6. Checks if on auth page → if not, redirects to /sign-in
7. PROBLEM: If already on /sign-in, might create redirect loop
```

**Current Implementation** (`apps/web/src/lib/api-client/index.ts`):
- Checks if `currentPath !== '/sign-in'` before redirecting
- Sets `omni-cms:redirecting` flag in sessionStorage
- Clears on page unload

**Potential Issue**: If multiple tabs, redirect flag might persist incorrectly

---

## Layout Hierarchy

### Root Layout (`app/layout.tsx`)
- Wraps entire app
- Provides: ThemeProvider, ToastProvider, OrganizationProvider, LayoutWrapper
- Always rendered

### LayoutWrapper (`components/layout-wrapper.tsx`)
- Conditional layout rendering
- **No layout**: `/sign-in`, `/sign-up`, `/unauthorized`, `/forbidden`
- **Auth layout**: Same as above (uses AuthLayout component)
- **Admin layout**: `/admin/*` routes
- **Default layout**: Everything else (includes sidebar/header)

**Issue**: `/select-organization` gets default layout (sidebar/header), but should be cleaner

### Org Layout (`app/[orgId]/layout.tsx`)
- Organization-scoped routes
- Validates user access to orgId
- Fetches user organizations
- Sets organization context
- Redirects if no access

**Issues**:
- Makes redundant API call (organizations already fetched in select-organization)
- useEffect has missing dependency (handleError)
- No loading state while validating

### Admin Layout (`app/admin/layout.tsx`)
- Super admin routes
- **Currently**: Routes redirect to `/select-organization` via middleware
- **Issue**: Layout exists but routes never use it

---

## API Authentication

### Authentication Middleware Flow

```typescript
authMiddleware (apps/api/src/lib/api/hono-admin-middleware.ts)
├── Try API Key authentication first
│   └── Validates Bearer token → sets apiKey context
└── Fallback to Cloudflare Access / OTP
    ├── getAuthenticatedUser() checks:
    │   ├── Authorization header (OTP session token)
    │   └── CF_Authorization cookie (Cloudflare Access)
    └── If ENABLE_LOCAL_AUTH_BYPASS: creates demo user
```

### Organization Access Check

```typescript
orgAccessMiddleware
├── Extract orgId from URL params
├── If API Key: verify key.organizationId === orgId
└── If User: userHasAccessToOrganization()
    ├── Super Admin → always true
    └── Regular User → check usersOrganizations table
```

### Permission Check

```typescript
permissionMiddleware(requiredPermission)
├── If API Key: check scopes include permission
└── If User: checkPermission(db, userId, orgId, permission)
```

**Issues**:
- API Key auth works, but frontend doesn't use it (only session tokens)
- OTP token validation happens but session expiry not checked properly

---

## Environment-Specific Behavior

### Development (Local)

**Expected Behavior**:
- OTP authentication enabled
- Local auth bypass option (`ENABLE_LOCAL_AUTH_BYPASS=true`)
- API on `http://localhost:8787`
- Frontend on `http://localhost:3000`
- CORS enabled

**Current Implementation**:
- ✅ OTP works
- ✅ Local auth bypass works
- ✅ API URL fallback to localhost:8787
- ⚠️ CORS configured but might need review

### Production

**Expected Behavior**:
- Cloudflare Access only
- No OTP (or OTP as backup)
- API on Cloudflare Workers
- Frontend on Cloudflare Pages
- Strict CORS

**Current Implementation**:
- ✅ Cloudflare Access works
- ❓ OTP still available in production? (Should it be?)
- ✅ API on Workers
- ✅ Frontend on Pages
- ⚠️ CORS allows all origins (`origin: '*'`)

---

## Identified Issues

### Critical Issues

#### 1. **Dual Authentication State Confusion**
**Problem**: System supports OTP (localStorage token) and Cloudflare Access (cookies) simultaneously
**Impact**: Unclear which auth method is active, potential conflicts
**Location**: 
- `apps/web/src/lib/api-client/index.ts` (checks localStorage for OTP token)
- `apps/api/src/lib/auth/middleware.ts` (checks both Bearer token and CF cookie)

**Fix Needed**: 
- Detect environment and use appropriate auth method
- Clear localStorage OTP token when Cloudflare Access is used
- Document which method to use in which environment

#### 2. **New Users Stuck After Sign-Up**
**Problem**: New users auto-provisioned but have no organizations → stuck on `/select-organization` with empty state
**Impact**: User cannot proceed, poor UX
**Location**: `apps/web/src/app/select-organization/page.tsx`

**Fix Needed**: 
- Show helpful message: "You need to be invited to an organization"
- Add "Request Access" or "Contact Admin" option
- Or redirect to waitlist/signup completion page

#### 3. **Single Organization No Auto-Redirect**
**Problem**: Users with exactly 1 organization still see selection page
**Impact**: Unnecessary step, poor UX
**Location**: `apps/web/src/app/select-organization/page.tsx`

**Fix Needed**: Auto-redirect to `/:orgId/dashboard` if only 1 organization

#### 4. **useEffect Dependency Issues**
**Problem**: Multiple pages missing proper dependencies or have infinite loop risks
**Location**: 
- `apps/web/src/app/organizations/page.tsx` (line 143: missing dependencies)
- `apps/web/src/app/[orgId]/layout.tsx` (missing handleError in deps)

**Fix Needed**: 
- Add proper fetch guards (already in select-organization)
- Fix dependency arrays
- Use refs for stable callbacks

#### 5. **Redundant API Calls**
**Problem**: Organizations fetched in both `/select-organization` and `/:orgId/layout.tsx`
**Impact**: Slower load times, unnecessary API calls
**Location**: Both files fetch organizations independently

**Fix Needed**: 
- Share organization list via context
- Cache organizations in OrganizationProvider
- Only fetch once, reuse data

### Medium Priority Issues

#### 6. **Session Expiry Not Handled Gracefully**
**Problem**: Expired sessions cause 401, but redirect logic might loop
**Impact**: User sees errors, potential redirect loops
**Location**: `apps/web/src/lib/api-client/index.ts` (line 109-129)

**Fix Needed**: 
- Better session expiry detection
- Clear expired tokens immediately
- Prevent redirect loops

#### 7. **Error Pages Have Broken Links**
**Problem**: `/forbidden` page links to `/admin` which redirects
**Impact**: User gets stuck in redirect loop
**Location**: `apps/web/src/app/forbidden/page.tsx` (line 36)

**Fix Needed**: Link to `/select-organization` or home instead

#### 8. **Root Path (`/`) Behavior Unclear**
**Problem**: Root path shows generic home page, doesn't guide authenticated users
**Impact**: Confusing navigation
**Location**: `apps/web/src/app/page.tsx`

**Fix Needed**: 
- Check auth state
- Redirect authenticated users to `/select-organization`
- Redirect unauthenticated users to `/sign-in`

#### 9. **Admin Layout Unused**
**Problem**: `/app/admin/layout.tsx` exists but routes redirect via middleware
**Impact**: Dead code, confusion
**Location**: `apps/web/src/middleware.ts` redirects `/admin` → `/select-organization`

**Fix Needed**: Either use admin layout or remove it

#### 10. **CORS Too Permissive**
**Problem**: API allows all origins (`origin: '*'`)
**Impact**: Security risk in production
**Location**: `apps/api/src/index.ts` (line 73)

**Fix Needed**: 
- Environment-based CORS configuration
- Whitelist specific origins in production

### UX Issues

#### 11. **Loading States Inconsistent**
**Problem**: Some pages show loading spinners, others show blank screens
**Impact**: Confusing user experience
**Location**: Multiple pages

**Fix Needed**: Consistent loading UI patterns

#### 12. **Error Messages Too Generic**
**Problem**: "Failed to fetch" doesn't help users understand the issue
**Impact**: Users don't know what to do
**Location**: `apps/web/src/lib/api-client/index.ts`

**Fix Needed**: User-friendly error messages with actionable steps

---

## Use Cases & Edge Cases

### Use Case 1: First-Time User Sign-Up (Production)

**Scenario**: New user signs up via Cloudflare Access
1. User clicks "Sign Up" → redirected to Cloudflare
2. Authenticates → auto-provisioned in database
3. Redirected to `/select-organization`
4. **Problem**: Empty organization list, no way to proceed

**Expected Behavior**: 
- Show welcome message
- Explain they need an invitation
- Provide contact/admin link
- Option to request access

### Use Case 2: User Switches Organizations

**Scenario**: User has access to multiple orgs, wants to switch
1. User on `/:orgId1/dashboard`
2. Clicks "Switch Organization" (if this exists) or navigates to `/select-organization`
3. Selects different org → `/:orgId2/dashboard`
4. **Current**: Works, but context might not update correctly

**Expected Behavior**: 
- Smooth transition
- Organization context updates immediately
- No flickering or loading states

### Use Case 3: User Loses Access to Organization

**Scenario**: User was member of Org A, admin removes them
1. User has `/orgA/dashboard` open in browser
2. Admin removes user from organization
3. User refreshes page or navigates
4. **Expected**: Redirect to `/select-organization` or `/unauthorized`
5. **Current**: Layout checks access, should handle this

**Fix Needed**: Ensure layout properly handles 403 responses

### Use Case 4: Session Expires Mid-Session

**Scenario**: User working, session expires
1. User makes API request
2. API returns 401
3. **Expected**: Redirect to sign-in, clear session
4. **Current**: Redirects, but might not clear all session data

**Fix Needed**: Clear localStorage and cookies on 401

### Use Case 5: User Directly Accesses Organization Route

**Scenario**: User bookmarks `/:orgId/dashboard`, returns later
1. User not authenticated (or expired session)
2. Navigates directly to `/:orgId/dashboard`
3. **Expected**: 
   - Check auth → if not, redirect to sign-in
   - Check org access → if no access, redirect appropriately
4. **Current**: Layout does this, but might have race conditions

**Fix Needed**: Ensure layout waits for auth check before rendering

### Use Case 6: Super Admin Accesses Non-Member Organization

**Scenario**: Super admin wants to access org they're not explicitly member of
1. Super admin navigates to `/:orgId/dashboard`
2. **Expected**: Should work (super admin has access to all)
3. **Current**: Should work via `userHasAccessToOrganization()` logic

**Verification Needed**: Test this scenario

### Use Case 7: OTP User in Production

**Scenario**: Production environment, but user somehow uses OTP
1. **Expected**: Should not be possible or should be disabled
2. **Current**: OTP endpoint available in production

**Fix Needed**: Environment-based feature flag to disable OTP in production

### Use Case 8: Multiple Tabs, Session Expires in One

**Scenario**: User has two tabs open, session expires
1. Tab 1: User working
2. Tab 2: Session expires, gets 401
3. Tab 2: Redirects to sign-in
4. **Problem**: Tab 1 might still have stale session token

**Fix Needed**: Broadcast session expiry event across tabs

### Use Case 9: User with Zero Organizations

**Scenario**: User exists but not member of any org (edge case)
1. User signs in successfully
2. `/select-organization` shows empty list
3. **Expected**: Clear message, next steps
4. **Current**: Generic empty state

**Fix Needed**: Specific messaging for this scenario

### Use Case 10: Organization Deleted While User Active

**Scenario**: Admin deletes organization user is viewing
1. User on `/:orgId/dashboard`
2. Admin deletes organization
3. User makes API request
4. **Expected**: 404 or 403, redirect to organization selection
5. **Current**: Should be handled by API, but frontend might not handle gracefully

**Fix Needed**: Handle 404 for organizations gracefully

---

## Recommendations

### Immediate Fixes (Critical)

1. **Fix New User Experience**
   - Add helpful empty state message on `/select-organization`
   - Provide contact/admin link
   - Consider waitlist or invitation flow

2. **Auto-Redirect Single Organization**
   - Detect single organization in `/select-organization`
   - Auto-redirect to dashboard

3. **Fix useEffect Dependencies**
   - Add proper dependencies to all useEffect hooks
   - Use fetch guards to prevent infinite loops
   - Test all pages for loop issues

4. **Separate Auth Methods by Environment**
   - Disable OTP in production (or make it explicit feature flag)
   - Clear localStorage when Cloudflare Access is used
   - Document which method to use where

5. **Reduce Redundant API Calls**
   - Cache organizations in OrganizationProvider
   - Share data between `/select-organization` and `/:orgId/layout`
   - Only fetch once per session

### Short-Term Improvements

6. **Improve Error Handling**
   - User-friendly error messages
   - Actionable error states
   - Better session expiry handling

7. **Fix Root Path Behavior**
   - Check auth state
   - Redirect appropriately
   - Better landing page for unauthenticated users

8. **Improve Loading States**
   - Consistent loading UI
   - Skeleton screens instead of spinners where appropriate
   - Better perceived performance

9. **Clean Up Dead Code**
   - Remove unused admin layout or implement it
   - Consolidate duplicate organization pages (`/organizations` vs `/admin/organizations`)

10. **Security Hardening**
    - Environment-based CORS
    - Rate limiting on OTP requests
    - Session expiry notifications

### Long-Term Enhancements

11. **Add Session Management UI**
    - Show session expiry time
    - Allow manual logout
    - Show active sessions

12. **Organization Switching**
    - Quick switcher in header
    - Remember last used organization
    - Keyboard shortcuts

13. **Better Onboarding**
    - Welcome flow for new users
    - Tutorial for first-time organization access
    - Guided setup

14. **Analytics & Monitoring**
    - Track authentication failures
    - Monitor session expiry rates
    - User flow analytics

---

## Testing Checklist

- [ ] New user sign-up flow (Cloudflare Access)
- [ ] Returning user sign-in (OTP)
- [ ] Returning user sign-in (Cloudflare Access)
- [ ] User with 0 organizations
- [ ] User with 1 organization (auto-redirect)
- [ ] User with 2+ organizations (selection)
- [ ] Super admin access to all organizations
- [ ] Session expiry handling
- [ ] Direct navigation to protected routes
- [ ] Organization switching
- [ ] Lost access to organization
- [ ] Multiple tabs, session expiry
- [ ] API error handling (401, 403, 500)
- [ ] Network error handling
- [ ] Loading states on all pages
- [ ] Error page navigation

---

## Conclusion

The authentication system is functional but has several UX and edge case issues that need addressing. The dual authentication method support (OTP + Cloudflare Access) creates complexity that should be simplified. The new user experience needs improvement, and several technical debt items should be addressed.

Priority should be given to:
1. New user empty state messaging
2. Auto-redirect for single organization
3. Fixing useEffect dependencies
4. Reducing redundant API calls
5. Environment-based auth method selection

