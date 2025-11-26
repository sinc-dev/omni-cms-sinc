# Public Search API Route Audit

## Route Information
- **Endpoint**: `POST /api/public/v1/:orgSlug/search`
- **File**: `apps/api/src/routes/public/search.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `POST /api/public/v1/:orgSlug/search`
- **Note**: POST method (HubSpot-style advanced search)

### Authentication
- Required: Yes (API Key)
- Method: API Key only
- Required scope: `posts:search`

### Special Considerations
- Public route but requires API key
- Uses `SearchOrchestrator` for complex searches
- Tracks analytics
- Advanced search capabilities

### Request Body
- Uses `searchRequestSchema` for validation
- Supports advanced search queries

---

## E. Improvements Needed

### Critical Issues
- [ ] **Verify rate limiting** - Prevent abuse
- [ ] **Verify search performance** - Optimize queries
- [ ] **Verify MCP documentation** - Document advanced search features

### High Priority
- [ ] **Add caching** - Cache search results
- [ ] **Verify analytics tracking** - Ensure accurate tracking
- [ ] **Test complex queries** - Edge cases

---

## Related Audits
- Related pages: `search.md`
- Related routes: `api-routes/admin/search.md`

