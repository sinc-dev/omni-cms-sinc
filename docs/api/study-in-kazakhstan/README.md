# Study in Kazakhstan API Documentation

## Overview

This documentation provides complete API reference for building a public website for Study in Kazakhstan. All endpoints return data with custom fields filtered by post type, ensuring only relevant fields are included.

## Base URL

```
https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan
```

## Authentication

**API Key:** `omni_099c139e8f5dce0edfc59cc9926d0cd7`

**Header:**
```
Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7
```

**Note:** Most public endpoints work without authentication, but using the API key provides:
- Higher rate limits
- Analytics tracking
- Access to search endpoint

---

## Quick Reference

| Use Case | Endpoint | Example |
|----------|----------|---------|
| All Universities | `GET /posts?post_type=universities` | [See below](#1-get-all-universities) |
| Single University | `GET /posts/{slug}` | [See below](#2-get-single-university) |
| Programs by University | `GET /posts?post_type=programs&related_to_slug={slug}&relationship_type=university` | [See below](#3-get-programs-of-a-university) |
| All Disciplines | `GET /taxonomies/{taxonomy-slug}` | [See below](#4-get-all-disciplines) |
| Programs by Discipline | `GET /taxonomies/{taxonomy-slug}/{term-slug}/posts?post_type=programs` | [See below](#5-get-programs-of-a-discipline) |

---

## Table of Contents

1. [Get All Universities](#1-get-all-universities)
2. [Get Single University](#2-get-single-university)
3. [Get Programs of a University](#3-get-programs-of-a-university)
4. [Get All Disciplines](#4-get-all-disciplines)
5. [Get Programs of a Discipline](#5-get-programs-of-a-discipline)
6. [Field Selection](#field-selection)
7. [Custom Fields Reference](#custom-fields-reference)
8. [Response Structure](#response-structure)

---

## 1. Get All Universities

Get a paginated list of all universities.

### Endpoint

```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=universities&page=1&per_page=20
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `post_type` | string | Yes | - | Must be `"universities"` |
| `page` | number | No | 1 | Page number |
| `per_page` | number | No | 20 | Items per page (max: 100) |
| `sort` | string | No | `publishedAt_desc` | Sort order (e.g., `title_asc`, `publishedAt_desc`) |
| `fields` | string | No | all | Comma-separated list of fields to return |
| `search` | string | No | - | Search in title, content, excerpt |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&page=1&per_page=50&sort=title_asc" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "post-id",
      "title": "Coventry University Kazakhstan",
      "slug": "coventry-university-kazakhstan",
      "excerpt": "Leading international university in Kazakhstan...",
      "content": "Full content...",
      "status": "published",
      "publishedAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "author": {
        "id": "user-id",
        "name": "Admin User",
        "email": "admin@example.com",
        "avatarUrl": null
      },
      "postType": {
        "id": "post-type-id",
        "name": "Universities",
        "slug": "universities"
      },
      "featuredImage": {
        "id": "media-id",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "altText": "Coventry University",
        "caption": null
      },
      "taxonomies": {
        "location": [
          {
            "id": "term-id",
            "name": "Almaty",
            "slug": "almaty"
          }
        ]
      },
      "customFields": {
        "location": "Almaty",
        "established_year": 2020,
        "website": "https://coventry.kz",
        "contact_email": "info@coventry.kz",
        "background_image": {
          "id": "media-id",
          "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/background.jpg",
          "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/background.jpg?variant=thumbnail",
          "altText": "University background"
        },
        "logo": {
          "id": "media-id",
          "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/logo.png",
          "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/logo.png?variant=thumbnail",
          "altText": "University Logo"
        },
        "gallery": [
          {
            "id": "media-id-1",
            "url": "https://...",
            "thumbnailUrl": "https://...",
            "altText": "Campus photo"
          }
        ]
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

### Notes

- Custom fields are automatically filtered by post type
- Only fields attached to the "universities" post type are returned
- Fields are sorted by their `order` property from post type configuration

---

## 2. Get Single University

Get detailed information about a specific university by slug.

### Endpoint

```
GET /api/public/v1/study-in-kazakhstan/posts/{university-slug}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `university-slug` | string | Yes | University slug (e.g., `coventry-university-kazakhstan`) |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fields` | string | No | all | Comma-separated list of fields to return |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "id": "post-id",
    "title": "Coventry University Kazakhstan",
    "slug": "coventry-university-kazakhstan",
    "excerpt": "Leading international university...",
    "content": "Full content...",
    "status": "published",
    "publishedAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "author": {
      "id": "user-id",
      "name": "Admin User",
      "email": "admin@example.com",
      "avatarUrl": null
    },
    "postType": {
      "id": "post-type-id",
      "name": "Universities",
      "slug": "universities"
    },
    "featuredImage": {
      "id": "media-id",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "altText": "Coventry University",
      "caption": null
    },
    "taxonomies": {
      "location": [
        {
          "id": "term-id",
          "name": "Almaty",
          "slug": "almaty"
        }
      ]
    },
    "customFields": {
      "location": "Almaty",
      "established_year": 2020,
      "website": "https://coventry.kz",
      "contact_email": "info@coventry.kz",
      "phone": "+7 727 123 4567",
      "address": "123 University Street, Almaty"
    },
    "relatedPosts": [
      {
        "id": "program-id",
        "title": "Computer Science Program",
        "slug": "computer-science-program",
        "excerpt": "Bachelor's degree in Computer Science...",
        "publishedAt": "2024-01-20T10:00:00Z",
        "relationshipType": "university"
      }
    ]
  }
}
```

### Notes

- `viewCount` is automatically incremented when a post is fetched
- Includes `relatedPosts` array with programs related to this university
- Custom fields are filtered by post type

---

## 3. Get Programs of a University

Get all programs offered by a specific university.

### Endpoint

```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug={university-slug}&relationship_type=university
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `post_type` | string | Yes | - | Must be `"programs"` |
| `related_to_slug` | string | Yes | - | University slug (e.g., `coventry-university-kazakhstan`) |
| `relationship_type` | string | Yes | - | Must be `"university"` |
| `page` | number | No | 1 | Page number |
| `per_page` | number | No | 20 | Items per page (max: 100) |
| `sort` | string | No | `publishedAt_desc` | Sort order |
| `fields` | string | No | all | Fields to return |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "program-id",
      "title": "Bachelor of Computer Science",
      "slug": "bachelor-computer-science",
      "excerpt": "Comprehensive computer science program...",
      "content": "Full program description...",
      "status": "published",
      "publishedAt": "2024-01-20T10:00:00Z",
      "author": { ... },
      "postType": {
        "id": "program-type-id",
        "name": "Programs",
        "slug": "programs"
      },
      "featuredImage": { ... },
      "taxonomies": {
        "program-degree-level": [
          {
            "id": "term-id",
            "name": "Bachelor",
            "slug": "bachelor"
          }
        ],
        "program-disciplines": [
          {
            "id": "term-id",
            "name": "Computer Science",
            "slug": "computer-science"
          }
        ]
      },
      "customFields": {
        "tuition_fee": 5000,
        "duration": "4 years",
        "language": "English",
        "degree_type": "Bachelor",
        "application_deadline": "2024-08-01"
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 100,
    "total": 45,
    "totalPages": 1
  }
}
```

### Notes

- Returns only programs that have a relationship to the specified university
- Relationship type must be `"university"`
- Custom fields are filtered by the "programs" post type

---

## 4. Get All Disciplines

Get all available disciplines (taxonomy terms).

### Endpoint

```
GET /api/public/v1/study-in-kazakhstan/taxonomies/{taxonomy-slug}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taxonomy-slug` | string | Yes | Taxonomy slug (likely `"disciplines"` or `"program-disciplines"`) |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "taxonomy": {
      "id": "taxonomy-id",
      "name": "Disciplines",
      "slug": "disciplines",
      "isHierarchical": true
    },
    "terms": [
      {
        "id": "term-id",
        "name": "Engineering",
        "slug": "engineering",
        "description": "Engineering programs",
        "parentId": null,
        "children": [
          {
            "id": "child-id",
            "name": "Computer Engineering",
            "slug": "computer-engineering",
            "parentId": "term-id"
          },
          {
            "id": "child-id-2",
            "name": "Mechanical Engineering",
            "slug": "mechanical-engineering",
            "parentId": "term-id"
          }
        ]
      },
      {
        "id": "term-id-2",
        "name": "Business",
        "slug": "business",
        "description": "Business programs",
        "parentId": null,
        "children": []
      }
    ]
  }
}
```

### Notes

- If taxonomy is hierarchical, terms include `children` array
- Terms are organized in a tree structure
- Use the term `slug` to filter programs

---

## 5. Get Programs of a Discipline

Get all programs in a specific discipline.

### Endpoint (Option A - Recommended)

```
GET /api/public/v1/study-in-kazakhstan/taxonomies/{taxonomy-slug}/{term-slug}/posts?post_type=programs
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taxonomy-slug` | string | Yes | Taxonomy slug (e.g., `"disciplines"`) |
| `term-slug` | string | Yes | Term slug (e.g., `"engineering"`) |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `post_type` | string | Yes | - | Must be `"programs"` |
| `page` | number | No | 1 | Page number |
| `per_page` | number | No | 20 | Items per page (max: 100) |
| `sort` | string | No | `publishedAt_desc` | Sort order |
| `fields` | string | No | all | Fields to return |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines/engineering/posts?post_type=programs&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### Alternative Endpoint (Option B)

```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy=disciplines:engineering
```

### Example Response

Same structure as "Get Programs of a University" response, but filtered by discipline.

---

## Field Selection

Use the `fields` parameter to reduce payload size and improve performance.

### Supported Field Types

1. **Standard Fields:**
   - `id`, `title`, `slug`, `content`, `excerpt`, `status`
   - `publishedAt`, `createdAt`, `updatedAt`

2. **Nested Fields:**
   - `author.id`, `author.name`, `author.email`, `author.avatarUrl`
   - `postType.id`, `postType.name`, `postType.slug`

3. **Custom Fields:**
   - `customFields.{field-slug}` (e.g., `customFields.tuition_fee`)

4. **Special Fields:**
   - `taxonomies` - All taxonomy terms
   - `featuredImage` - Featured image with URLs
   - `relatedPosts` - Related posts (only in single post endpoint)

### Example

```bash
# Get only essential fields for a list view
GET /posts?post_type=universities&fields=id,title,slug,excerpt,featuredImage&per_page=50

# Get specific custom fields
GET /posts?post_type=programs&fields=id,title,slug,customFields.tuition_fee,customFields.duration
```

---

## Custom Fields Reference

Custom fields are automatically filtered by post type. Only fields attached to each post type are returned.

### Universities Custom Fields

Common custom fields for universities (exact fields depend on configuration):

**Text/Info Fields:**
- `location` - University location
- `established_year` - Year established
- `website` - University website URL
- `contact_email` - Contact email
- `phone` - Contact phone
- `address` - Physical address
- `description` - Extended description
- `accreditation` - Accreditation information
- `facilities` - Available facilities
- `student_count` - Number of students

**Media Fields (Images):**
- `background_image` - Background/hero image (returns media object with `url`, `thumbnailUrl`, `altText`)
- `logo` - University logo (returns media object with `url`, `thumbnailUrl`, `altText`)
- `gallery` - Image gallery (returns array of media objects)
- `campus_images` - Campus photos (returns array of media objects)

**Note:** Media-type custom fields return full media objects, not just IDs. Each media object includes:
- `id` - Media ID
- `url` - Full image URL
- `thumbnailUrl` - Thumbnail URL
- `altText` - Alt text for accessibility
- `caption` - Optional caption

### Programs Custom Fields

Common custom fields for programs (exact fields depend on configuration):

- `tuition_fee` - Tuition fee amount
- `duration` - Program duration
- `language` - Instruction language
- `degree_type` - Type of degree
- `application_deadline` - Application deadline
- Additional fields as configured

**Note:** To see exact custom fields for each post type, query the schema endpoint:

```
GET /api/admin/v1/organizations/{orgId}/schema/post-types/{postTypeId}
```

---

## Response Structure

### Standard Response Format

```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

---

## Complete Example: Coventry University

### Step 1: Get Coventry University

```bash
GET /api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan
```

### Step 2: Get All Programs for Coventry

```bash
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100
```

### Step 3: Get Programs by Discipline

```bash
# Get all engineering programs at Coventry
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=disciplines:engineering
```

---

## Advanced Search (Requires API Key)

For complex queries, use the search endpoint:

```bash
POST /api/public/v1/study-in-kazakhstan/search
Content-Type: application/json
Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7

{
  "entityType": "posts",
  "filterGroups": [{
    "filters": [{
      "property": "relationships.university.slug",
      "operator": "eq",
      "value": "coventry-university-kazakhstan"
    }, {
      "property": "taxonomies.disciplines",
      "operator": "eq",
      "value": "engineering"
    }, {
      "property": "customFields.tuition_fee",
      "operator": "lt",
      "value": 6000
    }],
    "operator": "AND"
  }],
  "limit": 100,
  "properties": ["id", "title", "slug", "excerpt", "customFields.tuition_fee"]
}
```

---

## Rate Limiting

- **Public Access:** 1,000 requests per hour per IP
- **API Key:** 10,000 requests per hour (configurable)

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Caching

All responses include cache headers:
- **Post Lists:** 5 minutes (`s-maxage=300`)
- **Single Posts:** 10 minutes (`s-maxage=600`)
- **Taxonomies:** 15 minutes (`s-maxage=900`)

---

## Next Steps

1. Query the schema endpoint to get exact post type slugs and custom fields
2. Test the endpoints with your API key
3. Implement field selection to optimize payload size
4. Use pagination for large datasets
5. Cache responses appropriately on your frontend

