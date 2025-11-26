# Forbidden Page Audit

## Page Information
- **Route**: `/forbidden`
- **File**: `apps/web/src/app/forbidden/page.tsx`
- **Status**: ✅ Functional - Needs UX audit documentation

---

## A. Current State Analysis

### Route Structure
- URL pattern: `/forbidden`
- Authentication required: No (error page, public access)
- Authorization required: No
- Organization-scoped: No

### Data Fetching
- Methods used: None (static error page)
- API endpoints called: None
- Loading states: None
- Error handling: N/A (this is an error page)

### Component Structure
```
ForbiddenPage
  - Card
    - ShieldX Icon
    - "Access Denied" Title
    - Error Message
    - Help Section (What you can do)
    - Navigation Buttons (Select Organization, Go to Sign In)
```

### State Management
- Local state: None (static page)
- Context usage: None
- Props: None

---

## B. User Experience Analysis

### What Users See
```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         🛡️❌                                       │ │
│  │                                                     │ │
│  │         Access Denied                               │ │
│  │                                                     │ │
│  │         You don't have permission to access this    │ │
│  │         resource. Please contact your administrator │ │
│  │         if you believe this is an error.            │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  What you can do:                            │  │ │
│  │  │  • Contact your administrator to request      │  │ │
│  │  │    access                                     │  │ │
│  │  │  • Check if you're signed in with the correct │  │ │
│  │  │    account                                    │  │ │
│  │  │  • Return to a page you have access to        │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  [← Select Organization]                            │ │
│  │  [🏠 Go to Sign In]                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### User Thoughts & Expectations
- ✅ **Clear error**: "Access Denied" title is clear
- ✅ **Explanation**: Message explains why access was denied
- ✅ **Actionable**: Lists what user can do
- ✅ **Navigation options**: Provides clear paths forward
- ❓ **Context loss**: Doesn't explain what resource they tried to access
- ✅ **Help section**: "What you can do" provides guidance

### Information Hierarchy
- **Primary message**: Access Denied title (large, prominent)
- **Explanation**: Error message explaining the situation
- **Help section**: "What you can do" with actionable steps
- **Actions**: Navigation buttons (Select Organization, Sign In)

### Loading States
- Not applicable (static page)

### Empty States
- Not applicable

### Error States
- ✅ **Visual indicator**: ShieldX icon with amber/yellow color (warning)
- ✅ **Clear messaging**: Explains permission issue
- ✅ **Helpful guidance**: Provides next steps
- ✅ **Navigation options**: Multiple paths forward

### Mobile Responsiveness
- ✅ **Layout**: Card is centered and responsive (`max-w-md`)
- ✅ **Padding**: Proper padding on mobile (`p-4`)
- ✅ **Touch targets**: Buttons are full-width, good for mobile
- ✅ **Readability**: Text is readable on small screens
- ✅ **List formatting**: Bullet points are readable on mobile

### Visual Design
- ✅ **Consistent branding**: Uses Card component like other error pages
- ✅ **Color usage**: Amber/yellow for warning (not red for error)
- ✅ **Icon**: ShieldX icon clearly indicates permission/security issue
- ✅ **Spacing**: Good use of whitespace
- ✅ **Typography**: Clear hierarchy with title and description

---

## C. Code Quality Analysis

### useEffect Dependencies
- Not applicable (static page)

### Error Handling
- Not applicable (this is an error page itself)

### TypeScript
- ✅ No TypeScript issues (simple component)
- ✅ Proper component typing

### Performance
- ✅ Static page, no performance concerns

---

## D. Functionality Analysis

### Features Present
- ✅ Clear error message
- ✅ Helpful guidance section
- ✅ Navigation buttons (Select Organization, Sign In)
- ✅ Consistent error page design

### Missing Features
- ❌ Context about what resource was accessed
- ❌ Retry button (if applicable)
- ❌ Contact administrator link/button
- ❌ Back button to previous page
- ❌ Error code/reference (for support)

### Edge Cases
- ✅ Works as standalone page
- ✅ Works when linked from other pages
- ⚠️ No context preservation (user loses where they were)

---

## E. Improvements Needed

### High Priority
- [ ] Add context about what resource was attempted
- [ ] Add "Go Back" button to previous page
- [ ] Add contact administrator link/button

### Medium Priority
- [ ] Add error code/reference for support tickets
- [ ] Add retry button (if applicable)
- [ ] Preserve attempted URL in query params

### Low Priority
- [ ] Add analytics tracking for forbidden access attempts
- [ ] Add help documentation link
- [ ] Customize message based on resource type

---

## Related Audits
- Related pages: `unauthorized.md`, `error-boundary.md`, `not-found.md`
- Related components: Error cards, navigation buttons
- Related API routes: None (static page)

---

## Recommendations

### Immediate Actions
1. Add context about what resource was accessed
2. Add "Go Back" button
3. Add contact administrator action

### Future Considerations
1. Add error tracking/analytics
2. Customize message based on resource type
3. Add help documentation links

