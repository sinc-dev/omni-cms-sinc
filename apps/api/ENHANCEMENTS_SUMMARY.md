# API Endpoints Enhancements Summary

## Overview
Enhanced both the Posts and Search endpoints to support all critical use cases for public-facing websites and advanced queries.

## Posts Endpoint Enhancements (`GET /api/public/v1/:orgSlug/posts`)

### ✅ 1. Taxonomy Term Filtering
**New Parameter**: `taxonomy` (can be repeated)

**Format**: `taxonomy=taxonomy-slug:term-slug`

**Examples**:
```bash
# Single taxonomy filter
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy=program-degree-level:bachelor

# Multiple taxonomy filters (AND logic - post must have all terms)
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy=program-degree-level:bachelor&taxonomy=program-languages:english
```

**Implementation**:
- Supports multiple taxonomy filters
- Uses AND logic (post must have all specified taxonomy terms)
- Returns empty result if taxonomy or term not found

### ✅ 2. Author Filtering
**New Parameter**: `author_id`

**Example**:
```bash
GET /api/public/v1/study-in-kazakhstan/posts?author_id=user123
```

**Implementation**:
- Filters posts by author ID
- Returns empty result if author not found

### ✅ 3. Multiple Post Types
**Enhanced Parameter**: `post_type` (now supports comma-separated values)

**Examples**:
```bash
# Single post type (existing behavior)
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs

# Multiple post types (NEW)
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs,blogs
```

**Implementation**:
- Splits comma-separated post types
- Filters posts that match any of the specified post types (OR logic)

### ✅ 4. Relationship Filtering (Already Implemented)
**Parameters**: `related_to_slug`, `relationship_type`

**Example**:
```bash
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university
```

## Search Endpoint Enhancements (`POST /api/public/v1/:orgSlug/search`)

### ✅ 1. Relationship Filtering
**New Filter Property**: `relationships.{type}.{field}`

**Supported Formats**:
- `relationships.university.slug` - Filter by related university slug
- `relationships.university.id` - Filter by related university ID
- `relationships.{any-type}.slug` - Filter by any relationship type

**Examples**:
```json
{
  "entityType": "posts",
  "filterGroups": [{
    "filters": [{
      "property": "relationships.university.slug",
      "operator": "eq",
      "value": "coventry-university-kazakhstan"
    }],
    "operator": "AND"
  }],
  "limit": 100
}
```

**Supported Operators**: `eq`, `ne`, `in`, `not_in`

### ✅ 2. Taxonomy Term Filtering
**New Filter Property**: `taxonomies.{taxonomy-slug}` or `taxonomies.{taxonomy-slug}.{term-slug}`

**Supported Formats**:
- `taxonomies.program-degree-level` - Filter by taxonomy (requires value with term slugs)
- `taxonomies.program-degree-level.bachelor` - Filter by specific term
- Use `in` operator for multiple terms

**Examples**:
```json
{
  "entityType": "posts",
  "filterGroups": [{
    "filters": [{
      "property": "taxonomies.program-degree-level",
      "operator": "in",
      "value": ["bachelor", "master"]
    }],
    "operator": "AND"
  }],
  "limit": 100
}
```

**Or with specific term in property**:
```json
{
  "entityType": "posts",
  "filterGroups": [{
    "filters": [{
      "property": "taxonomies.program-degree-level.bachelor",
      "operator": "eq",
      "value": true
    }],
    "operator": "AND"
  }]
}
```

**Supported Operators**: `eq`, `ne`, `in`, `not_in`

### ✅ 3. Combined Filtering Example
**Example**: Get programs from Coventry University with Bachelor degree and tuition < 5000

```json
{
  "entityType": "posts",
  "filterGroups": [{
    "filters": [{
      "property": "relationships.university.slug",
      "operator": "eq",
      "value": "coventry-university-kazakhstan"
    }, {
      "property": "taxonomies.program-degree-level",
      "operator": "eq",
      "value": "bachelor"
    }, {
      "property": "customFields.tuition_fee",
      "operator": "lt",
      "value": 5000
    }],
    "operator": "AND"
  }],
  "limit": 100
}
```

## Complete Feature Matrix

| Feature | Posts Endpoint | Search Endpoint |
|---------|---------------|-----------------|
| Post type filtering | ✅ (single or multiple) | ✅ (via filterGroups) |
| Taxonomy term filtering | ✅ (via taxonomy param) | ✅ (via taxonomies.* property) |
| Custom field filtering | ❌ | ✅ (via customFields.* property) |
| Relationship filtering | ✅ (via related_to_slug) | ✅ (via relationships.* property) |
| Author filtering | ✅ (via author_id) | ✅ (via authorId property) |
| Text search | ✅ | ✅ |
| Date range | ✅ | ✅ |
| Advanced operators | ❌ | ✅ (gt, lt, in, contains, etc.) |
| Filter combinations | ❌ | ✅ (AND/OR groups) |
| Property selection | ❌ | ✅ |
| Cursor pagination | ❌ | ✅ |
| Public access | ✅ | ❌ (requires API key) |

## Usage Examples

### Posts Endpoint - Get Programs from Coventry University with Bachelor Degree
```bash
curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=program-degree-level:bachelor&per_page=100"
```

### Search Endpoint - Advanced Filtering
```bash
curl -X POST "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/search" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "entityType": "posts",
    "filterGroups": [{
      "filters": [{
        "property": "relationships.university.slug",
        "operator": "eq",
        "value": "coventry-university-kazakhstan"
      }, {
        "property": "taxonomies.program-degree-level",
        "operator": "in",
        "value": ["bachelor", "master"]
      }],
      "operator": "AND"
    }],
    "limit": 100
  }'
```

## Files Modified

1. **`apps/api/src/routes/public/posts.ts`**
   - Added taxonomy term filtering
   - Added author filtering
   - Enhanced post type filtering (multiple types)
   - All changes maintain backward compatibility

2. **`apps/api/src/lib/search/filter-builder.ts`**
   - Added relationship filtering support
   - Added taxonomy term filtering support
   - Handles nested properties like `relationships.university.slug`

3. **`apps/api/src/routes/public/mcp.ts`**
   - Updated documentation with new parameters
   - Added examples for all new features
   - Documented filter properties for search endpoint

## Testing Recommendations

1. Test Posts endpoint with:
   - Single taxonomy filter
   - Multiple taxonomy filters (AND logic)
   - Author filtering
   - Multiple post types
   - Combined filters (taxonomy + relationship + post type)

2. Test Search endpoint with:
   - Relationship filtering by slug
   - Relationship filtering by ID
   - Taxonomy filtering with single term
   - Taxonomy filtering with multiple terms (in operator)
   - Combined filters (relationship + taxonomy + custom fields)

3. Test edge cases:
   - Non-existent taxonomy/term
   - Non-existent author
   - Non-existent relationship
   - Empty results
   - Invalid parameter formats

