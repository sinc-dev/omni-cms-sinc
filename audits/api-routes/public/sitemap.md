# Sitemap API Route Audit

## Route Information
- **Endpoint**: `GET /api/public/v1/:orgSlug/sitemap.xml`
- **File**: `apps/api/src/routes/public/sitemap.ts`
- **Status**: ⏳ Pending Full Audit

---

## A. Endpoint Analysis

### HTTP Method & Path
- `GET /api/public/v1/:orgSlug/sitemap.xml`
- Returns XML sitemap

### Authentication
- Required: No (public route)

### Special Features
- Domain resolution with priority: query param > org.domain > APP_URL > request origin
- Generates XML sitemap for published posts
- Respects post type slug patterns

---

## E. Improvements Needed

### High Priority
- [ ] **Verify MCP documentation**
- [ ] **Add caching** - Sitemaps change infrequently
- [ ] **Verify XML generation** - Correct format

---

## Related Audits
- Related: SEO and public API

