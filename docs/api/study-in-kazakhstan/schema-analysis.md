# Schema Analysis for Study in Kazakhstan

## Overview

This document provides a complete analysis of the API schema structure for the Study in Kazakhstan organization, including post types, custom fields, taxonomies, and relationships.

## API Key
```
omni_099c139e8f5dce0edfc59cc9926d0cd7
```

## Base URL
```
https://omni-cms-api.joseph-9a2.workers.dev
```

---

## Getting Schema Information

### 1. Get Full Schema

**Endpoint:**
```
GET /api/admin/v1/organizations/{orgId}/schema
```

**Headers:**
```
Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "organizationId": "org-id",
    "postTypes": [
      {
        "id": "post-type-id",
        "name": "Universities",
        "slug": "universities",
        "description": "...",
        "isHierarchical": false,
        "availableFields": [
          {
            "id": "field-id",
            "name": "Location",
            "slug": "location",
            "fieldType": "text",
            "isRequired": false,
            "defaultValue": null,
            "order": 0
          }
        ]
      }
    ],
    "taxonomies": [
      {
        "id": "taxonomy-id",
        "name": "Disciplines",
        "slug": "disciplines",
        "isHierarchical": true,
        "terms": [...]
      }
    ],
    "standardProperties": {
      "posts": [...]
    },
    "enums": {...},
    "filterOperators": [...],
    "validationRules": {...},
    "metadata": {
      "relationshipTypes": ["university", ...],
      "fieldTypes": ["text", "number", ...],
      "colorMappings": {...}
    }
  }
}
```

### 2. Get Post Type Schema

**Endpoint:**
```
GET /api/admin/v1/organizations/{orgId}/schema/post-types/{postTypeId}
```

**Response includes:**
- Standard post properties
- Custom fields attached to this post type
- Field metadata (isRequired, defaultValue, order)
- Validation rules
- Enum values

---

## Post Types

### Universities Post Type

**Slug:** `universities` (or `university` - verify via schema)

**Standard Fields:**
- `id` - Unique identifier
- `title` - University name
- `slug` - URL-friendly identifier
- `content` - Full description
- `excerpt` - Short description
- `status` - Publication status
- `publishedAt` - Publication date
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `viewCount` - Number of views
- `shareCount` - Number of shares

**Custom Fields (from schema):**
- Fields attached via `post_type_fields` junction table
- Each field includes:
  - `id` - Field ID
  - `name` - Display name
  - `slug` - Field slug (used in `customFields.{slug}`)
  - `fieldType` - Type (text, number, select, etc.)
  - `isRequired` - Whether field is required
  - `defaultValue` - Default value
  - `order` - Display order

**Example Custom Fields:**
- `location` - University location
- `established_year` - Year established
- `website` - Website URL
- `contact_email` - Contact email
- `phone` - Phone number
- `address` - Physical address

### Programs Post Type

**Slug:** `programs` (or `program` - verify via schema)

**Standard Fields:**
- Same as universities (id, title, slug, content, etc.)

**Custom Fields (from schema):**
- Fields attached via `post_type_fields` junction table
- Sorted by `order` property

**Example Custom Fields:**
- `tuition_fee` - Tuition fee amount
- `duration` - Program duration
- `language` - Instruction language
- `degree_type` - Type of degree
- `application_deadline` - Application deadline
- `intake` - Intake period

---

## Taxonomies

### Disciplines Taxonomy

**Likely Slug:** `disciplines` or `program-disciplines`

**Structure:**
- Hierarchical (may have parent-child relationships)
- Terms represent different academic disciplines

**Example Terms:**
- Engineering
  - Computer Engineering
  - Mechanical Engineering
  - Electrical Engineering
- Business
  - Business Administration
  - Finance
  - Marketing

### Degree Level Taxonomy

**Likely Slug:** `program-degree-level` or `degree-level`

**Structure:**
- Non-hierarchical (flat list)
- Terms represent degree levels

**Example Terms:**
- Bachelor
- Master
- PhD
- Diploma

### Other Taxonomies

May include:
- `program-languages` - Instruction languages
- `location` - Geographic locations
- Additional taxonomies as configured

---

## Relationships

### University-Program Relationship

**Type:** `university`

**Structure:**
- Programs have a relationship to universities
- Relationship stored in `post_relationships` table
- `fromPostId` = Program ID
- `toPostId` = University ID
- `relationshipType` = `"university"`

**Querying:**
- Use `related_to_slug` parameter to filter programs by university
- Use `relationships.university.slug` in search endpoint

---

## Field Access Patterns

### Accessing Custom Fields

Custom fields are accessed via the `customFields` object:

```typescript
// University custom fields
university.customFields.location
university.customFields.website
university.customFields.established_year

// Program custom fields
program.customFields.tuition_fee
program.customFields.duration
program.customFields.language
```

### Field Selection

Use the `fields` parameter to select specific fields:

```bash
# Get only specific custom fields
?fields=id,title,slug,customFields.tuition_fee,customFields.duration

# Get all custom fields for a post type
?fields=id,title,slug,customFields
```

**Note:** Custom fields are automatically filtered by post type - only fields attached to that post type are returned.

---

## Querying Schema

### Step 1: Get Organization ID

```bash
GET /api/admin/v1/organizations
Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7
```

Find the organization with `slug: "study-in-kazakhstan"` to get the `orgId`.

### Step 2: Get Full Schema

```bash
GET /api/admin/v1/organizations/{orgId}/schema
Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7
```

This returns:
- All post types with their custom fields
- All taxonomies with terms
- Relationship types
- Field types
- Filter operators

### Step 3: Get Post Type Schemas

```bash
# Get universities schema
GET /api/admin/v1/organizations/{orgId}/schema/post-types/{universitiesPostTypeId}
Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7

# Get programs schema
GET /api/admin/v1/organizations/{orgId}/schema/post-types/{programsPostTypeId}
Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7
```

---

## Important Notes

1. **Custom Fields Filtering:**
   - Custom fields are filtered by post type
   - Only fields attached via `post_type_fields` junction table are returned
   - Fields are sorted by `order` property

2. **Field Metadata:**
   - Each custom field includes `isRequired`, `defaultValue`, and `order`
   - This metadata comes from the `post_type_fields` junction table

3. **Post Type Slugs:**
   - Verify exact slugs by querying the schema
   - Common values: `"universities"`, `"programs"`
   - May vary based on configuration

4. **Taxonomy Slugs:**
   - Verify exact slugs by querying the schema
   - Common values: `"disciplines"`, `"program-disciplines"`, `"program-degree-level"`
   - May vary based on configuration

5. **Relationship Types:**
   - University-program relationship type is likely `"university"`
   - Verify via schema `metadata.relationshipTypes`

---

## Next Steps

1. Query the schema endpoint to get exact post type IDs and slugs
2. Query post type schemas to get exact custom field slugs
3. Query taxonomies to get exact taxonomy and term slugs
4. Test queries with actual data
5. Document exact field names and types for your use case

