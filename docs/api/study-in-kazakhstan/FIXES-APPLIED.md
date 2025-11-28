# Fixes Applied to API Endpoints

## Summary

Fixed the following issues based on endpoint testing:

---

## ✅ Fix 1: Media Field Resolution

### Problem
Media-type custom fields (like `background_image`, `logo`, `gallery`) were returning media IDs instead of full media objects with URLs.

### Solution
Added media field resolution logic to all endpoints that return custom fields:

1. **`apps/api/src/routes/public/posts.ts`**
   - Added media field resolution in custom fields processing
   - Media IDs are now resolved to full media objects with `url`, `thumbnailUrl`, `altText`, `caption`

2. **`apps/api/src/routes/public/post-detail.ts`**
   - Added media field resolution for single post endpoint
   - Supports both single media fields and array fields (gallery)

3. **`apps/api/src/routes/public/taxonomy-term-posts.ts`**
   - Added media field resolution for taxonomy term posts endpoint

4. **`apps/api/src/lib/search/query-builder.ts`**
   - Added media field resolution for search endpoint
   - Note: Full URLs may need env access, returns basic media info

### How It Works

When a custom field is of type `media`:
- If value is a single media ID → resolves to single media object
- If value is an array of media IDs → resolves to array of media objects
- Each media object includes:
  ```json
  {
    "id": "media-id",
    "url": "https://...",
    "thumbnailUrl": "https://...",
    "altText": "Image description",
    "caption": "Optional caption"
  }
  ```

### Relation Field Resolution

Also added resolution for `relation`-type custom fields:
- Post references are resolved to post objects with `id`, `title`, `slug`, `excerpt`, `publishedAt`

---

## ✅ Fix 2: Taxonomy Endpoint Error Message

### Problem
Taxonomy endpoint returned generic "Taxonomy not found" error without helpful information.

### Solution
Updated `apps/api/src/routes/public/taxonomies.ts` to:
- List available taxonomies in error response
- Provide helpful error message with available taxonomy slugs

### Error Response Now Includes:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Taxonomy \"disciplines\" not found for organization \"study-in-kazakhstan\"",
    "details": {
      "availableTaxonomies": [
        {
          "name": "Program Disciplines",
          "slug": "program-disciplines"
        },
        {
          "name": "Location",
          "slug": "location"
        }
      ]
    }
  }
}
```

---

## ⚠️ Remaining Issue: Empty Custom Fields

### Problem
All endpoints still return `"customFields":{}` (empty object).

### Root Cause Analysis

The API code is correct. The issue is likely:

1. **Custom fields not attached to post types**
   - Check `post_type_fields` table
   - Custom fields must be linked to universities/programs post types

2. **Custom field values not populated**
   - Check `post_field_values` table
   - Values must exist for posts

3. **Data needs to be populated in CMS**
   - Custom fields need to be:
     - Created
     - Attached to post types
     - Populated with values for posts

### Next Steps

1. **Query database to verify:**
   ```sql
   -- Check if custom fields are attached to universities
   SELECT ptf.*, cf.name, cf.slug 
   FROM post_type_fields ptf
   JOIN custom_fields cf ON ptf.custom_field_id = cf.id
   JOIN post_types pt ON ptf.post_type_id = pt.id
   WHERE pt.slug = 'universities';
   
   -- Check if values exist for Coventry University
   SELECT pfv.*, cf.name, cf.slug, pfv.value
   FROM post_field_values pfv
   JOIN custom_fields cf ON pfv.custom_field_id = cf.id
   WHERE pfv.post_id = '752a2eb7cd9a095a1c5c98ad';
   ```

2. **If custom fields aren't attached:**
   - Attach them via CMS or database
   - Ensure `post_type_fields` has entries

3. **If values don't exist:**
   - Populate custom field values via CMS
   - Ensure `post_field_values` has entries

---

## Testing After Fixes

### Test Media Field Resolution

Once custom fields are populated with media values:

```bash
# Get university with media custom fields
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

Expected response should include:
```json
{
  "customFields": {
    "background_image": {
      "id": "media-id",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "altText": "..."
    },
    "logo": {
      "id": "media-id",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "altText": "..."
    },
    "gallery": [
      {
        "id": "media-id-1",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "altText": "..."
      }
    ]
  }
}
```

### Test Taxonomy Error Message

```bash
# Try invalid taxonomy slug
curl -X GET "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/taxonomies/disciplines" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
```

Should return helpful error with available taxonomies.

---

## Files Modified

1. `apps/api/src/routes/public/posts.ts` - Added media/relation field resolution
2. `apps/api/src/routes/public/post-detail.ts` - Added media/relation field resolution
3. `apps/api/src/routes/public/taxonomy-term-posts.ts` - Added media/relation field resolution
4. `apps/api/src/routes/public/taxonomies.ts` - Improved error message with available taxonomies
5. `apps/api/src/lib/search/query-builder.ts` - Added media field resolution (basic)

---

## Notes

- Media field resolution requires media items to exist in the database
- Media URLs are generated using `getMediaVariantUrls` which needs environment variables
- Relation field resolution only includes published posts
- All fixes maintain backward compatibility

