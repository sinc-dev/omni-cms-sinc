# API Endpoints

## Overview

The API is divided into two main sections:
1. **Admin API**: Full CRUD operations for content management (authenticated)
2. **Public API**: Read-only endpoints for fetching content (public or API key)

All endpoints follow RESTful conventions and return JSON responses.

## Base URLs

- **Admin API**: `/api/admin/*`
- **Public API**: `/api/public/*`

## Authentication

### Admin API
- **Method**: Cloudflare Access
- **Headers**: Automatically handled by Cloudflare Access
- **Context**: User identity and organization access determined from Access token

### Public API
- **Method**: API Key (optional) or public access
- **Header**: `X-API-Key: <organization_api_key>`
- **Context**: Organization determined from API key or domain

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional error context */ }
  }
}
```

## Admin API Endpoints

### Organizations

#### List Organizations
```
GET /api/admin/organizations
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `per_page` (number): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Website",
      "slug": "my-website",
      "domain": "example.com",
      "created_at": 1234567890,
      "updated_at": 1234567890
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 5 }
}
```

#### Get Organization
```
GET /api/admin/organizations/:id
```

#### Create Organization
```
POST /api/admin/organizations
```

**Body:**
```json
{
  "name": "My Website",
  "slug": "my-website",
  "domain": "example.com",
  "settings": {}
}
```

#### Update Organization
```
PATCH /api/admin/organizations/:id
```

#### Delete Organization
```
DELETE /api/admin/organizations/:id
```

---

### Users

#### List Users
```
GET /api/admin/organizations/:orgId/users
```

**Query Parameters:**
- `page`, `per_page`: Pagination
- `role`: Filter by role ID

#### Get User
```
GET /api/admin/users/:id
```

#### Create User
```
POST /api/admin/organizations/:orgId/users
```

**Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role_id": "role-uuid"
}
```

#### Update User Role
```
PATCH /api/admin/organizations/:orgId/users/:userId
```

**Body:**
```json
{
  "role_id": "new-role-uuid"
}
```

#### Remove User from Organization
```
DELETE /api/admin/organizations/:orgId/users/:userId
```

---

### Post Types

#### List Post Types
```
GET /api/admin/organizations/:orgId/post-types
```

#### Get Post Type
```
GET /api/admin/organizations/:orgId/post-types/:id
```

**Response includes associated custom fields:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Blog Post",
    "slug": "blog-post",
    "is_hierarchical": false,
    "fields": [
      {
        "id": "field-uuid",
        "name": "Author Bio",
        "slug": "author_bio",
        "field_type": "textarea",
        "is_required": false,
        "order": 1
      }
    ]
  }
}
```

#### Create Post Type
```
POST /api/admin/organizations/:orgId/post-types
```

**Body:**
```json
{
  "name": "Blog Post",
  "slug": "blog-post",
  "description": "Blog articles",
  "is_hierarchical": false,
  "icon": "📝"
}
```

#### Update Post Type
```
PATCH /api/admin/organizations/:orgId/post-types/:id
```

#### Delete Post Type
```
DELETE /api/admin/organizations/:orgId/post-types/:id
```

---

### Custom Fields

#### List Custom Fields
```
GET /api/admin/organizations/:orgId/custom-fields
```

#### Get Custom Field
```
GET /api/admin/organizations/:orgId/custom-fields/:id
```

#### Create Custom Field
```
POST /api/admin/organizations/:orgId/custom-fields
```

**Body:**
```json
{
  "name": "Author Bio",
  "slug": "author_bio",
  "field_type": "textarea",
  "settings": {
    "max_length": 500,
    "placeholder": "Enter author bio..."
  }
}
```

#### Update Custom Field
```
PATCH /api/admin/organizations/:orgId/custom-fields/:id
```

#### Delete Custom Field
```
DELETE /api/admin/organizations/:orgId/custom-fields/:id
```

#### Attach Field to Post Type
```
POST /api/admin/organizations/:orgId/post-types/:postTypeId/fields
```

**Body:**
```json
{
  "custom_field_id": "field-uuid",
  "is_required": true,
  "order": 1
}
```

#### Detach Field from Post Type
```
DELETE /api/admin/organizations/:orgId/post-types/:postTypeId/fields/:fieldId
```

---

### Posts

#### List Posts
```
GET /api/admin/organizations/:orgId/posts
```

**Query Parameters:**
- `page`, `per_page`: Pagination
- `post_type`: Filter by post type slug
- `status`: Filter by status (draft, published, archived)
- `author_id`: Filter by author
- `search`: Search in title and content
- `taxonomy`: Filter by taxonomy term (format: `taxonomy_slug:term_slug`)
- `sort`: Sort field (created_at, updated_at, title, published_at)
- `order`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "My Blog Post",
      "slug": "my-blog-post",
      "excerpt": "Short description...",
      "status": "published",
      "author": {
        "id": "user-uuid",
        "name": "John Doe",
        "avatar_url": "https://..."
      },
      "post_type": {
        "id": "type-uuid",
        "name": "Blog Post",
        "slug": "blog-post"
      },
      "featured_image": {
        "id": "media-uuid",
        "url": "https://...",
        "alt_text": "Image description"
      },
      "published_at": 1234567890,
      "created_at": 1234567890,
      "updated_at": 1234567890
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 150 }
}
```

#### Get Post
```
GET /api/admin/organizations/:orgId/posts/:id
```

**Response includes full content, custom fields, taxonomies, and relationships:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "content": "<p>Full HTML content...</p>",
    "excerpt": "Short description...",
    "status": "published",
    "author": { /* author object */ },
    "post_type": { /* post type object */ },
    "featured_image": { /* media object */ },
    "custom_fields": {
      "author_bio": "John is a writer...",
      "reading_time": 5,
      "is_featured": true
    },
    "taxonomies": {
      "categories": [
        { "id": "term-uuid", "name": "Technology", "slug": "technology" }
      ],
      "tags": [
        { "id": "term-uuid", "name": "JavaScript", "slug": "javascript" }
      ]
    },
    "relationships": {
      "related": [
        { "id": "post-uuid", "title": "Related Post", "slug": "related-post" }
      ]
    },
    "parent": { /* parent post object if hierarchical */ },
    "children": [ /* child posts if hierarchical */ ],
    "published_at": 1234567890,
    "created_at": 1234567890,
    "updated_at": 1234567890
  }
}
```

#### Create Post
```
POST /api/admin/organizations/:orgId/posts
```

**Body:**
```json
{
  "post_type_id": "type-uuid",
  "title": "My Blog Post",
  "slug": "my-blog-post",
  "content": "<p>Full HTML content...</p>",
  "excerpt": "Short description...",
  "status": "draft",
  "featured_image_id": "media-uuid",
  "parent_id": null,
  "custom_fields": {
    "author_bio": "John is a writer...",
    "reading_time": 5
  },
  "taxonomies": {
    "categories": ["term-uuid-1"],
    "tags": ["term-uuid-2", "term-uuid-3"]
  },
  "relationships": {
    "related": ["post-uuid-1", "post-uuid-2"]
  }
}
```

#### Update Post
```
PATCH /api/admin/organizations/:orgId/posts/:id
```

#### Publish Post
```
POST /api/admin/organizations/:orgId/posts/:id/publish
```

#### Unpublish Post
```
POST /api/admin/organizations/:orgId/posts/:id/unpublish
```

#### Delete Post
```
DELETE /api/admin/organizations/:orgId/posts/:id
```

---

### Taxonomies

#### List Taxonomies
```
GET /api/admin/organizations/:orgId/taxonomies
```

#### Get Taxonomy
```
GET /api/admin/organizations/:orgId/taxonomies/:id
```

**Response includes terms:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Categories",
    "slug": "categories",
    "is_hierarchical": true,
    "terms": [
      {
        "id": "term-uuid",
        "name": "Technology",
        "slug": "technology",
        "parent_id": null,
        "children": [
          {
            "id": "child-uuid",
            "name": "JavaScript",
            "slug": "javascript"
          }
        ]
      }
    ]
  }
}
```

#### Create Taxonomy
```
POST /api/admin/organizations/:orgId/taxonomies
```

**Body:**
```json
{
  "name": "Categories",
  "slug": "categories",
  "is_hierarchical": true
}
```

#### Update Taxonomy
```
PATCH /api/admin/organizations/:orgId/taxonomies/:id
```

#### Delete Taxonomy
```
DELETE /api/admin/organizations/:orgId/taxonomies/:id
```

#### Create Taxonomy Term
```
POST /api/admin/organizations/:orgId/taxonomies/:taxonomyId/terms
```

**Body:**
```json
{
  "name": "Technology",
  "slug": "technology",
  "description": "Tech-related posts",
  "parent_id": null
}
```

#### Update Taxonomy Term
```
PATCH /api/admin/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId
```

#### Delete Taxonomy Term
```
DELETE /api/admin/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId
```

---

### Media

#### List Media
```
GET /api/admin/organizations/:orgId/media
```

**Query Parameters:**
- `page`, `per_page`: Pagination
- `mime_type`: Filter by MIME type (image/*, video/*, etc.)
- `search`: Search in filename and alt text

#### Get Media
```
GET /api/admin/organizations/:orgId/media/:id
```

#### Upload Media
```
POST /api/admin/organizations/:orgId/media
```

**Content-Type**: `multipart/form-data`

**Body:**
- `file`: File to upload
- `alt_text`: (optional) Alt text
- `caption`: (optional) Caption

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "image.jpg",
    "url": "https://r2.example.com/...",
    "mime_type": "image/jpeg",
    "file_size": 123456,
    "width": 1920,
    "height": 1080,
    "alt_text": "Description",
    "created_at": 1234567890
  }
}
```

#### Update Media
```
PATCH /api/admin/organizations/:orgId/media/:id
```

**Body:**
```json
{
  "alt_text": "Updated description",
  "caption": "Updated caption"
}
```

#### Delete Media
```
DELETE /api/admin/organizations/:orgId/media/:id
```

---

## Public API Endpoints

### Get Posts
```
GET /api/public/:orgSlug/posts
```

**Query Parameters:**
- `page`, `per_page`: Pagination
- `post_type`: Filter by post type slug
- `taxonomy`: Filter by taxonomy (format: `taxonomy_slug:term_slug`)
- `search`: Search in title and content
- `sort`: Sort field (published_at, title)
- `order`: Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "My Blog Post",
      "slug": "my-blog-post",
      "excerpt": "Short description...",
      "author": {
        "name": "John Doe",
        "avatar_url": "https://..."
      },
      "featured_image": {
        "url": "https://...",
        "alt_text": "Image description"
      },
      "published_at": 1234567890
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 150 }
}
```

### Get Post by Slug
```
GET /api/public/:orgSlug/posts/:slug
```

**Response includes full content and custom fields:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Blog Post",
    "slug": "my-blog-post",
    "content": "<p>Full HTML content...</p>",
    "excerpt": "Short description...",
    "author": { /* author object */ },
    "featured_image": { /* media object */ },
    "custom_fields": {
      "author_bio": "John is a writer...",
      "reading_time": 5
    },
    "taxonomies": {
      "categories": [ /* category terms */ ],
      "tags": [ /* tag terms */ ]
    },
    "related_posts": [ /* related posts */ ],
    "published_at": 1234567890
  }
}
```

### Get Taxonomies
```
GET /api/public/:orgSlug/taxonomies/:taxonomySlug
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Categories",
    "slug": "categories",
    "terms": [
      {
        "name": "Technology",
        "slug": "technology",
        "post_count": 42
      }
    ]
  }
}
```

### Get Posts by Taxonomy Term
```
GET /api/public/:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts
```

**Query Parameters:** Same as Get Posts

---

## Rate Limiting

- **Admin API**: 1000 requests per hour per user
- **Public API**: 10000 requests per hour per organization

## Caching

Public API responses are cached at the CDN level:
- **Post Lists**: 5 minutes
- **Individual Posts**: 1 hour
- **Taxonomies**: 1 hour

Cache is automatically purged when content is updated.

## Webhooks (Future)

Planned webhook support for:
- Post published
- Post updated
- Post deleted
- Media uploaded
