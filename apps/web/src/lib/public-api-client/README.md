# Public API Client

Client for consuming published content from the Omni-CMS public API. This is designed for frontend applications (like Next.js) that need to display published posts, taxonomies, and other public content.

## Installation

The public API client is already included in the project. Import it where needed:

```typescript
import { publicApiClient } from '@/lib/public-api-client';
// or
import publicApiClient from '@/lib/public-api-client';
```

## Basic Usage

### Fetching Posts

```typescript
import { publicApiClient } from '@/lib/public-api-client';

// Get first page of posts
const { data: posts, meta } = await publicApiClient.getPosts('study-in-kazakhstan', {
  page: 1,
  perPage: 20,
});

// Filter by post type
const programs = await publicApiClient.getPosts('study-in-kazakhstan', {
  postType: 'programs',
  perPage: 50,
});

// Search posts
const results = await publicApiClient.getPosts('study-in-kazakhstan', {
  search: 'engineering',
  sort: 'publishedAt_desc',
});

// Filter by date range
const recentPosts = await publicApiClient.getPosts('study-in-kazakhstan', {
  publishedFrom: '2024-01-01T00:00:00Z',
  publishedTo: '2024-12-31T23:59:59Z',
  sort: 'publishedAt_desc',
});
```

### Fetching a Single Post

```typescript
const { data: post } = await publicApiClient.getPost('study-in-kazakhstan', 'my-post-slug');
// post includes: author, postType, featuredImage, taxonomies, customFields, relatedPosts
```

### Fetching Taxonomies

```typescript
// Get all categories
const { data: categories } = await publicApiClient.getTaxonomy('study-in-kazakhstan', 'categories');

// Get all program types
const { data: programTypes } = await publicApiClient.getTaxonomy('study-in-kazakhstan', 'program-types');
```

### Fetching Posts by Taxonomy Term

```typescript
const { data: posts } = await publicApiClient.getPostsByTaxonomyTerm(
  'study-in-kazakhstan',
  'program-types',
  'masters',
  {
    page: 1,
    perPage: 20,
  }
);
```

## Using React Hooks

For React components, use the provided hooks for automatic state management:

### usePublicPosts Hook

```tsx
import { usePublicPosts } from '@/lib/hooks/use-public-posts';

function PostsList() {
  const { posts, meta, isLoading, isError, error, nextPage, previousPage } = usePublicPosts({
    orgSlug: 'study-in-kazakhstan',
    postType: 'programs',
    perPage: 20,
    revalidateInterval: 300000, // Revalidate every 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          {post.featuredImage && (
            <img src={post.featuredImage.url} alt={post.featuredImage.altText || ''} />
          )}
        </article>
      ))}
      
      {meta && (
        <div>
          <p>Page {meta.page} of {meta.totalPages}</p>
          <button onClick={previousPage} disabled={meta.page === 1}>Previous</button>
          <button onClick={nextPage} disabled={meta.page === meta.totalPages}>Next</button>
        </div>
      )}
    </div>
  );
}
```

### usePublicPost Hook

```tsx
import { usePublicPost } from '@/lib/hooks/use-public-posts';

function PostDetail({ slug }: { slug: string }) {
  const { post, isLoading, isError } = usePublicPost('study-in-kazakhstan', slug);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !post) return <div>Post not found</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
      
      {post.taxonomies.categories && (
        <div>
          <h3>Categories</h3>
          <ul>
            {post.taxonomies.categories.map((cat) => (
              <li key={cat.id}>{cat.name}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
```

## Query Parameters

### getPosts Options

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `1` |
| `perPage` | number | Items per page (default: 20, max: 100) | `20` |
| `postType` | string | Filter by post type slug | `'programs'` |
| `search` | string | Search in title, content, excerpt | `'engineering'` |
| `publishedFrom` | string | Filter posts published after this date (ISO 8601) | `'2024-01-01T00:00:00Z'` |
| `publishedTo` | string | Filter posts published before this date (ISO 8601) | `'2024-12-31T23:59:59Z'` |
| `sort` | string | Sort order: `field_asc` or `field_desc` | `'publishedAt_desc'` |

### Sort Options

Supported sort fields:
- `publishedAt` - Publication date
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `title` - Post title

Examples:
- `'publishedAt_desc'` - Newest first (default)
- `'publishedAt_asc'` - Oldest first
- `'title_asc'` - Alphabetical by title

## Response Format

### Paginated Response

```typescript
{
  success: true,
  data: [
    {
      id: "post-id",
      title: "Post Title",
      slug: "post-slug",
      excerpt: "Post excerpt...",
      content: "Full post content...",
      status: "published",
      publishedAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      createdAt: "2024-01-10T08:00:00Z",
      author: {
        id: "user-id",
        name: "Author Name",
        email: "author@example.com",
        avatarUrl: "https://..."
      },
      postType: {
        id: "post-type-id",
        name: "Blog Post",
        slug: "blogs"
      },
      featuredImage: {
        id: "media-id",
        url: "https://...",
        thumbnailUrl: "https://...",
        altText: "Image description",
        caption: "Image caption"
      },
      taxonomies: {
        categories: [
          { id: "term-id", name: "Category", slug: "category-slug" }
        ],
        tags: [
          { id: "term-id", name: "Tag", slug: "tag-slug" }
        ]
      },
      customFields: {
        "field-slug": "field-value"
      }
    }
  ],
  meta: {
    page: 1,
    perPage: 20,
    total: 150,
    totalPages: 8
  }
}
```

## Next.js Usage Examples

### Server Component (App Router)

```tsx
// app/posts/page.tsx
import { publicApiClient } from '@/lib/public-api-client';

export default async function PostsPage() {
  const { data: posts, meta } = await publicApiClient.getPosts('study-in-kazakhstan', {
    page: 1,
    perPage: 20,
  });

  return (
    <div>
      <h1>Posts</h1>
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

### Client Component with SWR

```tsx
// components/PostsList.tsx
'use client';

import useSWR from 'swr';
import { publicApiClient } from '@/lib/public-api-client';

const fetcher = (orgSlug: string, options: any) => 
  publicApiClient.getPosts(orgSlug, options);

export function PostsList({ orgSlug }: { orgSlug: string }) {
  const { data, error, isLoading } = useSWR(
    [orgSlug, { page: 1, perPage: 20 }],
    ([slug, opts]) => fetcher(slug, opts),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 300000, // 5 minutes
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading posts</div>;

  return (
    <div>
      {data?.data?.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
        </article>
      ))}
    </div>
  );
}
```

## Environment Variables

Set the following environment variables:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# or for local development:
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Error Handling

The client throws errors that can be caught and handled:

```typescript
try {
  const { data: posts } = await publicApiClient.getPosts('study-in-kazakhstan');
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to fetch posts:', error.message);
  }
}
```

## Caching

The public API endpoints include caching headers:
- List endpoints: 15 minutes cache
- Single post: 10 minutes cache
- Taxonomies: 15 minutes cache

For optimal performance in Next.js, use `stale-while-revalidate`:

```typescript
const { data: posts } = await publicApiClient.getPosts('study-in-kazakhstan', {
  page: 1,
  perPage: 20,
}, {
  next: { revalidate: 900 } // 15 minutes
});
```

