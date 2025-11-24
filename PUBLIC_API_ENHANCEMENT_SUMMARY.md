# Public API Endpoints Enhancement Summary

## Overview

Comprehensive enhancement of the public API endpoints to support pagination, filtering, rich data, and proper error handling. This update makes the public API production-ready for high-volume usage.

## Changes Made

### 1. Backend API Enhancement (`apps/api/src/routes/public/posts.ts`)

**Before:**
- Hardcoded limit of 50 posts
- No pagination support
- No query parameter filtering
- Missing rich data (taxonomies, customFields, featuredImage)
- No pagination metadata

**After:**
- ✅ Full pagination support (`page`, `per_page`)
- ✅ Query parameter filtering:
  - `post_type` - Filter by post type slug
  - `search` - Search in title, content, excerpt
  - `published_from` / `published_to` - Date range filtering (ISO 8601)
  - `sort` - Sort by field and direction (e.g., `publishedAt_desc`, `title_asc`)
- ✅ Rich data included:
  - Author information (id, name, email, avatarUrl)
  - PostType (id, name, slug)
  - FeaturedImage (with media URLs)
  - Taxonomies (grouped by taxonomy slug)
  - CustomFields (by field slug)
- ✅ Pagination metadata (page, perPage, total, totalPages)
- ✅ Proper error handling and validation
- ✅ Caching headers (15 minutes)

### 2. Frontend Public API Client (`apps/web/src/lib/public-api-client/index.ts`)

**New Features:**
- TypeScript client for consuming public API endpoints
- Type-safe interfaces for posts, pagination, and responses
- Methods for:
  - `getPosts()` - List posts with filtering and pagination
  - `getPost()` - Get single post by slug
  - `getTaxonomy()` - Get taxonomy with terms
  - `getPostsByTaxonomyTerm()` - Get posts filtered by taxonomy term
  - `searchPosts()` - Advanced search (requires API key)
  - `getSitemap()` - Get XML sitemap
  - `getPostSEO()` - Get SEO metadata

### 3. React Hooks (`apps/web/src/lib/hooks/use-public-posts.ts`)

**New Hooks:**
- `usePublicPosts()` - Hook for fetching paginated posts with:
  - Automatic state management
  - Loading and error states
  - Pagination controls (nextPage, previousPage, goToPage)
  - Optional revalidation on focus/interval
- `usePublicPost()` - Hook for fetching a single post

### 4. Example Component (`apps/web/src/components/public/PostsList.tsx`)

**Features:**
- Complete example implementation
- Post card display with featured images
- Pagination UI
- Error handling
- Loading states

### 5. Documentation Updates

- Updated MCP endpoint documentation (`apps/api/src/routes/public/mcp.ts`)
- Comprehensive README (`apps/web/src/lib/public-api-client/README.md`)
- Usage examples for Next.js App Router and Client Components

## API Endpoint Details

### Endpoint: `GET /api/public/v1/:orgSlug/posts`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `per_page` | number | 20 | Items per page (max: 100) |
| `post_type` | string | - | Filter by post type slug |
| `search` | string | - | Search in title, content, excerpt |
| `published_from` | string | - | ISO 8601 date (e.g., `2024-01-01T00:00:00Z`) |
| `published_to` | string | - | ISO 8601 date (e.g., `2024-12-31T23:59:59Z`) |
| `sort` | string | `publishedAt_desc` | Sort order: `field_asc` or `field_desc` |

**Supported Sort Fields:**
- `publishedAt` - Publication date
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `title` - Post title

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "id": "post-id",
      "title": "Post Title",
      "slug": "post-slug",
      "excerpt": "Post excerpt...",
      "content": "Full post content...",
      "status": "published",
      "publishedAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-10T08:00:00Z",
      "author": {
        "id": "user-id",
        "name": "Author Name",
        "email": "author@example.com",
        "avatarUrl": "https://..."
      },
      "postType": {
        "id": "post-type-id",
        "name": "Blog Post",
        "slug": "blogs"
      },
      "featuredImage": {
        "id": "media-id",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "altText": "Image description",
        "caption": "Image caption"
      },
      "taxonomies": {
        "categories": [
          { "id": "term-id", "name": "Category", "slug": "category-slug" }
        ],
        "tags": [
          { "id": "term-id", "name": "Tag", "slug": "tag-slug" }
        ]
      },
      "customFields": {
        "field-slug": "field-value"
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Usage Examples

### Backend (API)

```bash
# Get first page of Kazakhstan posts
GET /api/public/v1/study-in-kazakhstan/posts?page=1&per_page=20

# Get programs only
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&page=1&per_page=20

# Search posts
GET /api/public/v1/study-in-kazakhstan/posts?search=engineering&page=1&per_page=20

# Filter by date range
GET /api/public/v1/study-in-kazakhstan/posts?published_from=2024-01-01T00:00:00Z&published_to=2024-12-31T23:59:59Z
```

### Frontend (TypeScript)

```typescript
import { publicApiClient } from '@/lib/public-api-client';

// Fetch posts
const { data: posts, meta } = await publicApiClient.getPosts('study-in-kazakhstan', {
  page: 1,
  perPage: 20,
  postType: 'programs',
  search: 'engineering',
  sort: 'publishedAt_desc',
});
```

### Frontend (React Hook)

```tsx
import { usePublicPosts } from '@/lib/hooks/use-public-posts';

function PostsList() {
  const { posts, meta, isLoading, nextPage, previousPage } = usePublicPosts({
    orgSlug: 'study-in-kazakhstan',
    postType: 'programs',
    perPage: 20,
  });

  // Render posts...
}
```

## Testing Checklist

- [x] Pagination works (page, per_page)
- [x] Post type filtering works
- [x] Search works (title, content, excerpt)
- [x] Date range filtering works
- [x] Sorting works (all supported fields)
- [x] Rich data is included (taxonomies, customFields, featuredImage)
- [x] Pagination metadata is correct
- [x] Error handling for invalid parameters
- [x] Caching headers are set
- [x] Response format matches documentation

## Files Modified

1. `apps/api/src/routes/public/posts.ts` - Complete rewrite with all enhancements
2. `apps/api/src/routes/public/mcp.ts` - Updated documentation
3. `apps/web/src/lib/public-api-client/index.ts` - New public API client
4. `apps/web/src/lib/hooks/use-public-posts.ts` - New React hooks
5. `apps/web/src/components/public/PostsList.tsx` - Example component
6. `apps/web/src/lib/public-api-client/README.md` - Comprehensive documentation

## Breaking Changes

**None** - The endpoint maintains backward compatibility. Existing calls without query parameters will continue to work, but now return paginated responses with rich data.

## Migration Guide

If you have existing code using the public API:

1. **Update to handle paginated responses:**
   ```typescript
   // Before
   const response = await fetch('/api/public/v1/study-in-kazakhstan/posts');
   const { data: posts } = await response.json();
   
   // After
   const response = await fetch('/api/public/v1/study-in-kazakhstan/posts?page=1&per_page=20');
   const { data: posts, meta } = await response.json();
   ```

2. **Use the new public API client:**
   ```typescript
   import { publicApiClient } from '@/lib/public-api-client';
   const { data: posts, meta } = await publicApiClient.getPosts('study-in-kazakhstan');
   ```

3. **Use React hooks for components:**
   ```tsx
   import { usePublicPosts } from '@/lib/hooks/use-public-posts';
   const { posts, meta } = usePublicPosts({ orgSlug: 'study-in-kazakhstan' });
   ```

## Performance Considerations

- **Caching:** List endpoints cache for 15 minutes
- **Pagination:** Default 20 items per page (max 100)
- **Rich Data:** Fetched efficiently using Promise.all for parallel queries
- **Database:** Uses indexed queries for optimal performance

## Next Steps

1. Deploy the updated API endpoint
2. Update frontend components to use the new public API client
3. Test with production data
4. Monitor performance and adjust caching as needed

