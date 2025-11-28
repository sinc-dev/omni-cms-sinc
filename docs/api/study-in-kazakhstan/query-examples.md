# Complete Query Examples for Study in Kazakhstan

## API Key
```
omni_099c139e8f5dce0edfc59cc9926d0cd7
```

## Base URL
```
https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan
```

---

## 1. Get All Universities (Paginated)

### Request
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&page=1&per_page=50&sort=title_asc" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript
```typescript
const response = await fetch(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&page=1&per_page=50&sort=title_asc',
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
const universities = data.data;
const total = data.meta.total;
```

### Python
```python
import requests

url = "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts"
params = {
    "post_type": "universities",
    "page": 1,
    "per_page": 50,
    "sort": "title_asc"
}
headers = {
    "Authorization": "Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7",
    "Content-Type": "application/json"
}

response = requests.get(url, params=params, headers=headers)
data = response.json()
universities = data["data"]
total = data["meta"]["total"]
```

### With Field Selection
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities&fields=id,title,slug,excerpt,featuredImage,customFields.location,customFields.website&per_page=50" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

## 2. Get Coventry University by Slug

### Request
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript
```typescript
const response = await fetch(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan',
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
const university = data.data;

// Access custom fields
console.log(university.customFields.location);
console.log(university.customFields.website);
console.log(university.customFields.established_year);
```

### With Field Selection
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan?fields=id,title,slug,content,featuredImage,customFields" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

## 3. Get All Programs for Coventry University

### Request
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript
```typescript
const universitySlug = 'coventry-university-kazakhstan';

const response = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=${universitySlug}&relationship_type=university&per_page=100`,
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
const programs = data.data;
const total = data.meta.total;

// Access program custom fields
programs.forEach(program => {
  console.log(program.title);
  console.log(program.customFields.tuition_fee);
  console.log(program.customFields.duration);
});
```

### With Field Selection
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&fields=id,title,slug,excerpt,customFields.tuition_fee,customFields.duration,customFields.language&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

## 4. Get All Disciplines

### Request
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript
```typescript
const response = await fetch(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines',
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
const taxonomy = data.data.taxonomy;
const terms = data.data.terms;

// Terms may have children if hierarchical
terms.forEach(term => {
  console.log(term.name, term.slug);
  if (term.children) {
    term.children.forEach(child => {
      console.log('  -', child.name, child.slug);
    });
  }
});
```

**Note:** The taxonomy slug might be `"disciplines"`, `"program-disciplines"`, or another value. Query the schema to find the exact slug.

---

## 5. Get Programs by Discipline

### Option A: Using Taxonomy Term Posts Endpoint

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines/engineering/posts?post_type=programs&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### Option B: Using Posts List with Taxonomy Filter

```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy=disciplines:engineering&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript
```typescript
const disciplineSlug = 'engineering';

// Option A
const response = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines/${disciplineSlug}/posts?post_type=programs&per_page=100`,
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
const programs = data.data;
```

---

## 6. Combined Query: Programs at Coventry in Engineering Discipline

### Request
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=disciplines:engineering&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript
```typescript
const params = new URLSearchParams({
  post_type: 'programs',
  related_to_slug: 'coventry-university-kazakhstan',
  relationship_type: 'university',
  taxonomy: 'disciplines:engineering',
  per_page: '100'
});

const response = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?${params}`,
  {
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
const engineeringPrograms = data.data;
```

---

## 7. Advanced Search (Complex Filtering)

### Request
```bash
curl -X POST "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/search" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7" \
  -H "Content-Type: application/json" \
  -d '{
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
    "properties": ["id", "title", "slug", "excerpt", "customFields.tuition_fee", "customFields.duration"]
  }'
```

### JavaScript/TypeScript
```typescript
const response = await fetch(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/search',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entityType: 'posts',
      filterGroups: [{
        filters: [{
          property: 'relationships.university.slug',
          operator: 'eq',
          value: 'coventry-university-kazakhstan'
        }, {
          property: 'taxonomies.disciplines',
          operator: 'eq',
          value: 'engineering'
        }, {
          property: 'customFields.tuition_fee',
          operator: 'lt',
          value: 6000
        }],
        operator: 'AND'
      }],
      limit: 100,
      properties: ['id', 'title', 'slug', 'excerpt', 'customFields.tuition_fee', 'customFields.duration']
    })
  }
);

const data = await response.json();
const results = data.results;
const cursor = data.cursor; // For pagination
```

---

## Complete Example: Building a University Page

### Step 1: Get University Details
```typescript
async function getUniversity(slug: string) {
  const response = await fetch(
    `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/${slug}?fields=id,title,slug,content,excerpt,featuredImage,customFields`,
    {
      headers: {
        'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7'
      }
    }
  );
  return await response.json();
}
```

### Step 2: Get All Programs
```typescript
async function getUniversityPrograms(universitySlug: string) {
  const response = await fetch(
    `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=${universitySlug}&relationship_type=university&per_page=100&fields=id,title,slug,excerpt,customFields.tuition_fee,customFields.duration,customFields.language`,
    {
      headers: {
        'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7'
      }
    }
  );
  return await response.json();
}
```

### Step 3: Get Programs by Discipline
```typescript
async function getProgramsByDiscipline(universitySlug: string, disciplineSlug: string) {
  const params = new URLSearchParams({
    post_type: 'programs',
    related_to_slug: universitySlug,
    relationship_type: 'university',
    taxonomy: `disciplines:${disciplineSlug}`,
    per_page: '100'
  });
  
  const response = await fetch(
    `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?${params}`,
    {
      headers: {
        'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7'
      }
    }
  );
  return await response.json();
}
```

### Usage
```typescript
// Get Coventry University
const university = await getUniversity('coventry-university-kazakhstan');
console.log(university.data.title);
console.log(university.data.customFields);

// Get all programs
const allPrograms = await getUniversityPrograms('coventry-university-kazakhstan');
console.log(`Total programs: ${allPrograms.meta.total}`);

// Get engineering programs only
const engineeringPrograms = await getProgramsByDiscipline('coventry-university-kazakhstan', 'engineering');
console.log(`Engineering programs: ${engineeringPrograms.meta.total}`);
```

---

## Error Handling

```typescript
async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': 'Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## Pagination Helper

```typescript
async function getAllPages(endpoint: string, maxPages: number = 10) {
  const allItems = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= maxPages) {
    const response = await safeFetch(`${endpoint}&page=${page}&per_page=100`);
    allItems.push(...response.data);
    
    hasMore = page < response.meta.totalPages;
    page++;
  }
  
  return allItems;
}

// Usage
const allUniversities = await getAllPages(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=universities'
);
```

---

## Notes

1. **Custom Fields:** Always filtered by post type - only relevant fields are returned
2. **Field Selection:** Use `fields` parameter to reduce payload size
3. **Pagination:** Use `per_page=100` for maximum efficiency
4. **Caching:** Responses are cached, implement client-side caching too
5. **Rate Limits:** Monitor rate limit headers to avoid hitting limits

