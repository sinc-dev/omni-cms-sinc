# Public API Routes for Next.js Applications

This document lists all public API routes available for fetching data from organizations in a Next.js application.

## Base URL

```
https://api.yourdomain.com/api/public/v1
```

Or for local development:
```
http://localhost:8787/api/public/v1
```

## Organization Slugs

- `study-in-kazakhstan` - Study In Kazakhstan
- `study-in-north-cyprus` - Study in North Cyprus  
- `paris-american-international-university` - Paris American International University

---

## 1. List Published Posts

Get a paginated list of published posts for an organization.

**Endpoint:** `GET /:orgSlug/posts`

**Example:**
```typescript
// Fetch blog posts
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/posts?page=1&per_page=20'
);
const data = await response.json();
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `per_page` (optional) - Items per page (default: 20, max: 100)
- `post_type` (optional) - Filter by post type slug (e.g., `programs`, `universities`, `blogs`)
- `search` (optional) - Search query string
- `published_from` (optional) - Filter posts published after this date (ISO 8601)
- `published_to` (optional) - Filter posts published before this date (ISO 8601)
- `sort` (optional) - Sort order (default: `publishedAt_desc`)
  - Options: `publishedAt_desc`, `publishedAt_asc`, `createdAt_desc`, `createdAt_asc`, `title_asc`, `title_desc`

**Response:**
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
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
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
        "altText": "Image description"
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

---

## 2. Get Single Post by Slug

Get detailed information about a single published post.

**Endpoint:** `GET /:orgSlug/posts/:slug`

**Example:**
```typescript
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/posts/my-blog-post-slug'
);
const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "data": {
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
    },
    "relatedPosts": [
      {
        "id": "related-post-id",
        "title": "Related Post Title",
        "slug": "related-post-slug",
        "excerpt": "Related post excerpt...",
        "publishedAt": "2024-01-14T10:00:00Z",
        "relationshipType": "related"
      }
    ]
  }
}
```

---

## 3. Get Taxonomy with Terms

Get a taxonomy and all its terms (e.g., categories, tags, program-types).

**Endpoint:** `GET /:orgSlug/taxonomies/:taxonomySlug`

**Example:**
```typescript
// Get all categories
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/taxonomies/categories'
);
const data = await response.json();

// Get all program types
const response2 = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/taxonomies/program-types'
);
const data2 = await response2.json();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "taxonomy-id",
    "name": "Categories",
    "slug": "categories",
    "description": "Post categories",
    "isHierarchical": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "terms": [
      {
        "id": "term-id",
        "name": "Category Name",
        "slug": "category-slug",
        "description": "Category description",
        "parentId": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "children": [
          {
            "id": "child-term-id",
            "name": "Subcategory",
            "slug": "subcategory-slug",
            "parentId": "term-id"
          }
        ]
      }
    ]
  }
}
```

---

## 4. Get Posts by Taxonomy Term

Get all published posts associated with a specific taxonomy term.

**Endpoint:** `GET /:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts`

**Example:**
```typescript
// Get all posts in a specific category
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/taxonomies/categories/engineering/posts?page=1&per_page=20'
);
const data = await response.json();

// Get all programs of a specific type
const response2 = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/taxonomies/program-types/masters/posts'
);
const data2 = await response2.json();
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `per_page` (optional) - Items per page (default: 20, max: 100)
- `post_type` (optional) - Filter by post type slug
- `search` (optional) - Search query string
- `published_from` (optional) - Filter posts published after this date
- `published_to` (optional) - Filter posts published before this date
- `sort` (optional) - Sort order (default: `publishedAt_desc`)

**Response:** Same format as "List Published Posts"

---

## 5. Search Posts

Search across published posts (requires API key).

**Endpoint:** `POST /:orgSlug/search`

**Headers:**
```
Authorization: Bearer <api-key>
```

**Example:**
```typescript
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/search',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({
      search: 'engineering programs',
      entityType: 'posts',
      filters: {
        postType: 'programs',
        taxonomies: {
          'program-types': ['masters', 'bachelors']
        }
      },
      sort: { field: 'publishedAt', order: 'desc' },
      page: 1,
      perPage: 20
    })
  }
);
const data = await response.json();
```

**Request Body:**
```json
{
  "search": "search query",
  "entityType": "posts", // or "all"
  "filters": {
    "postType": "programs", // optional
    "taxonomies": {
      "categories": ["term-slug-1", "term-slug-2"],
      "program-types": ["masters"]
    },
    "publishedFrom": "2024-01-01T00:00:00Z",
    "publishedTo": "2024-12-31T23:59:59Z"
  },
  "sort": {
    "field": "publishedAt",
    "order": "desc" // or "asc"
  },
  "page": 1,
  "perPage": 20
}
```

**Response:** Same format as "List Published Posts"

---

## 6. Get Sitemap

Get XML sitemap for SEO purposes.

**Endpoint:** `GET /:orgSlug/sitemap.xml`

**Example:**
```typescript
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/sitemap.xml'
);
const xml = await response.text();
```

**Response:** XML sitemap format

---

## 7. Get Post SEO Metadata

Get SEO metadata for a specific post.

**Endpoint:** `GET /:orgSlug/posts/:slug/seo`

**Example:**
```typescript
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/posts/my-post-slug/seo'
);
const data = await response.json();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Post Title | Site Name",
    "description": "Post meta description",
    "ogImage": "https://...",
    "canonicalUrl": "https://site.com/posts/my-post-slug"
  }
}
```

---

## 8. Track Post Share

Track when a post is shared on social media.

**Endpoint:** `POST /:orgSlug/posts/:postId/share`

**Example:**
```typescript
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/posts/post-id/share',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      platform: 'facebook', // or 'twitter', 'linkedin', etc.
      url: 'https://site.com/posts/post-slug'
    })
  }
);
```

**Request Body:**
```json
{
  "platform": "facebook",
  "url": "https://site.com/posts/post-slug"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Share tracked"
}
```

---

## 9. Track Analytics Event

Track custom analytics events.

**Endpoint:** `POST /:orgSlug/analytics/track`

**Example:**
```typescript
const response = await fetch(
  'https://api.yourdomain.com/api/public/v1/study-in-kazakhstan/analytics/track',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventType: 'page_view',
      postId: 'post-id',
      metadata: {
        path: '/posts/my-post',
        referrer: 'https://google.com'
      }
    })
  }
);
```

**Request Body:**
```json
{
  "eventType": "page_view",
  "postId": "post-id", // optional
  "metadata": {
    "path": "/posts/my-post",
    "referrer": "https://google.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event tracked"
}
```

---

## Next.js Usage Examples

### Using Fetch API

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com/api/public/v1';

export async function getPosts(orgSlug: string, options = {}) {
  const params = new URLSearchParams({
    page: options.page?.toString() || '1',
    per_page: options.perPage?.toString() || '20',
    ...(options.postType && { post_type: options.postType }),
    ...(options.search && { search: options.search }),
  });

  const response = await fetch(`${API_BASE_URL}/${orgSlug}/posts?${params}`);
  if (!response.ok) throw new Error('Failed to fetch posts');
  return response.json();
}

export async function getPost(orgSlug: string, slug: string) {
  const response = await fetch(`${API_BASE_URL}/${orgSlug}/posts/${slug}`);
  if (!response.ok) throw new Error('Failed to fetch post');
  return response.json();
}

export async function getTaxonomy(orgSlug: string, taxonomySlug: string) {
  const response = await fetch(`${API_BASE_URL}/${orgSlug}/taxonomies/${taxonomySlug}`);
  if (!response.ok) throw new Error('Failed to fetch taxonomy');
  return response.json();
}
```

### Using in React Components

```typescript
// app/posts/page.tsx
import { getPosts } from '@/lib/api-client';

export default async function PostsPage() {
  const { data: posts } = await getPosts('study-in-kazakhstan', {
    postType: 'programs',
    perPage: 20,
  });

  return (
    <div>
      <h1>Programs</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

### Using SWR for Client-Side Fetching

```typescript
// components/PostsList.tsx
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PostsList({ orgSlug }: { orgSlug: string }) {
  const { data, error, isLoading } = useSWR(
    `${process.env.NEXT_PUBLIC_API_URL}/api/public/v1/${orgSlug}/posts`,
    fetcher
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading posts</div>;

  return (
    <div>
      {data?.data?.map((post: any) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
        </article>
      ))}
    </div>
  );
}
```

---

## Common Post Types

Based on the organizations:

- **Blogs** (`blogs`) - Blog posts/articles
- **Programs** (`programs`) - Academic programs (5000+ for Study In Kazakhstan)
- **Universities** (`universities`) - University profiles
- **Team Members** (`team-members`) - Staff/team member profiles
- **Academic Staff** (`academic-staff`) - Academic staff profiles

---

## Common Taxonomies

- **Categories** (`categories`) - Post categories
- **Tags** (`tags`) - Post tags
- **Program Types** (`program-types`) - e.g., Masters, Bachelors, PhD
- **Fields of Study** (`fields-of-study`) - e.g., Engineering, Medicine, Business
- **Universities** (`universities`) - University taxonomy terms

---

## Authentication (Optional)

Most endpoints work without authentication. However, some features may require an API key:

- **Search** - Requires API key with `posts:search` scope
- **Analytics Tracking** - Works without API key, but better tracking with key

**To use API key:**
```typescript
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
  }
});
```

---

## Caching

Public endpoints include caching headers:
- **List endpoints**: 15 minutes cache
- **Single post**: 10 minutes cache
- **Taxonomies**: 15 minutes cache

Use `stale-while-revalidate` for optimal performance in Next.js.

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Post not found"
  }
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized (API key required)
- `403` - Forbidden (API key doesn't have permission)
- `404` - Not Found
- `500` - Internal Server Error

