# Public API Guide

## Overview

The Omni-CMS Public API allows external applications to consume content published by organizations. The API is designed to be simple, fast, and cache-friendly.

## Base URL

```
https://your-domain.com/api/public/:orgSlug
```

Replace `:orgSlug` with your organization's slug.

## Authentication

### Option 1: Public Access (No Authentication)

Public API endpoints can be accessed without authentication. Content is publicly available.

### Option 2: API Key Authentication

For enhanced rate limits and analytics, you can use API key authentication:

**Header:**
```
X-API-Key: omni_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Or using Authorization header:**
```
Authorization: Bearer omni_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys can be generated in the admin panel under Organization Settings → API Keys.

## Rate Limiting

- **Public Access**: 1,000 requests per hour per IP address
- **API Key**: 10,000 requests per hour (configurable per key)

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests per hour
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Caching

All public API responses include caching headers:
- **Sitemap**: Cached for 15 minutes (`s-maxage=900`)
- **Post Lists**: Cached for 5 minutes (`s-maxage=300`)
- **Individual Posts**: Cached for 10 minutes (`s-maxage=600`)
- **Taxonomies**: Cached for 15 minutes (`s-maxage=900`)

Cache is automatically invalidated when content is updated.

## Endpoints

### Sitemap

Get an XML sitemap of all published posts for an organization.

```
GET /api/public/:orgSlug/sitemap.xml
```

**Example Request:**

```bash
curl "https://example.com/api/public/my-blog/sitemap.xml"
```

**Example Response:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/blog/my-first-post</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Use Case:** Include in your Next.js project's `sitemap.ts` or `robots.txt` for SEO.

**Example for Next.js:**

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await fetch(
    'https://your-cms.com/api/public/my-blog/sitemap.xml',
    { next: { revalidate: 3600 } }
  );
  
  const xml = await response.text();
  // Parse XML or fetch posts directly and generate sitemap
  return [...];
}
```

### List Posts

Get a paginated list of published posts.

```
GET /api/public/:orgSlug/posts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `per_page` | number | Items per page (default: 20, max: 100) |
| `post_type` | string | Filter by post type slug |
| `search` | string | Search posts by title |
| `taxonomy` | string | Filter by taxonomy slug |
| `term` | string | Filter by taxonomy term slug |
| `author_id` | string | Filter posts by author ID |
| `published_from` | ISO 8601 | Filter posts published after this date |
| `published_to` | ISO 8601 | Filter posts published before this date |
| `sort` | string | Sort order (e.g., `publishedAt_desc`, `title_asc`) |

**Example Request:**

```bash
curl "https://example.com/api/public/my-blog/posts?page=1&per_page=10&post_type=blog-post"
```

**Example Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "title": "My First Blog Post",
      "slug": "my-first-blog-post",
      "excerpt": "This is the excerpt...",
      "content": "<p>Full HTML content...</p>",
      "author": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "postType": {
        "id": "type123",
        "name": "Blog Post",
        "slug": "blog-post"
      },
      "featuredImage": {
        "id": "media123",
        "url": "https://...",
        "thumbnailUrl": "https://...?variant=thumbnail",
        "largeUrl": "https://...?variant=large",
        "altText": "Featured image",
        "caption": "Optional caption"
      },
      "publishedAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-10T08:00:00Z",
      "taxonomies": {
        "categories": [
          {
            "id": "term123",
            "name": "Technology",
            "slug": "technology"
          }
        ],
        "tags": [
          {
            "id": "term456",
            "name": "Web Development",
            "slug": "web-development"
          }
        ]
      },
      "customFields": {
        "reading_time": 5,
        "author_bio": "John is a writer..."
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 10,
    "total": 42,
    "total_pages": 5
  }
}
```

### Get Single Post

Get a single post by its slug.

```
GET /api/public/:orgSlug/posts/:slug
```

**Example Request:**

```bash
curl "https://example.com/api/public/my-blog/posts/my-first-blog-post"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "excerpt": "This is the excerpt...",
    "content": "<p>Full HTML content...</p>",
    "author": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "postType": {
      "id": "type123",
      "name": "Blog Post",
      "slug": "blog-post"
    },
    "featuredImage": {
      "id": "media123",
      "url": "https://...",
      "thumbnailUrl": "https://...?variant=thumbnail",
      "largeUrl": "https://...?variant=large",
      "altText": "Featured image",
      "caption": "Optional caption"
    },
    "publishedAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-10T08:00:00Z",
    "taxonomies": {
      "categories": [
        {
          "id": "term123",
          "name": "Technology",
          "slug": "technology"
        }
      ],
      "tags": [
        {
          "id": "term456",
          "name": "Web Development",
          "slug": "web-development"
        }
      ]
    },
    "customFields": {
      "reading_time": 5,
      "author_bio": "John is a writer..."
    },
    "relatedPosts": [
      {
        "id": "post456",
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

### Get Taxonomy

Get a taxonomy with all its terms.

```
GET /api/public/:orgSlug/taxonomies/:taxonomySlug
```

**Example Request:**

```bash
curl "https://example.com/api/public/my-blog/taxonomies/categories"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "tax123",
    "name": "Categories",
    "slug": "categories",
    "terms": [
      {
        "id": "term123",
        "name": "Technology",
        "slug": "technology",
        "postCount": 42
      },
      {
        "id": "term456",
        "name": "Design",
        "slug": "design",
        "postCount": 18
      }
    ]
  }
}
```

### Get Posts by Taxonomy Term

Get posts associated with a specific taxonomy term.

```
GET /api/public/:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts
```

**Query Parameters:** Same as [List Posts](#list-posts)

**Example Request:**

```bash
curl "https://example.com/api/public/my-blog/taxonomies/categories/technology/posts?page=1&per_page=10"
```

**Example Response:** Same format as [List Posts](#list-posts)

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Post not found",
    "details": {}
  }
}
```

**Common Error Codes:**

- `BAD_REQUEST`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Integration Examples

### Next.js App Router

```typescript
// app/blog/page.tsx
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  featuredImage: {
    url: string;
    thumbnailUrl: string;
    altText: string | null;
  } | null;
  taxonomies: {
    categories?: Array<{ id: string; name: string; slug: string }>;
    tags?: Array<{ id: string; name: string; slug: string }>;
  };
}

async function BlogPage() {
  const response = await fetch(
    'https://your-cms.com/api/public/my-blog/posts?page=1&per_page=10',
    {
      headers: {
        'X-API-Key': process.env.OMNI_API_KEY || '',
      },
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  const posts: Post[] = data.data;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article key={post.id} className="border rounded-lg overflow-hidden">
            {post.featuredImage && (
              <Image
                src={post.featuredImage.thumbnailUrl}
                alt={post.featuredImage.altText || post.title}
                width={400}
                height={250}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
              <div 
                className="text-gray-600 mb-4"
                dangerouslySetInnerHTML={{ __html: post.excerpt }} 
              />
              <div className="flex items-center gap-2">
                {post.author.avatarUrl && (
                  <Image
                    src={post.author.avatarUrl}
                    alt={post.author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-gray-500">{post.author.name}</span>
                <span className="text-sm text-gray-400">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
              </div>
              {post.taxonomies.tags && post.taxonomies.tags.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {post.taxonomies.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
```

### React with SWR

```typescript
import useSWR from 'swr';

function usePosts(orgSlug: string, options: any = {}) {
  const { data, error } = useSWR(
    `/api/public/${orgSlug}/posts?${new URLSearchParams(options)}`,
    async (url) => {
      const response = await fetch(`https://your-cms.com${url}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_OMNI_API_KEY || '',
        },
      });
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error.message);
      }
      
      return data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5 minutes
    }
  );

  return {
    posts: data?.data || [],
    meta: data?.meta,
    isLoading: !error && !data,
    isError: error,
  };
}
```

### Node.js/Server-Side

```javascript
const fetch = require('node-fetch');

async function getPosts(orgSlug, options = {}) {
  const params = new URLSearchParams({
    page: options.page || 1,
    per_page: options.perPage || 20,
    ...options.filters,
  });

  const response = await fetch(
    `https://your-cms.com/api/public/${orgSlug}/posts?${params}`,
    {
      headers: {
        'X-API-Key': process.env.OMNI_API_KEY,
      },
    }
  );

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data;
}

// Usage
const posts = await getPosts('my-blog', {
  page: 1,
  perPage: 10,
  filters: {
    post_type: 'blog-post',
  },
});
```

### Static Site Generation (SSG)

For static sites, fetch content at build time:

```typescript
// lib/posts.ts
export async function getAllPosts() {
  const response = await fetch(
    'https://your-cms.com/api/public/my-blog/posts?per_page=100',
    {
      headers: {
        'X-API-Key': process.env.OMNI_API_KEY,
      },
    }
  );

  const data = await response.json();
  return data.success ? data.data : [];
}

// pages/blog/[slug].tsx (Next.js Pages Router)
export async function getStaticPaths() {
  const posts = await getAllPosts();
  
  return {
    paths: posts.map((post) => ({
      params: { slug: post.slug },
    })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }) {
  const response = await fetch(
    `https://your-cms.com/api/public/my-blog/posts/${params.slug}`,
    {
      headers: {
        'X-API-Key': process.env.OMNI_API_KEY,
      },
    }
  );

  const data = await response.json();

  if (!data.success) {
    return { notFound: true };
  }

  return {
    props: {
      post: data.data,
    },
    revalidate: 600, // Revalidate every 10 minutes
  };
}
```

## Response Format

All post responses include the following structure:

### Post Object Fields

- `id` (string): Unique post identifier
- `title` (string): Post title
- `slug` (string): URL-friendly identifier
- `excerpt` (string | null): Short description
- `content` (string): Full HTML content
- `status` (string): Post status (always "published" in public API)
- `publishedAt` (string | null): ISO 8601 timestamp
- `updatedAt` (string): ISO 8601 timestamp
- `createdAt` (string): ISO 8601 timestamp
- `author` (object): Author information
  - `id` (string): Author user ID
  - `name` (string): Author name
  - `email` (string): Author email
  - `avatarUrl` (string | null): Author avatar URL
- `postType` (object): Post type information
  - `id` (string): Post type ID
  - `name` (string): Post type name
  - `slug` (string): Post type slug
- `featuredImage` (object | null): Featured image data
  - `id` (string): Media ID
  - `url` (string): Original image URL
  - `thumbnailUrl` (string): Thumbnail variant URL
  - `largeUrl` (string): Large variant URL
  - `altText` (string | null): Alt text for accessibility
  - `caption` (string | null): Image caption
- `taxonomies` (object): Grouped by taxonomy slug
  - Each key is a taxonomy slug (e.g., "categories", "tags")
  - Value is an array of term objects with `id`, `name`, and `slug`
- `customFields` (object): Custom field values keyed by field slug
- `relatedPosts` (array, single post only): Related posts
  - `id` (string): Related post ID
  - `title` (string): Related post title
  - `slug` (string): Related post slug
  - `excerpt` (string | null): Related post excerpt
  - `publishedAt` (string | null): ISO 8601 timestamp
  - `relationshipType` (string): Type of relationship (e.g., "related", "reference")

## Best Practices

1. **Use Caching**: Leverage CDN caching and revalidation for better performance
2. **Handle Errors**: Always check the `success` field and handle errors gracefully
3. **Rate Limiting**: Monitor rate limit headers and implement exponential backoff
4. **Pagination**: Use pagination for large lists to avoid overwhelming your application
5. **API Keys**: Use API keys for production applications to get higher rate limits
6. **Content Updates**: Respect cache headers and revalidate when content is updated
7. **Sitemaps**: Include sitemap endpoint in your SEO strategy
8. **Featured Images**: Always check if `featuredImage` exists before accessing properties
9. **Author Avatars**: Provide fallback UI when `avatarUrl` is null
10. **Related Posts**: Use related posts to improve content discovery and user engagement

## Migration from v1

If you're migrating from a previous version:

1. API responses now include a `success` field
2. Error responses follow a consistent format
3. Rate limiting headers are standardized
4. Cache headers use standard HTTP caching directives

## Support

For questions or issues, please contact support or refer to the main API documentation.

