# API Keys Page Audit

## Page Information
- **Route**: `/:orgId/api-keys`
- **File**: `apps/web/src/app/[orgId]/api-keys/page.tsx`
- **Status**: ✅ Functional - Needs UX audit documentation

---

## A. Current State Analysis

### Route Structure
- URL pattern: `/:orgId/api-keys`
- Authentication required: Yes
- Authorization required: Yes (organization access)
- Organization-scoped: Yes

### Data Fetching
- Methods used: `useEffect` 
- API endpoints called:
  - `api.getApiKeys()` - Lists all API keys
  - `api.createApiKey()` - Creates new API key
  - `api.rotateApiKey()` - Rotates existing API key
- Loading states: `loading` state, `orgLoading` from context
- Error handling: `useErrorHandler` hook with `withErrorHandling`

### Component Structure
```
ApiKeysPage
  - Loading/Error/Empty States
  - Header (Title + Create API Key button)
  - New Key Display (conditional, shown once after creation)
  - API Keys List
    - Key Card (name, prefix, scopes, metadata, actions)
  - Create Dialog
  - Rotate Key Confirmation Dialog
```

---

## B. User Experience Analysis

### What Users See - Main View
```
┌─────────────────────────────────────────────────────────┐
│  API Keys                                  [+ Create]   │
│  Manage API keys for external integrations              │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🔑 Production Website                            │  │
│  │  omni_xxxx...xxxx  [Revoked]                     │  │
│  │  posts:read, media:read                           │  │
│  │  Rate Limit: 10,000/hour                          │  │
│  │  Created: Jan 15, 2025  Last Used: Jan 20, 2025  │  │
│  │                        [🔄 Rotate]                │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  🔑 Development Key                               │  │
│  │  omni_yyyy...yyyy                                 │  │
│  │  *:read                                           │  │
│  │  Rate Limit: 1,000/hour                           │  │
│  │  Created: Jan 10, 2025                            │  │
│  │                        [🔄 Rotate]                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### What Users See - New Key Created (Critical Security UX)
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ API Key Created                                     │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  omni_prod_abc123def456ghi789jkl012mno345pqr678  │  │
│  │  [📋 Copy]                                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ⚠️ Store this key securely. It will not be shown       │
│  again.                                                 │
│                                                          │
│  [Close]                                                │
└─────────────────────────────────────────────────────────┘
```

### What Users See - Create Dialog
```
┌─────────────────────────────────────────────────────────┐
│  Create New API Key                         [×]          │
│                                                          │
│  Name                                                    │
│  [Production Website________________________________]    │
│                                                          │
│  Scopes                                                  │
│  ☑ Read Posts (All)                                      │
│  ☑ Read Posts (Published Only)                           │
│  ☐ Search Posts                                          │
│  ☐ Read Media                                            │
│  ☐ Read Taxonomies                                       │
│  ☐ Read All Content                                      │
│                                                          │
│                              [Cancel]  [Create Key]      │
└─────────────────────────────────────────────────────────┘
```

### User Thoughts & Expectations
- ✅ **Clear purpose**: "Manage API keys for external integrations"
- ✅ **Security-first**: Key shown only once with warning
- ✅ **Scope selection**: Users can choose permissions
- ✅ **Key rotation**: Users can rotate keys for security
- ❓ **Scope meanings**: Users might not understand scope implications
- ✅ **Key prefix**: Shows partial key for identification
- ❓ **Rate limits**: Users might not understand rate limit implications
- ❓ **Revoked keys**: Clear indication of revoked status

### Information Hierarchy
- **Primary action**: Create API Key button (top right)
- **Security warning**: Prominent warning when key is shown
- **Key cards**: Name, prefix, scopes, metadata prominently displayed
- **Actions**: Rotate key action (for active keys)

### Loading States
- **Initial load**: "Loading API keys..." message
- **Creating**: Button shows "Creating..." text
- ✅ **Good UX**: Loading states are clear

### Empty States
- **No keys**: "No API keys found. Create one to get started."
- ✅ **Clear guidance**: Encourages first key creation

### Error States
- **Load error**: Error shown in Card
- **Create error**: Error handled by error handler
- **Rotate error**: Error handled by error handler
- ✅ **Good UX**: Errors are visible and actionable

### Mobile Responsiveness
- ✅ **Card layout**: Cards stack vertically
- ✅ **Touch targets**: Buttons are touch-friendly
- ✅ **Dialog**: Responsive with scrolling for scope list
- ⚠️ **Potential issue**: Long key strings might be difficult to copy on mobile

### Visual Design
- ✅ **Security emphasis**: Green border on new key card
- ✅ **Status badges**: Revoked, Rotated badges clearly visible
- ✅ **Scope badges**: Visual badges for scopes
- ✅ **Metadata display**: Grid layout for key information
- ✅ **Copy button**: Easy to copy key to clipboard

---

## C. Code Quality Analysis

### useEffect Dependencies
- API keys fetch effect (line 72-76): Depends on `organization` only
- ⚠️ **Issue**: No fetch guards to prevent duplicate requests
- ⚠️ **Issue**: No AbortController for request cancellation

### Error Handling
- ✅ Uses `useErrorHandler` hook
- ✅ Wraps async operations with `withErrorHandling`
- ✅ Toast notifications for success/error
- ✅ Error messages shown appropriately

### TypeScript
- ✅ Good type definitions for ApiKey interface
- ✅ Proper typing for scopes
- ✅ Type-safe form state

### Performance
- ✅ Fetches keys only when organization changes
- ⚠️ No caching of keys list

---

## D. Functionality Analysis

### Features Present
- ✅ List all API keys
- ✅ Create new API key
- ✅ Rotate API key
- ✅ Copy key to clipboard
- ✅ Scope selection
- ✅ Key metadata display (created, last used, expires, rate limit)
- ✅ Revoked key indication
- ✅ Key prefix display (security - full key only shown once)
- ✅ Success/error toast notifications

### Missing Features
- ❌ Revoke API key functionality
- ❌ Delete API key functionality
- ❌ Edit API key (update name/scopes)
- ❌ API key usage analytics
- ❌ API key expiration date setting
- ❌ Rate limit configuration
- ❌ API key history/logs
- ❌ Scope descriptions/tooltips

### Edge Cases
- ✅ Empty list handled
- ✅ Key shown once after creation (security)
- ✅ Revoked keys still visible (audit trail)
- ⚠️ What if user closes dialog before copying key? (lost forever)

---

## E. Improvements Needed

### High Priority
- [ ] Add fetch guards to prevent duplicate requests
- [ ] Add AbortController for request cancellation
- [ ] Add scope descriptions/tooltips
- [ ] Add confirmation dialog if user tries to close before copying key
- [ ] Add revoke key functionality

### Medium Priority
- [ ] Add delete key functionality
- [ ] Add edit key (update name/scopes)
- [ ] Add API key usage analytics
- [ ] Add expiration date setting
- [ ] Add rate limit configuration
- [ ] Improve mobile key copying experience

### Low Priority
- [ ] Add API key history/logs
- [ ] Add key export functionality
- [ ] Add key templates/presets
- [ ] Add key usage graphs

---

## Security Considerations

### Critical Security UX Patterns
- ✅ **Key shown once**: Full key only displayed immediately after creation
- ✅ **Clear warning**: "It will not be shown again" message
- ✅ **Copy to clipboard**: Easy way to save key securely
- ⚠️ **Missing**: Prevent accidental dialog close before copying
- ⚠️ **Missing**: Option to regenerate key immediately if not copied

### Security Best Practices Implemented
- ✅ Key prefix display (identify without exposing full key)
- ✅ Revoked key indication (audit trail)
- ✅ Scope-based permissions
- ✅ Rate limiting display

---

## Related Audits
- Related pages: Settings (API keys are organization settings)
- Related components: `DeleteConfirmationDialog` (used for rotate confirmation)
- Related API routes: API Keys API routes

---

## Recommendations

### Immediate Actions
1. Add fetch guards and AbortController
2. Add scope descriptions/tooltips
3. Add confirmation if user tries to close before copying
4. Add revoke key functionality

### Future Considerations
1. Add API key usage analytics
2. Add edit key functionality
3. Add expiration date configuration
4. Improve mobile key copying experience
