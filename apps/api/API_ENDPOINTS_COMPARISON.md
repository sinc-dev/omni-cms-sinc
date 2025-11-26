# API Endpoints Comparison: Posts vs Search

## Overview

This document compares the capabilities of the **Posts endpoint** (`GET /api/public/v1/:orgSlug/posts`) and the **Search endpoint** (`POST /api/public/v1/:orgSlug/search`) to identify gaps and use cases that are not supported.

---

## Posts Endpoint Capabilities

### Supported Filters
- ✅ `post_type` - Filter by post type slug
- ✅ `search` - Text search in title, content, excerpt (LIKE %term%)
- ✅ `published_from` - Filter by published date (ISO 8601)
- ✅ `published_to` - Filter by published date (ISO 8601)
- ✅ `related_to_slug` - Filter posts related to a specific post (NEW)
- ✅ `relationship_type` - Filter by relationship type when using related_to_slug (NEW)
- ✅ `sort` - Sort by publishedAt, createdAt, updatedAt, title (asc/desc)
- ✅ `page` - Page-based pagination
- ✅ `per_page` - Items per page (max 100)

### Limitations
- ❌ **No taxonomy filtering** - Cannot filter by taxonomy terms directly
- ❌ **No custom field filtering** - Cannot filter by custom field values
- ❌ **No complex operators** - Only basic LIKE search, no advanced operators (gt, lt, in, etc.)
- ❌ **No filter groups** - Cannot combine multiple filters with AND/OR logic
- ❌ **No nested property filtering** - Cannot filter by author.name, postType.slug, etc.
- ❌ **Limited date operators** - Only published_from/published_to, no date_eq, date_gt, etc.
- ❌ **No property selection** - Always returns all fields, cannot select specific properties
- ❌ **Page-based pagination only** - No cursor-based pagination for large datasets

---

## Search Endpoint Capabilities

### Supported Features
- ✅ **Filter Groups** - Complex AND/OR filter combinations
- ✅ **Custom Field Filtering** - Filter by `customFields.field_slug` with all operators
- ✅ **Advanced Operators** - eq, ne, gt, gte, lt, lte, in, not_in, contains, not_contains, starts_with, ends_with, between, is_null, is_not_null
- ✅ **Date Operators** - date_eq, date_gt, date_gte, date_lt, date_lte, date_between
- ✅ **Property Selection** - Select specific fields via `properties` array
- ✅ **Nested Properties** - Support for `author.name`, `postType.slug`, etc. (partial)
- ✅ **Cursor-based Pagination** - Better for large datasets
- ✅ **Multi-entity Search** - Can search posts, media, users, taxonomies, or all
- ✅ **Full-text Search** - Text search across title, content, excerpt

### Limitations
- ❌ **Requires API Key** - Not publicly accessible (requires authentication)
- ❌ **No taxonomy filtering** - Cannot filter by taxonomy terms directly
- ❌ **No relationship filtering** - Cannot filter by post relationships (e.g., programs by university)
- ❌ **No post_type filter** - Must use filterGroups with postTypeId
- ❌ **Complex syntax** - Requires POST with JSON body, more complex than query params

---

## Missing Use Cases in Posts Endpoint

### 1. Taxonomy Term Filtering
**Use Case**: Get all programs with a specific taxonomy term (e.g., "Bachelor" degree level)

**Current Status**: ❌ Not supported
**Workaround**: Use search endpoint with filterGroups (requires API key)

**Example Needed**:
```
GET /api/public/v1/:orgSlug/posts?post_type=programs&taxonomy=program-degree-level:bachelor
```

### 2. Custom Field Filtering
**Use Case**: Get all programs where custom field "tuition_fee" is less than 5000

**Current Status**: ❌ Not supported
**Workaround**: Use search endpoint with filterGroups

**Example Needed**:
```
GET /api/public/v1/:orgSlug/posts?post_type=programs&custom_field=tuition_fee&operator=lt&value=5000
```

### 3. Multiple Taxonomy Filters
**Use Case**: Get programs with "Bachelor" degree AND "English" language

**Current Status**: ❌ Not supported
**Workaround**: Use search endpoint with filterGroups

### 4. Author Filtering
**Use Case**: Get all posts by a specific author

**Current Status**: ❌ Not supported
**Workaround**: Use search endpoint with filterGroups

**Example Needed**:
```
GET /api/public/v1/:orgSlug/posts?author_id=xxx
```

### 5. Post Type Multiple Selection
**Use Case**: Get both "programs" and "blogs" in one request

**Current Status**: ❌ Not supported (only single post_type)
**Workaround**: Make multiple requests or use search endpoint

### 6. Advanced Date Filtering
**Use Case**: Get posts published exactly on a date, or between dates with more control

**Current Status**: ⚠️ Limited (only published_from/published_to)
**Workaround**: Use search endpoint with date operators

### 7. Status Filtering (for API keys with scope)
**Use Case**: Get draft posts (for authenticated users with proper scope)

**Current Status**: ❌ Not supported (always returns published only)
**Workaround**: Use search endpoint with status filter

### 8. Property Selection
**Use Case**: Get only title and slug fields to reduce payload size

**Current Status**: ❌ Not supported (always returns all fields)
**Workaround**: Use search endpoint with properties array

---

## Missing Use Cases in Search Endpoint

### 1. Relationship Filtering
**Use Case**: Get all programs related to a university by university slug

**Current Status**: ❌ Not supported
**Workaround**: Use posts endpoint with `related_to_slug` parameter

**Example Needed**:
```json
{
  "entityType": "posts",
  "filterGroups": [{
    "filters": [{
      "property": "relationships.university",
      "operator": "eq",
      "value": "coventry-university-kazakhstan"
    }]
  }]
}
```

### 2. Taxonomy Term Filtering (Direct)
**Use Case**: Filter by taxonomy term slug directly

**Current Status**: ❌ Not supported (would need to query taxonomy_terms first)
**Workaround**: Use taxonomy term posts endpoint or posts endpoint (if we add it)

### 3. Public Access
**Use Case**: Allow public access without API key for basic searches

**Current Status**: ❌ Requires API key
**Workaround**: Use posts endpoint for basic filtering

---

## Recommendations

### High Priority Additions to Posts Endpoint

1. **Taxonomy Term Filtering** ⭐⭐⭐
   ```bash
   GET /api/public/v1/:orgSlug/posts?post_type=programs&taxonomy=program-degree-level:bachelor
   ```
   - Most common use case
   - Already have taxonomy term posts endpoint, can reuse logic

2. **Custom Field Filtering** ⭐⭐
   ```bash
   GET /api/public/v1/:orgSlug/posts?post_type=programs&custom_field[tuition_fee][lt]=5000
   ```
   - Useful for program filtering
   - Can support basic operators: eq, ne, gt, gte, lt, lte, contains

3. **Multiple Post Types** ⭐
   ```bash
   GET /api/public/v1/:orgSlug/posts?post_type=programs,blogs
   ```
   - Simple enhancement
   - Comma-separated list

### Medium Priority Additions

4. **Author Filtering**
   ```bash
   GET /api/public/v1/:orgSlug/posts?author_id=xxx
   ```

5. **Property Selection**
   ```bash
   GET /api/public/v1/:orgSlug/posts?fields=title,slug,excerpt
   ```

### High Priority Additions to Search Endpoint

1. **Relationship Filtering** ⭐⭐⭐
   ```json
   {
     "filterGroups": [{
       "filters": [{
         "property": "relationships.university.slug",
         "operator": "eq",
         "value": "coventry-university-kazakhstan"
       }]
     }]
   }
   ```

2. **Taxonomy Term Filtering** ⭐⭐
   ```json
   {
     "filterGroups": [{
       "filters": [{
         "property": "taxonomies.program-degree-level",
         "operator": "in",
         "value": ["bachelor", "master"]
       }]
     }]
   }
   ```

3. **Public Access Option** ⭐
   - Allow basic searches without API key (with rate limiting)
   - Require API key only for advanced features

---

## Use Case Matrix

| Use Case | Posts Endpoint | Search Endpoint | Best Solution |
|----------|---------------|-----------------|---------------|
| Filter by post type | ✅ | ⚠️ (via filterGroups) | Posts |
| Filter by taxonomy term | ❌ | ❌ | **MISSING** |
| Filter by custom field | ❌ | ✅ | Search |
| Filter by relationship | ✅ | ❌ | Posts |
| Filter by author | ❌ | ⚠️ (via filterGroups) | Search |
| Text search | ✅ | ✅ | Either |
| Date range | ✅ | ✅ | Either |
| Advanced operators | ❌ | ✅ | Search |
| Filter combinations (AND/OR) | ❌ | ✅ | Search |
| Property selection | ❌ | ✅ | Search |
| Cursor pagination | ❌ | ✅ | Search |
| Public access | ✅ | ❌ | Posts |
| Multiple post types | ❌ | ⚠️ (via filterGroups) | Search |

---

## Conclusion

The **Search endpoint** is more robust for complex filtering but requires authentication. The **Posts endpoint** is simpler and publicly accessible but lacks advanced filtering capabilities.

**Key Gaps**:
1. Posts endpoint: Missing taxonomy and custom field filtering
2. Search endpoint: Missing relationship and taxonomy filtering, requires API key

**Recommendation**: Enhance both endpoints to cover all use cases, with Posts endpoint focusing on common public use cases and Search endpoint for advanced authenticated queries.

