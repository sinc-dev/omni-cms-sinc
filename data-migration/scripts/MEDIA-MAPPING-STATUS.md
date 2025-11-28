# Media Mapping Status

## Current Situation

### Media Placeholders Are NOT Linked to Media Table

**Status**: The media placeholders (`wp-media-*`) in `post_field_values` are **NOT yet linked** to actual media records in the `media` table.

**Example**:
- `post_field_values.value` = `"wp-media-11928"` (placeholder)
- Media mapping exists: `11928` → `"DoBxmRfOXa7BIxo7FUW1b"` (in `import-mappings/media.json`)
- Media record exists: `media.id` = `"DoBxmRfOXa7BIxo7FUW1b"` with filename `"pexels-photo-9034980.webp"`
- **But**: `post_field_values.value` still contains `"wp-media-11928"` instead of `"DoBxmRfOXa7BIxo7FUW1b"`

### Will Media Show When Querying?

**No, not yet.** When you query for a logo/featured image:
- The `post_field_values.value` contains `"wp-media-11928"` (a string, not a media ID)
- There's no JOIN possible because `"wp-media-11928"` doesn't match any `media.id`
- The media won't show until placeholders are replaced with actual media IDs

### How It Should Work

The import process has a step called `updateMediaReferences` that should:
1. Load media mapping from `import-mappings/media.json`
2. Find all `post_field_values` with `wp-media-*` placeholders
3. Replace them with actual media IDs from the mapping

**Example transformation**:
- Before: `post_field_values.value` = `"wp-media-11928"`
- After: `post_field_values.value` = `"DoBxmRfOXa7BIxo7FUW1b"`
- Then: `JOIN media ON post_field_values.value = media.id` will work

## The 24 Remaining Widget Code Fields

### Details:
- **Total**: 24 fields
- **Location**: All from `study-in-north-cyprus / programs`
- **Affected Posts**: 6 posts (4 widget fields each)
- **Value**: `<p>&nbsp;</p>\n<div style="position: fixed;border: 3px solid #1976d2;z-index: 999999;border-radius: 4px"></div>\n`

### Affected Posts:
1. English Preparatory Program (Certificate Based) – English (4 fields)
2. Political Science and International Relations (Bachelor's of Art) – English (4 fields)
3. Computer Engineering (Bachelor's of Science) – English (4 fields)
4. International Trade and Business (Bachelor's of Art) – English (4 fields)
5. Software Engineering (Bachelor's of Science) – English (4 fields)
6. Business Administration (Bachelor's of Art) – English (4 fields)

### What It Is:
This is **junk HTML code** from a WordPress editor widget/plugin. It's not real content - just leftover editor artifacts. The `<div style="position: fixed...">` is a visual editor element that shouldn't be in the final content.

### Recommendation:
**Safe to delete** - These are clearly junk data with no value. They're just editor artifacts that got saved as custom field values.

## Next Steps

1. **Update Media References**: Run `updateMediaReferences` script to replace `wp-media-*` placeholders with actual media IDs
2. **Delete Widget Code**: Create SQL to delete the 24 widget code fields
3. **Verify**: After both steps, verify that media shows correctly when querying posts
