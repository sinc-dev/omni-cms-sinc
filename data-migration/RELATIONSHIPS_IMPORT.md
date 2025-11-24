# Post Relationships Import Strategy

## Current State

### Relationships in WordPress Data

**Programs → Universities:**
- Programs have `associated_university_name` and `associated_university_hubspot_id` in custom fields
- Example: `"associated_university_name": "Kainar Academy"`
- **Issue**: We're storing this as a string, not as a relationship

**Universities → Reviews:**
- ✅ **Verified**: Reviews do NOT have explicit university relationship fields in meta
- Reviews mention universities in content but no structured relationship field
- Study in Kazakhstan: Will create reviews post type but import 0 records (as requested)
- Study in North Cyprus: Reviews exist but no university relationship field found

**Other Post Types Checked:**
- ✅ **Video Testimonials**: No relationship fields found
- ✅ **Team Members**: No relationship fields found  
- ✅ **Academic Staff** (Paris American): No relationship fields found
- ✅ **Instructors** (Paris American): No relationship fields found
- ✅ **Dormitories**: Has taxonomy relationships (categories, location, etc.) but no post-to-post relationships

**Taxonomy Relationships (Already Handled):**
- Programs → Categories (via taxonomies - already handled)
- Programs → Tags (via taxonomies - already handled)
- Programs → Degree Levels, Languages, Durations (via custom taxonomies - already handled)
- Dormitories → Categories, Locations, Room Types (via taxonomies - already handled)

## How Omni-CMS Stores Relationships

Omni-CMS uses the `post_relationships` table:

```sql
post_relationships:
  - id (UUID)
  - from_post_id (FK → posts.id)
  - to_post_id (FK → posts.id)
  - relationship_type (text: "related", "reference", "prerequisite", or custom)
  - created_at (timestamp)
```

The API expects relationships when creating posts:
```json
{
  "relationships": {
    "university": ["university-post-uuid-1", "university-post-uuid-2"],
    "related": ["related-post-uuid"]
  }
}
```

Or via the relationships endpoint:
```
POST /api/admin/organizations/:orgId/posts/:postId/relationships
{
  "toPostId": "university-post-uuid",
  "relationshipType": "university"
}
```

## Required Relationships

### Study In Kazakhstan

1. **Programs → Universities** (Many-to-One)
   - Relationship Type: `"university"`
   - Source: `associated_university_name` field
   - Need to: Match university name to university post ID

2. **Reviews** (Post Type Only)
   - Create reviews post type
   - Import 0 records (as requested)

### Study in North Cyprus

1. **Programs → Universities** (Many-to-One)
   - Same as Study In Kazakhstan
   - ✅ Relationship captured in transformation

2. **Universities → Reviews** (One-to-Many)
   - ✅ **Verified**: Reviews do NOT have explicit university relationship fields
   - Reviews mention universities in content but no structured relationship
   - **Decision**: No relationships will be created for reviews (content-only references)

### Paris American International University

1. **Programs → Universities** (if applicable)
   - ✅ **Verified**: No `associated_university_name` field found in programs
   - Programs may not have explicit university relationships
   - **Decision**: Check if programs need university relationships (may not be applicable)

2. **Academic Staff → Programs** (if applicable)
   - ✅ **Verified**: No relationship fields found in academic-staff meta
   - **Decision**: No relationships needed

3. **Instructors → Programs** (if applicable)
   - ✅ **Verified**: No relationship fields found in instructors meta
   - **Decision**: No relationships needed

## Implementation Plan

### Step 1: Extract Relationship Data

Update transformer to extract relationship information:

```javascript
{
  "relationships": {
    "university": {
      "type": "university",
      "wordpressName": "Kainar Academy",
      "wordpressId": null, // Need to find from universities
      "wordpressSlug": null // Need to find from universities
    }
  },
  "metadata": {
    "wordpressId": 57436,
    "relationships": {
      "university": {
        "name": "Kainar Academy",
        "hubspotId": "160570705111"
      }
    }
  }
}
```

### Step 2: Create University Name → Post ID Mapping

After importing universities:
1. Create mapping: `{ "Kainar Academy": "university-post-uuid" }`
2. Use this to resolve program → university relationships

### Step 3: Import Relationships

After importing all posts:
1. For each program:
   - Look up university name in mapping
   - Create relationship: `program-post-id → university-post-id` with type `"university"`
2. For each review (if applicable):
   - Look up university reference
   - Create relationship: `university-post-id → review-post-id` with type `"review"`

### Step 4: Handle Missing Relationships

- If university name doesn't match: Log warning, skip relationship
- If university not imported: Log warning, skip relationship
- Create a report of unmatched relationships

## Relationship Types

Define standard relationship types:
- `"university"` - Program belongs to University
- `"review"` - Review belongs to University
- `"related"` - General related content
- `"program"` - University offers Program (reverse)

## Current Status

### ✅ Completed

1. ✅ **Relationships captured in transformation**
   - Programs now have `relationships.university` with university name
   - Example:
     ```json
     {
       "relationships": {
         "university": {
           "type": "university",
           "wordpressName": "Kainar Academy",
           "wordpressHubspotId": "160570705111"
         }
       }
     }
     ```

### ⏳ Remaining Tasks

1. ⏳ **Create university name → post ID mapping**
   - After importing universities, create mapping: `{ "Kainar Academy": "university-post-uuid" }`
   - Use university `title` field to match names
   - Handle name variations/normalization

2. ⏳ **Create relationship import script**
   - Script to:
     - Load university name → post ID mapping
     - For each program with `relationships.university`:
       - Look up university by name
       - Create relationship via API: `POST /posts/:programId/relationships`
     - Handle unmatched names (log warnings)

3. ⏳ **Handle Reviews**
   - Study in Kazakhstan: Create reviews post type, import 0 records
   - Study in North Cyprus: Check if reviews have university relationships
   - Import reviews with relationships if applicable

## Next Steps

1. ✅ Update transformer to extract relationship data - **DONE**
2. ⏳ Create university name → post ID mapping after import
3. ⏳ Create relationship import script
4. ⏳ Test with sample data
5. ⏳ Import all relationships

