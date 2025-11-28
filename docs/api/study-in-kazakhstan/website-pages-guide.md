# Study in Kazakhstan Website - Pages & Data Requirements

## Overview

This document outlines all the pages needed for the Study in Kazakhstan website and how to fetch data from the CMS API for each page.

## API Base URL

```
https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan
```

## API Key

```
omni_099c139e8f5dce0edfc59cc9926d0cd7
```

---

## Page Structure

### 1. Homepage
### 2. Universities List Page
### 3. University Profile Page (e.g., Coventry University)
### 4. Programs List Page
### 5. Program Profile Page
### 6. Disciplines/Categories Pages
### 7. Search Results Page

---

## 1. Homepage

### Data Needed

- Featured universities (carousel/banner)
- Featured programs
- Statistics (total universities, total programs)
- Recent news/updates (if applicable)

### API Calls

```typescript
// Get featured universities (use sort or filter by featured)
const featuredUniversities = await fetch(
  `${API_BASE}/posts?post_type=universities&per_page=6&sort=publishedAt_desc&fields=id,title,slug,excerpt,featuredImage`
);

// Get featured programs
const featuredPrograms = await fetch(
  `${API_BASE}/posts?post_type=programs&per_page=6&sort=publishedAt_desc&fields=id,title,slug,excerpt,featuredImage`
);

// Get total counts (from meta.total in responses)
const universitiesCount = await fetch(
  `${API_BASE}/posts?post_type=universities&per_page=1`
);
const programsCount = await fetch(
  `${API_BASE}/posts?post_type=programs&per_page=1`
);
```

---

## 2. Universities List Page

### URL Pattern
```
/universities
/universities?page=2
/universities?search=coventry
/universities?location=almaty
```

### Data Needed

- List of all universities (paginated)
- Each university card needs:
  - Title
  - Slug (for link)
  - Excerpt/description
  - Featured image
  - Location (custom field)
  - Website (custom field)
  - Maybe: established year, contact info

### API Call

```typescript
// Get all universities with essential fields
const universities = await fetch(
  `${API_BASE}/posts?post_type=universities&page=${page}&per_page=20&sort=title_asc&fields=id,title,slug,excerpt,featuredImage,customFields.location,customFields.website,customFields.established_year`
);

// Response structure:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Coventry University Kazakhstan",
      "slug": "coventry-university-kazakhstan",
      "excerpt": "Leading international university...",
      "featuredImage": {
        "url": "https://...",
        "thumbnailUrl": "https://..."
      },
      "customFields": {
        "location": "Almaty",
        "website": "https://coventry.kz",
        "established_year": 2020
      }
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

### With Search

```typescript
const searchResults = await fetch(
  `${API_BASE}/posts?post_type=universities&search=${searchQuery}&per_page=20`
);
```

### With Location Filter (via taxonomy)

```typescript
const filteredUniversities = await fetch(
  `${API_BASE}/posts?post_type=universities&taxonomy=location:almaty&per_page=20`
);
```

---

## 3. University Profile Page

### URL Pattern
```
/universities/coventry-university-kazakhstan
```

### Data Needed

**Essential Fields:**
- Full university information
- All standard fields (title, content, excerpt, etc.)
- All custom fields (location, website, contact info, etc.)
- Featured image
- Gallery images (if available)
- Taxonomies (location, categories)
- Related programs (all programs offered by this university)

**Custom Fields Typically Needed:**

**Text/Info Fields:**
- `location` - City/location
- `established_year` - Year established
- `website` - University website
- `contact_email` - Contact email
- `phone` - Phone number
- `address` - Physical address
- `description` - Extended description
- `accreditation` - Accreditation info
- `facilities` - Available facilities
- `student_count` - Number of students

**Media Fields (Images):**
- `background_image` - Background/hero image (media object with URL)
- `logo` - University logo (media object with URL)
- `gallery` - Image gallery (array of media objects)
- `campus_images` - Campus photos (array of media objects)
- Additional media fields as configured

**Note:** Media custom fields return full media objects with `url`, `thumbnailUrl`, `altText`, etc.

### API Call

```typescript
// Get single university with ALL fields
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan`
  // No fields parameter = get everything
);

// Response includes:
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Coventry University Kazakhstan",
    "slug": "coventry-university-kazakhstan",
    "content": "Full university description...",
    "excerpt": "Short description...",
    "featuredImage": { ... },
    "taxonomies": {
      "location": [
        { "id": "...", "name": "Almaty", "slug": "almaty" }
      ]
    },
    "customFields": {
      // ALL custom fields attached to universities post type
      "location": "Almaty",
      "established_year": 2020,
      "website": "https://coventry.kz",
      "contact_email": "info@coventry.kz",
      "phone": "+7 727 123 4567",
      "address": "123 University Street, Almaty",
      "background_image": {
        "id": "media-id",
        "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/background.jpg",
        "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/background.jpg?variant=thumbnail",
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
        }
      ],
      // ... all other custom fields
    },
    "relatedPosts": [
      // Programs related to this university
      {
        "id": "...",
        "title": "Bachelor of Computer Science",
        "slug": "bachelor-computer-science",
        "excerpt": "...",
        "relationshipType": "university"
      }
    ]
  }
}
```

### Get All Programs for University

```typescript
// Get all programs for this university (with full details)
const programs = await fetch(
  `${API_BASE}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100&fields=id,title,slug,excerpt,featuredImage,customFields.tuition_fee,customFields.duration,customFields.language`
);
```

### Page Structure

```typescript
// University Profile Page Component Structure
const UniversityProfile = async ({ slug }) => {
  // 1. Get university details
  const universityRes = await fetch(`${API_BASE}/posts/${slug}`);
  const university = universityRes.data;
  
  // 2. Get all programs
  const programsRes = await fetch(
    `${API_BASE}/posts?post_type=programs&related_to_slug=${slug}&relationship_type=university&per_page=100`
  );
  const programs = programsRes.data;
  
  // 3. Group programs by discipline (client-side or via taxonomy endpoint)
  const programsByDiscipline = groupByDiscipline(programs);
  
  return (
    <div>
      {/* Hero Section */}
      <Hero 
        title={university.title}
        image={university.customFields.background_image || university.featuredImage}
        logo={university.customFields.logo}
        location={university.customFields.location}
      />
      
      {/* Overview */}
      <Overview 
        content={university.content}
        establishedYear={university.customFields.established_year}
        website={university.customFields.website}
        contact={university.customFields.contact_email}
        phone={university.customFields.phone}
        address={university.customFields.address}
      />
      
      {/* Gallery Section */}
      {university.customFields.gallery && (
        <GallerySection images={university.customFields.gallery} />
      )}
      
      {/* Programs Section */}
      <ProgramsSection programs={programs} />
      
      {/* Contact/Apply Section */}
      <ContactSection 
        email={university.customFields.contact_email}
        phone={university.customFields.phone}
        address={university.customFields.address}
      />
    </div>
  );
};
```

---

## 4. Programs List Page

### URL Pattern
```
/programs
/programs?university=coventry-university-kazakhstan
/programs?discipline=engineering
/programs?degree=bachelor
/programs?university=coventry&discipline=engineering
```

### Data Needed

- List of programs (paginated)
- Filters:
  - By university
  - By discipline
  - By degree level
  - By location (via university)
- Each program card needs:
  - Title
  - Slug
  - Excerpt
  - Featured image
  - University name (from relationship)
  - Tuition fee
  - Duration
  - Language
  - Degree type

### API Calls

**All Programs:**
```typescript
const programs = await fetch(
  `${API_BASE}/posts?post_type=programs&per_page=20&sort=title_asc&fields=id,title,slug,excerpt,featuredImage,customFields.tuition_fee,customFields.duration,customFields.language`
);
```

**By University:**
```typescript
const programs = await fetch(
  `${API_BASE}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=20`
);
```

**By Discipline:**
```typescript
const programs = await fetch(
  `${API_BASE}/posts?post_type=programs&taxonomy=disciplines:engineering&per_page=20`
);
```

**By Degree Level:**
```typescript
const programs = await fetch(
  `${API_BASE}/posts?post_type=programs&taxonomy=program-degree-level:bachelor&per_page=20`
);
```

**Combined Filters:**
```typescript
const programs = await fetch(
  `${API_BASE}/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&taxonomy=disciplines:engineering&taxonomy=program-degree-level:bachelor&per_page=20`
);
```

---

## 5. Program Profile Page

### URL Pattern
```
/programs/bachelor-computer-science
```

### Data Needed

**Essential Fields:**
- Full program information
- All standard fields
- All custom fields
- Featured image
- Taxonomies (discipline, degree level, language)
- Related university (the university offering this program)
- Related programs (similar programs, same university, etc.)

**Custom Fields Typically Needed:**
- `tuition_fee` - Tuition fee amount
- `duration` - Program duration
- `language` - Instruction language
- `degree_type` - Type of degree
- `application_deadline` - Application deadline
- `intake` - Intake period
- `requirements` - Admission requirements
- `curriculum` - Course structure
- `career_prospects` - Career opportunities
- Additional fields as configured

### API Call

```typescript
// Get single program with ALL fields
const program = await fetch(
  `${API_BASE}/posts/bachelor-computer-science`
  // No fields parameter = get everything
);

// Response includes:
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Bachelor of Computer Science",
    "slug": "bachelor-computer-science",
    "content": "Full program description...",
    "excerpt": "Short description...",
    "featuredImage": { ... },
    "taxonomies": {
      "program-disciplines": [
        { "id": "...", "name": "Computer Science", "slug": "computer-science" }
      ],
      "program-degree-level": [
        { "id": "...", "name": "Bachelor", "slug": "bachelor" }
      ]
    },
    "customFields": {
      // ALL custom fields attached to programs post type
      "tuition_fee": 5000,
      "duration": "4 years",
      "language": "English",
      "degree_type": "Bachelor",
      "application_deadline": "2024-08-01",
      "intake": "September",
      // ... all other custom fields
    },
    "relatedPosts": [
      // Related university
      {
        "id": "...",
        "title": "Coventry University Kazakhstan",
        "slug": "coventry-university-kazakhstan",
        "relationshipType": "university"
      }
    ]
  }
}
```

### Get Related University

```typescript
// The relatedPosts array includes the university
// Or fetch it separately:
const university = await fetch(
  `${API_BASE}/posts/${program.relatedPosts.find(p => p.relationshipType === 'university').slug}`
);
```

### Page Structure

```typescript
const ProgramProfile = async ({ slug }) => {
  const programRes = await fetch(`${API_BASE}/posts/${slug}`);
  const program = programRes.data;
  
  // Get university from relatedPosts
  const universitySlug = program.relatedPosts
    .find(p => p.relationshipType === 'university')?.slug;
  const university = universitySlug 
    ? await fetch(`${API_BASE}/posts/${universitySlug}`).then(r => r.data)
    : null;
  
  return (
    <div>
      <Hero 
        title={program.title}
        image={program.featuredImage}
        university={university?.title}
      />
      
      <Overview content={program.content} />
      
      <ProgramDetails 
        tuition={program.customFields.tuition_fee}
        duration={program.customFields.duration}
        language={program.customFields.language}
        degreeType={program.customFields.degree_type}
        deadline={program.customFields.application_deadline}
        intake={program.customFields.intake}
      />
      
      <Curriculum curriculum={program.customFields.curriculum} />
      
      <Requirements requirements={program.customFields.requirements} />
      
      <CareerProspects prospects={program.customFields.career_prospects} />
      
      <UniversitySection university={university} />
      
      <ApplySection 
        university={university}
        program={program}
      />
    </div>
  );
};
```

---

## 6. Disciplines/Categories Pages

### URL Pattern
```
/disciplines
/disciplines/engineering
/disciplines/engineering/programs
```

### Data Needed

- List of all disciplines (taxonomy terms)
- Programs in each discipline
- Discipline description
- Related disciplines

### API Calls

**Get All Disciplines:**
```typescript
const disciplines = await fetch(
  `${API_BASE}/taxonomies/disciplines`
);

// Response:
{
  "success": true,
  "data": {
    "taxonomy": {
      "id": "...",
      "name": "Disciplines",
      "slug": "disciplines"
    },
    "terms": [
      {
        "id": "...",
        "name": "Engineering",
        "slug": "engineering",
        "description": "...",
        "children": [
          {
            "id": "...",
            "name": "Computer Engineering",
            "slug": "computer-engineering"
          }
        ]
      }
    ]
  }
}
```

**Get Programs by Discipline:**
```typescript
const programs = await fetch(
  `${API_BASE}/taxonomies/disciplines/engineering/posts?post_type=programs&per_page=20`
);
```

---

## 7. Search Results Page

### URL Pattern
```
/search?q=computer+science
/search?q=engineering&type=programs
```

### Data Needed

- Search results (universities and/or programs)
- Search query
- Filters (type, location, discipline, etc.)

### API Calls

**Simple Search:**
```typescript
const results = await fetch(
  `${API_BASE}/posts?search=computer+science&per_page=20`
);
```

**Advanced Search (requires API key):**
```typescript
const results = await fetch(
  `${API_BASE}/search`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      entityType: 'posts',
      filterGroups: [{
        filters: [{
          property: 'postTypeId',
          operator: 'eq',
          value: 'programs-post-type-id'
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
      limit: 100
    })
  }
);
```

---

## Verifying Available Fields

### Check Schema for Available Custom Fields

To see what custom fields are available for universities or programs:

```typescript
// 1. Get organization ID first
const orgs = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations`,
  {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  }
);
const orgId = orgs.data.find(o => o.slug === 'study-in-kazakhstan').id;

// 2. Get full schema
const schema = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/${orgId}/schema`,
  {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  }
);

// 3. Find universities post type
const universitiesType = schema.data.postTypes.find(
  pt => pt.slug === 'universities'
);

// 4. See available custom fields
console.log(universitiesType.availableFields);
// Returns array of custom fields with:
// - id, name, slug, fieldType
// - isRequired, defaultValue, order
```

### Test API Response

```typescript
// Test getting Coventry University with all fields
const test = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan`
);

console.log('Standard Fields:', Object.keys(test.data));
console.log('Custom Fields:', Object.keys(test.data.customFields || {}));
console.log('Taxonomies:', Object.keys(test.data.taxonomies || {}));
```

---

## Common Issues & Solutions

### Issue: Custom Fields Not Showing

**Possible Causes:**
1. Custom fields not attached to post type
2. Custom fields not populated for the post
3. Using `fields` parameter that excludes custom fields

**Solution:**
```typescript
// Don't use fields parameter to get all fields
const university = await fetch(`${API_BASE}/posts/coventry-university-kazakhstan`);

// Or explicitly request custom fields
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan?fields=id,title,slug,content,customFields`
);
```

### Issue: Not Enough Fields for Profile Page

**Solution:**
1. Check schema to see what fields are available
2. If fields are missing, they need to be:
   - Created in the CMS (custom fields)
   - Attached to the post type
   - Populated for the specific post

### Issue: Related Programs Not Showing

**Solution:**
- Programs must have a relationship to the university
- Relationship type must be `"university"`
- Use `related_to_slug` parameter correctly

---

## Best Practices

1. **Use Field Selection:** For list pages, only request needed fields to reduce payload
2. **Cache Responses:** API responses are cached, implement client-side caching too
3. **Handle Pagination:** Use `per_page=100` for maximum efficiency
4. **Error Handling:** Always check `success` field in responses
5. **Loading States:** Show loading states while fetching data
6. **Fallbacks:** Handle missing custom fields gracefully

---

## Complete Example: University Profile Page

```typescript
// app/universities/[slug]/page.tsx
import { notFound } from 'next/navigation';

const API_BASE = 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan';
const API_KEY = 'omni_099c139e8f5dce0edfc59cc9926d0cd7';

async function getUniversity(slug: string) {
  const res = await fetch(`${API_BASE}/posts/${slug}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    next: { revalidate: 600 } // Cache for 10 minutes
  });
  
  const data = await res.json();
  if (!data.success) {
    return null;
  }
  
  return data.data;
}

async function getUniversityPrograms(universitySlug: string) {
  const res = await fetch(
    `${API_BASE}/posts?post_type=programs&related_to_slug=${universitySlug}&relationship_type=university&per_page=100`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 600 }
    }
  );
  
  const data = await res.json();
  return data.success ? data.data : [];
}

export default async function UniversityPage({ params }: { params: { slug: string } }) {
  const university = await getUniversity(params.slug);
  
  if (!university) {
    notFound();
  }
  
  const programs = await getUniversityPrograms(params.slug);
  
  return (
    <div>
      <h1>{university.title}</h1>
      <p>{university.content}</p>
      
      {/* Display all custom fields */}
      <div>
        <h2>University Details</h2>
        {university.customFields.location && (
          <p>Location: {university.customFields.location}</p>
        )}
        {university.customFields.website && (
          <p>Website: <a href={university.customFields.website}>{university.customFields.website}</a></p>
        )}
        {university.customFields.contact_email && (
          <p>Email: {university.customFields.contact_email}</p>
        )}
        {university.customFields.phone && (
          <p>Phone: {university.customFields.phone}</p>
        )}
        {/* Add all other custom fields */}
      </div>
      
      <div>
        <h2>Programs ({programs.length})</h2>
        {programs.map(program => (
          <div key={program.id}>
            <h3>{program.title}</h3>
            <p>{program.excerpt}</p>
            {program.customFields.tuition_fee && (
              <p>Tuition: ${program.customFields.tuition_fee}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

