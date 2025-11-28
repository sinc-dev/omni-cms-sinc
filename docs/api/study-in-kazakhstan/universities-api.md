# Universities API Reference

## Overview

Complete API reference for querying universities in the Study in Kazakhstan system.

## Base Endpoint

```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=universities
```

---

## 1. Get All Universities

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
| `sort` | string | No | `publishedAt_desc` | Sort order |
| `fields` | string | No | all | Fields to return |
| `search` | string | No | - | Search query |

### Sort Options

- `title_asc` - Alphabetical A-Z
- `title_desc` - Alphabetical Z-A
- `publishedAt_asc` - Oldest first
- `publishedAt_desc` - Newest first (default)
- `createdAt_asc` - Created oldest first
- `createdAt_desc` - Created newest first
- `updatedAt_asc` - Updated oldest first
- `updatedAt_desc` - Updated newest first

### Example Requests

**Basic:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&page=1&per_page=50" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**With Sorting:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&sort=title_asc&per_page=50" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**With Field Selection:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&fields=id,title,slug,excerpt,featuredImage,customFields.location,customFields.website&per_page=50" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**With Search:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&search=coventry&per_page=10" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

### Response Structure

```json
{
  "success": true,
  "data": [
    {
      "id": "post-id",
      "title": "University Name",
      "slug": "university-slug",
      "excerpt": "Short description",
      "content": "Full content",
      "status": "published",
      "publishedAt": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "author": {
        "id": "user-id",
        "name": "Author Name",
        "email": "author@example.com",
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
        "altText": "University image",
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
        "website": "https://university.kz",
        "contact_email": "info@university.kz",
        "phone": "+7 727 123 4567",
        "address": "123 University Street"
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

---

## 2. Get Single University

### Endpoint
```
GET /api/public/v1/study-in-kazakhstan/posts/{university-slug}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `university-slug` | string | Yes | University slug |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fields` | string | No | all | Fields to return |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

### Response Structure

Same as list response, but:
- Single object (not array)
- Includes `relatedPosts` array with programs
- `viewCount` is automatically incremented

```json
{
  "success": true,
  "data": {
    "id": "post-id",
    "title": "Coventry University Kazakhstan",
    "slug": "coventry-university-kazakhstan",
    // ... all fields ...
    "relatedPosts": [
      {
        "id": "program-id",
        "title": "Program Name",
        "slug": "program-slug",
        "excerpt": "Program description",
        "publishedAt": "2024-01-20T10:00:00Z",
        "relationshipType": "university"
      }
    ]
  }
}
```

---

## 3. Search Universities

### Endpoint
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=universities&search={query}
```

### Example

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&search=coventry" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

Searches in: title, content, excerpt

---

## Custom Fields Reference

### Common Custom Fields

The following custom fields are typically available for universities (verify via schema):

**Text/Info Fields:**
- `location` - University location/city
- `established_year` - Year established (number)
- `website` - University website URL
- `contact_email` - Contact email address
- `phone` - Contact phone number
- `address` - Physical address
- `description` - Extended description
- `accreditation` - Accreditation information
- `facilities` - Available facilities
- `student_count` - Number of students

**Media Fields (Images):**
- `background_image` - Background/hero image (media type)
- `logo` - University logo (media type)
- `gallery` - Image gallery (multi-select media or JSON array)
- `campus_images` - Campus photos (multi-select media or JSON array)
- Additional media fields as configured

**Note:** Media-type custom fields return media objects with URLs, not just IDs. See [Media Custom Fields](#media-custom-fields) below.

### Accessing Custom Fields

```typescript
const university = response.data;
console.log(university.customFields.location);
console.log(university.customFields.website);
console.log(university.customFields.established_year);

// Media custom fields return full media objects
if (university.customFields.background_image) {
  console.log(university.customFields.background_image.url);
  console.log(university.customFields.background_image.thumbnailUrl);
}

if (university.customFields.logo) {
  console.log(university.customFields.logo.url);
  console.log(university.customFields.logo.altText);
}
```

### Media Custom Fields

Media-type custom fields (like `background_image`, `logo`, `gallery`) return full media objects:

```json
{
  "customFields": {
    "background_image": {
      "id": "media-id",
      "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/image.jpg",
      "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/image.jpg?variant=thumbnail",
      "altText": "University background",
      "caption": null
    },
    "logo": {
      "id": "media-id",
      "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/logo.png",
      "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/logo.png?variant=thumbnail",
      "altText": "University Logo",
      "caption": null
    },
    "gallery": [
      {
        "id": "media-id-1",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "altText": "Campus photo 1"
      },
      {
        "id": "media-id-2",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "altText": "Campus photo 2"
      }
    ]
  }
}
```

### Field Selection

To get only specific custom fields:

```bash
# Text fields
?fields=id,title,slug,customFields.location,customFields.website,customFields.established_year

# Include media fields
?fields=id,title,slug,customFields.background_image,customFields.logo,customFields.gallery

# Get all custom fields (recommended)
?fields=id,title,slug,content,customFields
```

---

## Complete Example

```typescript
const API_BASE = 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan';
const API_KEY = 'omni_099c139e8f5dce0edfc59cc9926d0cd7';

// Get all universities
async function getAllUniversities() {
  const response = await fetch(
    `${API_BASE}/posts?post_type=universities&per_page=100&sort=title_asc`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data.data;
}

// Get single university (with all custom fields including media)
async function getUniversity(slug: string) {
  const response = await fetch(
    `${API_BASE}/posts/${slug}?fields=id,title,slug,content,excerpt,featuredImage,customFields`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data.data;
}

// Access media custom fields
const university = await getUniversity('coventry-university-kazakhstan');
const backgroundImage = university.customFields.background_image?.url;
const logo = university.customFields.logo?.url;
const gallery = university.customFields.gallery || [];

// Usage
const universities = await getAllUniversities();
const coventry = await getUniversity('coventry-university-kazakhstan');
```

---

## Notes

1. **Custom Fields:** Automatically filtered - only fields attached to "universities" post type
2. **Field Ordering:** Custom fields are sorted by their `order` property
3. **Pagination:** Use `per_page=100` for maximum efficiency
4. **Caching:** Responses are cached for 5 minutes
5. **View Count:** Automatically incremented when fetching single university

