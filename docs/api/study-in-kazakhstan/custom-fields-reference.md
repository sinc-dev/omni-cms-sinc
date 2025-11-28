# Custom Fields Reference for Study in Kazakhstan

## Overview

This document provides a complete reference for all custom fields available for universities and programs in the Study in Kazakhstan CMS.

## How to Check Available Custom Fields

To see the exact custom fields configured for your organization:

```typescript
// 1. Get organization ID
const orgs = await fetch(
  'https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations',
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
);
const orgId = orgs.data.find(o => o.slug === 'study-in-kazakhstan').id;

// 2. Get schema
const schema = await fetch(
  `https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/${orgId}/schema`,
  { headers: { 'Authorization': `Bearer ${API_KEY}` } }
);

// 3. Find universities post type
const universitiesType = schema.data.postTypes.find(
  pt => pt.slug === 'universities'
);

// 4. See all custom fields
console.log(universitiesType.availableFields);
```

---

## Universities Custom Fields

### Text/Info Fields

| Field Slug | Field Type | Description | Example Value |
|------------|------------|-------------|---------------|
| `location` | text | University location/city | "Almaty" |
| `established_year` | number | Year established | 2020 |
| `website` | url | University website URL | "https://coventry.kz" |
| `contact_email` | text | Contact email address | "info@coventry.kz" |
| `phone` | text | Contact phone number | "+7 727 123 4567" |
| `address` | textarea | Physical address | "123 University Street, Almaty" |
| `description` | rich_text | Extended description | HTML content |
| `accreditation` | textarea | Accreditation information | "Accredited by..." |
| `facilities` | textarea | Available facilities | "Library, Labs, Sports Center" |
| `student_count` | number | Number of students | 5000 |

### Media Fields (Images)

Media-type custom fields return full media objects with the following structure:

```json
{
  "id": "media-id",
  "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/image.jpg",
  "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/image.jpg?variant=thumbnail",
  "altText": "Image description",
  "caption": "Optional caption"
}
```

| Field Slug | Field Type | Description | Returns |
|------------|------------|-------------|---------|
| `background_image` | media | Background/hero image | Single media object |
| `logo` | media | University logo | Single media object |
| `gallery` | multi_select (media) or json | Image gallery | Array of media objects |
| `campus_images` | multi_select (media) or json | Campus photos | Array of media objects |

### Accessing Media Custom Fields

```typescript
const university = await fetch(`${API_BASE}/posts/coventry-university-kazakhstan`);
const data = await university.json();

// Single media field
const backgroundImage = data.data.customFields.background_image;
if (backgroundImage) {
  console.log(backgroundImage.url); // Full image URL
  console.log(backgroundImage.thumbnailUrl); // Thumbnail URL
  console.log(backgroundImage.altText); // Alt text
}

// Logo
const logo = data.data.customFields.logo;
if (logo) {
  console.log(logo.url);
}

// Gallery (array)
const gallery = data.data.customFields.gallery || [];
gallery.forEach((image, index) => {
  console.log(`Image ${index + 1}:`, image.url);
  console.log(`Alt: ${image.altText}`);
});
```

### Example Response with Media Fields

```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Coventry University Kazakhstan",
    "slug": "coventry-university-kazakhstan",
    "customFields": {
      "location": "Almaty",
      "website": "https://coventry.kz",
      "background_image": {
        "id": "media-id-1",
        "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/background.jpg",
        "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/background.jpg?variant=thumbnail",
        "altText": "Coventry University Kazakhstan Campus",
        "caption": null
      },
      "logo": {
        "id": "media-id-2",
        "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/logo.png",
        "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/logo.png?variant=thumbnail",
        "altText": "Coventry University Logo",
        "caption": null
      },
      "gallery": [
        {
          "id": "media-id-3",
          "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/gallery-1.jpg",
          "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/gallery-1.jpg?variant=thumbnail",
          "altText": "Campus Building",
          "caption": "Main campus building"
        },
        {
          "id": "media-id-4",
          "url": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/gallery-2.jpg",
          "thumbnailUrl": "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/gallery-2.jpg?variant=thumbnail",
          "altText": "Library",
          "caption": null
        }
      ]
    }
  }
}
```

---

## Programs Custom Fields

### Text/Info Fields

| Field Slug | Field Type | Description | Example Value |
|------------|------------|-------------|---------------|
| `tuition_fee` | number | Tuition fee amount | 5000 |
| `duration` | text | Program duration | "4 years" |
| `language` | text | Instruction language | "English" |
| `degree_type` | text | Type of degree | "Bachelor" |
| `application_deadline` | date | Application deadline | "2024-08-01" |
| `intake` | text | Intake period | "September" |
| `requirements` | rich_text | Admission requirements | HTML content |
| `curriculum` | rich_text | Course structure | HTML content |
| `career_prospects` | rich_text | Career opportunities | HTML content |

### Media Fields

| Field Slug | Field Type | Description | Returns |
|------------|------------|-------------|---------|
| `program_image` | media | Program-specific image | Single media object |
| `program_gallery` | multi_select (media) or json | Program gallery | Array of media objects |

---

## Field Types Reference

### Text Fields
- **text**: Single-line text
- **textarea**: Multi-line text
- **rich_text**: HTML content

### Numeric Fields
- **number**: Numeric value

### Date Fields
- **date**: Date value (YYYY-MM-DD)
- **datetime**: Date and time

### Media Fields
- **media**: Single media reference (returns full media object)
- **multi_select** (with media): Multiple media references (returns array of media objects)

### Other Fields
- **boolean**: True/false
- **select**: Single choice from options
- **multi_select**: Multiple choices
- **json**: Structured data
- **relation**: Reference to another post

---

## Using Custom Fields in Frontend

### University Profile Page Example

```typescript
const UniversityProfile = ({ university }) => {
  return (
    <div>
      {/* Hero with background image */}
      <div 
        className="hero"
        style={{
          backgroundImage: `url(${university.customFields.background_image?.url})`
        }}
      >
        {university.customFields.logo && (
          <img 
            src={university.customFields.logo.url}
            alt={university.customFields.logo.altText || 'University Logo'}
            className="logo"
          />
        )}
        <h1>{university.title}</h1>
        <p>{university.customFields.location}</p>
      </div>

      {/* Gallery */}
      {university.customFields.gallery && university.customFields.gallery.length > 0 && (
        <div className="gallery">
          <h2>Campus Gallery</h2>
          <div className="gallery-grid">
            {university.customFields.gallery.map((image, index) => (
              <img
                key={image.id || index}
                src={image.url}
                alt={image.altText || `Gallery image ${index + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      {/* University Info */}
      <div className="info">
        <p><strong>Established:</strong> {university.customFields.established_year}</p>
        <p><strong>Website:</strong> <a href={university.customFields.website}>{university.customFields.website}</a></p>
        <p><strong>Email:</strong> {university.customFields.contact_email}</p>
        <p><strong>Phone:</strong> {university.customFields.phone}</p>
        <p><strong>Address:</strong> {university.customFields.address}</p>
      </div>
    </div>
  );
};
```

---

## Querying with Field Selection

### Get All Custom Fields

```typescript
// Don't use fields parameter - gets everything
const university = await fetch(`${API_BASE}/posts/coventry-university-kazakhstan`);
```

### Get Specific Custom Fields

```typescript
// Get specific text fields
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan?fields=id,title,slug,customFields.location,customFields.website,customFields.established_year`
);

// Get media fields
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan?fields=id,title,slug,customFields.background_image,customFields.logo,customFields.gallery`
);

// Get all custom fields
const university = await fetch(
  `${API_BASE}/posts/coventry-university-kazakhstan?fields=id,title,slug,customFields`
);
```

---

## Notes

1. **Media Fields Return Full Objects**: Media-type custom fields return complete media objects with URLs, not just IDs
2. **Gallery Fields**: Can be either `multi_select` (media) or `json` (array of media IDs) - API returns as array of media objects
3. **Field Availability**: Not all fields may be populated for every university - always check for existence before accessing
4. **Field Ordering**: Custom fields are returned in the order specified in the post type configuration
5. **Null Values**: Fields without values are not included in the `customFields` object

---

## Verifying Fields in Your Setup

To see exactly what custom fields are configured for your universities:

1. Query the schema endpoint (see "How to Check Available Custom Fields" above)
2. Check the `availableFields` array for the universities post type
3. Each field includes:
   - `id` - Field ID
   - `name` - Display name
   - `slug` - Field slug (used in API)
   - `fieldType` - Type (text, number, media, etc.)
   - `isRequired` - Whether required
   - `defaultValue` - Default value
   - `order` - Display order

