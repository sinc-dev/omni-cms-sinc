# Programs API Reference

## Overview

Complete API reference for querying programs in the Study in Kazakhstan system.

## Base Endpoint

```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs
```

---

## 1. Get All Programs

### Endpoint
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&page=1&per_page=20
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `post_type` | string | Yes | - | Must be `"programs"` |
| `page` | number | No | 1 | Page number |
| `per_page` | number | No | 20 | Items per page (max: 100) |
| `sort` | string | No | `publishedAt_desc` | Sort order |
| `fields` | string | No | all | Fields to return |
| `search` | string | No | - | Search query |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&per_page=100&sort=title_asc" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

## 2. Get Programs by University

### Endpoint
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug={university-slug}&relationship_type=university
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post_type` | string | Yes | Must be `"programs"` |
| `related_to_slug` | string | Yes | University slug |
| `relationship_type` | string | Yes | Must be `"university"` |
| `page` | number | No | Page number |
| `per_page` | number | No | Items per page |
| `sort` | string | No | Sort order |
| `fields` | string | No | Fields to return |

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
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
      "excerpt": "Program description...",
      "content": "Full program content...",
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
        "application_deadline": "2024-08-01",
        "intake": "September"
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

---

## 3. Get Programs by Discipline

### Endpoint (Option A)
```
GET /api/public/v1/study-in-kazakhstan/taxonomies/{taxonomy-slug}/{term-slug}/posts?post_type=programs
```

### Endpoint (Option B)
```
GET /api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy={taxonomy-slug}:{term-slug}
```

### Example Request

```bash
# Option A
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines/engineering/posts?post_type=programs&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"

# Option B
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy=disciplines:engineering&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

## 4. Get Programs by Multiple Filters

### Combined Filters

You can combine multiple filters:

**University + Discipline:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=disciplines:engineering&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**Multiple Taxonomies (AND logic):**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy=disciplines:engineering&taxonomy=program-degree-level:bachelor&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

## 5. Get Single Program

### Endpoint
```
GET /api/public/v1/study-in-kazakhstan/posts/{program-slug}
```

### Example Request

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/bachelor-computer-science" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

### Response

Includes full program details, custom fields, taxonomies, and related posts.

---

## Custom Fields Reference

### Common Custom Fields

The following custom fields are typically available for programs (verify via schema):

- `tuition_fee` - Tuition fee amount (number)
- `duration` - Program duration (string, e.g., "4 years")
- `language` - Instruction language (string)
- `degree_type` - Type of degree (string)
- `application_deadline` - Application deadline (date string)
- `intake` - Intake period (string, e.g., "September")
- Additional fields as configured

### Accessing Custom Fields

```typescript
const program = response.data;
console.log(program.customFields.tuition_fee);
console.log(program.customFields.duration);
console.log(program.customFields.language);
```

### Field Selection

```bash
?fields=id,title,slug,excerpt,customFields.tuition_fee,customFields.duration,customFields.language
```

---

## Taxonomies

### Program Taxonomies

Programs typically have these taxonomies:

1. **Disciplines** (`disciplines` or `program-disciplines`)
   - Engineering
   - Business
   - Computer Science
   - etc.

2. **Degree Level** (`program-degree-level`)
   - Bachelor
   - Master
   - PhD
   - Diploma

3. **Languages** (`program-languages`)
   - English
   - Kazakh
   - Russian

### Accessing Taxonomies

```typescript
const program = response.data;

// Get disciplines
const disciplines = program.taxonomies['program-disciplines'] || program.taxonomies.disciplines || [];
disciplines.forEach(term => {
  console.log(term.name, term.slug);
});

// Get degree level
const degreeLevel = program.taxonomies['program-degree-level'] || [];
```

---

## Complete Examples

### Get All Programs for Coventry University

```typescript
const API_BASE = 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan';
const API_KEY = 'omni_099c139e8f5dce0edfc59cc9926d0cd7';

async function getCoventryPrograms() {
  const params = new URLSearchParams({
    post_type: 'programs',
    related_to_slug: 'coventry-university-kazakhstan',
    relationship_type: 'university',
    per_page: '100',
    fields: 'id,title,slug,excerpt,customFields.tuition_fee,customFields.duration'
  });
  
  const response = await fetch(
    `${API_BASE}/posts?${params}`,
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
```

### Get Engineering Programs at Coventry

```typescript
async function getCoventryEngineeringPrograms() {
  const params = new URLSearchParams({
    post_type: 'programs',
    related_to_slug: 'coventry-university-kazakhstan',
    relationship_type: 'university',
    taxonomy: 'disciplines:engineering',
    per_page: '100'
  });
  
  const response = await fetch(
    `${API_BASE}/posts?${params}`,
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
```

### Get Bachelor Programs

```typescript
async function getBachelorPrograms() {
  const params = new URLSearchParams({
    post_type: 'programs',
    taxonomy: 'program-degree-level:bachelor',
    per_page: '100'
  });
  
  const response = await fetch(
    `${API_BASE}/posts?${params}`,
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
```

---

## Notes

1. **Custom Fields:** Automatically filtered by post type
2. **Relationships:** Programs linked to universities via `post_relationships` table
3. **Taxonomies:** Programs can have multiple taxonomy terms
4. **Field Selection:** Use `fields` parameter to optimize payload
5. **Pagination:** Use `per_page=100` for maximum efficiency

