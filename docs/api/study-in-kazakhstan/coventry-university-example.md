# Coventry University - Complete API Example

## Overview

This document provides complete examples for querying all data related to Coventry University Kazakhstan using the Study in Kazakhstan API.

## API Key
```
omni_099c139e8f5dce0edfc59cc9926d0cd7
```

## Base URL
```
https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan
```

---

## What You Can Get for Coventry University

### 1. University Information

Get complete details about Coventry University Kazakhstan.

**Endpoint:**
```
GET /posts/coventry-university-kazakhstan
```

**Response includes:**
- Basic information (title, slug, content, excerpt)
- Featured image
- All custom fields (location, website, contact info, etc.)
- Taxonomies (location, categories, etc.)
- Related posts (programs)

**Example:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

### 2. All Programs at Coventry University

Get all programs offered by Coventry University.

**Endpoint:**
```
GET /posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100
```

**Response includes:**
- All programs with full details
- Custom fields for each program (tuition, duration, language, etc.)
- Taxonomies (degree level, disciplines, etc.)

**Example:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**With Field Selection:**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&fields=id,title,slug,excerpt,customFields.tuition_fee,customFields.duration,customFields.language&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

### 3. Programs by Discipline at Coventry

Get programs filtered by discipline.

**Example: Engineering Programs**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=disciplines:engineering&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**Example: Business Programs**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=disciplines:business&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

### 4. Programs by Degree Level

Filter programs by degree level (Bachelor, Master, etc.).

**Example: Bachelor Programs**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=program-degree-level:bachelor&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

---

### 5. Programs by Multiple Filters

Combine multiple filters (discipline + degree level).

**Example: Bachelor Engineering Programs**
```bash
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=disciplines:engineering&taxonomy=program-degree-level:bachelor&per_page=100" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

**Note:** Multiple `taxonomy` parameters use AND logic (program must match all).

---

## Complete JavaScript/TypeScript Example

```typescript
const API_BASE = 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan';
const API_KEY = 'omni_099c139e8f5dce0edfc59cc9926d0cd7';
const COVENTRY_SLUG = 'coventry-university-kazakhstan';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// 1. Get Coventry University
async function getCoventryUniversity() {
  const response = await fetch(
    `${API_BASE}/posts/${COVENTRY_SLUG}?fields=id,title,slug,content,excerpt,featuredImage,customFields`,
    { headers }
  );
  const data = await response.json();
  return data.data;
}

// 2. Get All Programs
async function getCoventryPrograms() {
  const params = new URLSearchParams({
    post_type: 'programs',
    related_to_slug: COVENTRY_SLUG,
    relationship_type: 'university',
    per_page: '100',
    fields: 'id,title,slug,excerpt,customFields.tuition_fee,customFields.duration,customFields.language'
  });
  
  const response = await fetch(
    `${API_BASE}/posts?${params}`,
    { headers }
  );
  const data = await response.json();
  return data;
}

// 3. Get Programs by Discipline
async function getCoventryProgramsByDiscipline(disciplineSlug: string) {
  const params = new URLSearchParams({
    post_type: 'programs',
    related_to_slug: COVENTRY_SLUG,
    relationship_type: 'university',
    taxonomy: `disciplines:${disciplineSlug}`,
    per_page: '100'
  });
  
  const response = await fetch(
    `${API_BASE}/posts?${params}`,
    { headers }
  );
  const data = await response.json();
  return data;
}

// Usage
async function displayCoventryData() {
  // Get university
  const university = await getCoventryUniversity();
  console.log('University:', university.title);
  console.log('Location:', university.customFields.location);
  console.log('Website:', university.customFields.website);
  
  // Get all programs
  const allPrograms = await getCoventryPrograms();
  console.log(`Total programs: ${allPrograms.meta.total}`);
  
  // Get engineering programs
  const engineeringPrograms = await getCoventryProgramsByDiscipline('engineering');
  console.log(`Engineering programs: ${engineeringPrograms.meta.total}`);
  
  engineeringPrograms.data.forEach(program => {
    console.log(`- ${program.title}`);
    console.log(`  Tuition: $${program.customFields.tuition_fee}`);
    console.log(`  Duration: ${program.customFields.duration}`);
  });
}

displayCoventryData();
```

---

## Response Structure Examples

### University Response

```json
{
  "success": true,
  "data": {
    "id": "university-post-id",
    "title": "Coventry University Kazakhstan",
    "slug": "coventry-university-kazakhstan",
    "excerpt": "Leading international university...",
    "content": "Full university description...",
    "featuredImage": {
      "id": "media-id",
      "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/image.jpg",
      "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/image.jpg?variant=thumbnail",
      "altText": "Coventry University Kazakhstan",
      "caption": null
    },
    "customFields": {
      "location": "Almaty",
      "established_year": 2020,
      "website": "https://coventry.kz",
      "contact_email": "info@coventry.kz",
      "phone": "+7 727 123 4567",
      "address": "123 University Street, Almaty, Kazakhstan"
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
    "relatedPosts": [
      {
        "id": "program-id-1",
        "title": "Bachelor of Computer Science",
        "slug": "bachelor-computer-science",
        "excerpt": "Program description...",
        "publishedAt": "2024-01-20T10:00:00Z",
        "relationshipType": "university"
      }
    ]
  }
}
```

### Programs List Response

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

## Available Custom Fields

### Universities Custom Fields

The exact custom fields depend on configuration, but may include:

**Text/Info Fields:**
- `location` - City/location
- `established_year` - Year established
- `website` - Website URL
- `contact_email` - Contact email
- `phone` - Phone number
- `address` - Physical address
- `description` - Extended description
- `accreditation` - Accreditation information
- `facilities` - Available facilities
- `student_count` - Number of students

**Media Fields (Images):**
- `background_image` - Background/hero image (media object)
- `logo` - University logo (media object)
- `gallery` - Image gallery (array of media objects)
- `campus_images` - Campus photos (array of media objects)

**Note:** Media custom fields return full media objects with URLs, not just IDs.

### Programs Custom Fields

The exact custom fields depend on configuration, but may include:

- `tuition_fee` - Tuition fee (number)
- `duration` - Program duration (string)
- `language` - Instruction language
- `degree_type` - Type of degree
- `application_deadline` - Application deadline (date)
- `intake` - Intake period
- Additional fields as configured

**To see exact custom fields, query the schema endpoint:**
```
GET /api/admin/v1/organizations/{orgId}/schema/post-types/{postTypeId}
```

---

## Complete Workflow Example

```typescript
// Complete workflow for displaying Coventry University page

async function buildCoventryUniversityPage() {
  const universitySlug = 'coventry-university-kazakhstan';
  
  // 1. Get university details
  const universityResponse = await fetch(
    `${API_BASE}/posts/${universitySlug}?fields=id,title,slug,content,excerpt,featuredImage,customFields`,
    { headers }
  );
  const university = (await universityResponse.json()).data;
  
  // 2. Get all programs
  const programsResponse = await fetch(
    `${API_BASE}/posts?post_type=programs&related_to_slug=${universitySlug}&relationship_type=university&per_page=100&fields=id,title,slug,excerpt,customFields`,
    { headers }
  );
  const programsData = await programsResponse.json();
  const allPrograms = programsData.data;
  
  // 3. Get disciplines taxonomy
  const disciplinesResponse = await fetch(
    `${API_BASE}/taxonomies/disciplines`,
    { headers }
  );
  const disciplinesData = await disciplinesResponse.json();
  const disciplines = disciplinesData.data.terms;
  
  // 4. Group programs by discipline
  const programsByDiscipline = {};
  allPrograms.forEach(program => {
    const disciplineTerms = program.taxonomies?.['program-disciplines'] || program.taxonomies?.disciplines || [];
    disciplineTerms.forEach(term => {
      if (!programsByDiscipline[term.slug]) {
        programsByDiscipline[term.slug] = [];
      }
      programsByDiscipline[term.slug].push(program);
    });
  });
  
  return {
    university,
    allPrograms,
    disciplines,
    programsByDiscipline
  };
}

// Usage
const pageData = await buildCoventryUniversityPage();
console.log('University:', pageData.university.title);
console.log('Total Programs:', pageData.allPrograms.length);
console.log('Disciplines:', pageData.disciplines.map(d => d.name));

// Access media custom fields
const backgroundImage = pageData.university.customFields.background_image?.url;
const logo = pageData.university.customFields.logo?.url;
const gallery = pageData.university.customFields.gallery || [];
console.log('Background Image:', backgroundImage);
console.log('Logo:', logo);
console.log('Gallery Images:', gallery.length);
```

---

## Notes

1. **Custom Fields:** Automatically filtered by post type - only relevant fields returned
2. **Field Selection:** Use `fields` parameter to optimize payload
3. **Pagination:** Use `per_page=100` for maximum efficiency
4. **Relationships:** Programs are linked to universities via `post_relationships` table
5. **Taxonomies:** Programs can have multiple taxonomies (disciplines, degree levels, etc.)

