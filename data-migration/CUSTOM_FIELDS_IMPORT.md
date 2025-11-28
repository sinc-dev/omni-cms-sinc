# Custom Fields Import Strategy

## Current State

Custom fields are extracted from WordPress `meta` fields and stored in the transformed data as:

```json
{
  "customFields": {
    "university_name": "De Monfort University Leicester",
    "address": "Almaty",
    "logo": "wp-media-44311",
    "photos": ["wp-media-56117", "wp-media-56116", ...]
  }
}
```

## How Omni-CMS Stores Custom Fields

Omni-CMS uses a three-table structure:

1. **`custom_fields`** - Field definitions (name, slug, type, settings)
2. **`post_type_fields`** - Links fields to post types
3. **`post_field_values`** - Actual values (keyed by custom field ID, not slug)

The API expects:
```json
{
  "customFields": {
    "custom-field-uuid-1": "value",
    "custom-field-uuid-2": ["array", "of", "values"]
  }
}
```

Where keys are **custom field IDs (UUIDs)**, not slugs.

## Import Process

### Step 1: Analyze Custom Fields

For each post type, analyze all custom fields to determine:
- Field names and slugs
- Field types (text, number, media, array, etc.)
- Which fields are used by which post types

### Step 2: Create Custom Field Definitions

For each unique custom field slug:
1. Create a `custom_field` record with:
   - `name`: Human-readable name (from slug)
   - `slug`: WordPress field slug
   - `field_type`: Inferred from value type
   - `settings`: Additional configuration

### Step 3: Link Fields to Post Types ✅ IMPLEMENTED

**Script:** `scripts/attach-custom-fields-to-post-types.js`

For each post type:
1. Analyze which custom fields are used by examining transformed data
2. Link custom fields via `post_type_fields` using API endpoint
3. Attach fields in alphabetical order
4. Skip fields that are already attached (idempotent)

**API Endpoint:**
```
POST /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields
```

**Body:**
```json
{
  "custom_field_id": "field-uuid",
  "is_required": false,
  "order": 1
}
```

### Step 4: Transform Custom Fields for Import

When importing posts:
1. Map WordPress field slugs to Omni-CMS custom field IDs
2. Transform `customFields` object keys from slugs to IDs
3. Ensure media IDs are mapped (placeholders → actual Omni-CMS media IDs)

## Field Type Detection

Based on WordPress values:

- **text**: String value
- **textarea**: Long string (e.g., `entry_requirements`)
- **number**: Numeric value (e.g., `duration_in_years`)
- **media**: Single media ID (e.g., `logo`, `university_background_image`)
- **multi_media**: Array of media IDs (e.g., `photos`)
- **select**: Single choice from limited options
- **json**: Complex nested objects

## Media Field Handling

Media fields are stored as placeholders initially:
- `"logo": "wp-media-44311"` → Will be mapped to actual Omni-CMS media ID after upload

After media upload:
1. Media mapping file created: `{ 44311: "omni-media-uuid" }`
2. Custom fields updated: `"logo": "omni-media-uuid"`

## Example: University Custom Fields

**WordPress meta:**
```json
{
  "university_name": "De Monfort University Leicester",
  "address": "Almaty",
  "logo": "44311",
  "photos": ["56117", "56116", ...]
}
```

**Transformed (with placeholders):**
```json
{
  "customFields": {
    "university_name": "De Monfort University Leicester",
    "address": "Almaty",
    "logo": "wp-media-44311",
    "photos": ["wp-media-56117", "wp-media-56116", ...]
  }
}
```

**After custom field creation and media upload:**
```json
{
  "customFields": {
    "custom-field-uuid-university-name": "De Monfort University Leicester",
    "custom-field-uuid-address": "Almaty",
    "custom-field-uuid-logo": "omni-media-uuid-44311",
    "custom-field-uuid-photos": ["omni-media-uuid-56117", "omni-media-uuid-56116", ...]
  }
}
```

## Implementation Status

1. ✅ Custom fields extracted and stored with WordPress slugs
2. ✅ Create script to analyze custom fields across all post types
3. ✅ Create custom field definitions in Omni-CMS (`import-custom-fields.js`)
4. ✅ Link fields to post types (`attach-custom-fields-to-post-types.js`)
5. ✅ Update import script to map slugs → IDs (`import-posts.js`)
6. ✅ Update media references in custom fields after media upload (`update-media-references.js`)

## Next Steps (All Complete!)

All steps have been implemented. The import process now:
- Creates custom field definitions
- Attaches them to post types automatically
- Maps field slugs to IDs when importing posts
- Updates media references after upload

See `IMPLEMENTATION_STATUS.md` for detailed status.

