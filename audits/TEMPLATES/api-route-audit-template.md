# API Route Audit Template

## Route Information
- **Endpoint**: `GET/POST/PUT/PATCH/DELETE /api/path/to/endpoint`
- **File**: `apps/api/src/routes/admin|public/route-name.ts`
- **Status**: [ ] Not Started | [ ] In Progress | [ ] Completed | [ ] Needs Review

---

## A. Endpoint Analysis

### HTTP Method & Path
- Method: GET | POST | PUT | PATCH | DELETE
- Path: `/api/admin/v1/organizations/:orgId/resource`
- Path parameters:
- Query parameters:

### Authentication
- Required: Yes/No
- Method: Cloudflare Access | API Key | OTP | None
- Token validation:

### Authorization
- Permission checks:
- Organization access validation:
- Role-based access:

### Request Body
```typescript
interface RequestBody {
  // Structure
}
```

### Response Structure
```typescript
interface SuccessResponse {
  success: true;
  data: {};
  meta?: {};
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Error Responses
- 400 Bad Request:
- 401 Unauthorized:
- 403 Forbidden:
- 404 Not Found:
- 422 Validation Error:
- 500 Server Error:

---

## B. Implementation Analysis

### Database Queries
- Queries used:
- N+1 query issues:
- Missing indexes:
- Query optimization opportunities:

### Input Validation
- Validation schema:
- Validation errors:
- Missing validations:

### Error Handling
- Try-catch coverage:
- Error logging:
- Error response format:
- User-friendly messages:

### Response Formatting
- Consistent format: Yes/No
- Includes metadata: Yes/No
- Pagination: Yes/No

### Rate Limiting
- Implemented: Yes/No
- Limits:
- Strategy:

### Caching Strategy
- Cacheable: Yes/No
- Cache headers:
- Cache invalidation:

---

## C. Documentation Analysis

### MCP Documentation
- Documented in `apps/api/src/routes/public/mcp.ts`: Yes/No
- Complete: Yes/No
- Missing information:

### API Documentation
- Endpoint documented: Yes/No
- Request examples: Yes/No
- Response examples: Yes/No
- Error examples: Yes/No

### Code Comments
- Function documentation:
- Parameter documentation:
- Return value documentation:

---

## D. Testing Analysis

### Test Coverage
- Unit tests: Yes/No
- Integration tests: Yes/No
- E2E tests: Yes/No

### Edge Cases Tested
- Empty inputs:
- Invalid inputs:
- Missing permissions:
- Network failures:

### Error Scenarios Tested
- Authentication failures:
- Authorization failures:
- Validation errors:
- Database errors:

---

## E. Improvements Needed

### Critical Issues
- [ ] Issue 1: Description
- [ ] Issue 2: Description

### High Priority
- [ ] Improvement 1: Description
- [ ] Improvement 2: Description

### Medium Priority
- [ ] Improvement 1: Description
- [ ] Improvement 2: Description

### Low Priority
- [ ] Improvement 1: Description
- [ ] Improvement 2: Description

---

## Recommendations

### Immediate Actions
1. Action item 1
2. Action item 2

### Future Considerations
1. Future improvement 1
2. Future improvement 2

---

## Related Audits
- Related routes:
- Related frontend pages:
- Related components:

