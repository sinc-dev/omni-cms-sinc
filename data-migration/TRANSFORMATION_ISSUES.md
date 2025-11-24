# Transformation Issues & Missing Items Checklist

## Critical Issues Found

### 1. ✅ Media ID Conversion Bug - FIXED

**Problem**: Non-media numeric strings were being converted to media placeholders

**Examples** (Before Fix):
- `duration_in_years: "4"` → `"wp-media-4"` ❌ (should be `4`)
- `associated_university_hubspot_id: "160570705111"` → `"wp-media-160570705111"` ❌ (should be `"160570705111"`)

**Fix Applied**: Only convert fields with media-related names (logo, image, photo, thumbnail, avatar, background, gallery, media, attachment, picture, banner)

**Result** (After Fix):
- `duration_in_years: 4` ✅ (number)
- `associated_university_hubspot_id: "160570705111"` ✅ (string)

### 2. ✅ Custom Taxonomies Not Captured - FIXED

**Problem**: WordPress has custom taxonomies that weren't being mapped:
- `program-degree-level` (e.g., [385])
- `program-languages` (e.g., [323])
- `program_durations` (e.g., [331])
- `location` (for universities)
- `dormitory-category`, `price-format`, `currency`, `room-type`, etc. (for dormitories)

**Fix Applied**: 
- Added `extractCustomTaxonomies()` function
- Added `customTaxonomyIds` field to transformed posts
- Scans posts to find all custom taxonomy usage

**Result**: Custom taxonomies now captured:
```json
{
  "customTaxonomyIds": {
    "program-degree-level": ["wp-taxonomy-program-degree-level-385"],
    "program-languages": ["wp-taxonomy-program-languages-323"],
    "program_durations": ["wp-taxonomy-program_durations-331"]
  }
}
```

**Remaining Issue**: Custom taxonomy terms (names, slugs) not fetched - only IDs captured

### 3. ⚠️ Taxonomy Mapping Uses Placeholders

**Problem**: Taxonomies are mapped to placeholders (`wp-category-123`) that need to be replaced with actual Omni-CMS taxonomy term IDs after import.

**Status**: This is expected, but we need to ensure the import script handles this properly.

### 4. ⚠️ Author Mapping Uses Placeholders

**Problem**: Authors are mapped to placeholders (`wp-author-123`) that need to be replaced with actual Omni-CMS user IDs.

**Status**: This is expected, but we need to ensure authors are created/mapped during import.

### 5. ⚠️ Slug Uniqueness

**Problem**: WordPress allows duplicate slugs across different post types, but Omni-CMS requires unique slugs per organization + post type.

**Example**: 
- `programs/law-112` and `universities/law-112` could both exist
- Omni-CMS constraint: `(organization_id, post_type_id, slug)` must be unique

**Status**: Should be fine since slugs are scoped by post type, but need to verify.

### 6. ⚠️ Content HTML Sanitization

**Problem**: WordPress content may contain:
- WordPress-specific shortcodes
- Plugin-specific HTML
- Inline styles
- Script tags (security risk)

**Status**: Need to verify if Omni-CMS sanitizes HTML or if we need to clean it.

### 7. ⚠️ Empty Content Handling

**Problem**: Some posts have empty content (e.g., programs, universities).

**Status**: This is fine - Omni-CMS allows empty content.

### 8. ⚠️ Featured Media = 0

**Problem**: Some posts have `featured_media: 0` which means no featured image.

**Status**: Handled correctly - returns `undefined`.

### 9. ⚠️ Date Handling Edge Cases

**Problem**: What if `date_gmt` is missing? What if date is invalid?

**Status**: Currently falls back to `date`, but should validate dates.

### 10. ⚠️ Custom Fields Type Detection

**Problem**: We're storing custom fields as-is without type detection:
- Numbers stored as strings: `"duration_in_years": "4"` vs `4`
- Large numbers (IDs) vs small numbers (counts/durations)

**Status**: Need to infer types for proper custom field creation.

## Missing Features

### 1. ❌ Custom Taxonomies Extraction

**Missing**: Extraction and mapping of custom taxonomies:
- `program-degree-level`
- `program-languages`  
- `program_durations`
- `location`
- `dormitory-category`
- `price-format`
- `currency`
- `room-type`
- `institution--residence-name`

**Impact**: These relationships will be lost.

### 2. ❌ Taxonomy Hierarchies

**Problem**: WordPress categories can be hierarchical (parent-child), but we're not preserving this structure.

**Status**: Need to check if Omni-CMS supports hierarchical taxonomies and preserve parent relationships.

### 3. ❌ Media Metadata Preservation

**Problem**: We're fetching media details but not storing:
- Alt text
- Caption
- Description
- File metadata (dimensions, file size)

**Status**: Media details are fetched but may not be preserved during upload.

### 4. ❌ Duplicate Detection

**Problem**: No mechanism to detect if a post already exists (by slug or WordPress ID).

**Status**: Import script should check for existing posts before creating.

### 5. ❌ Error Handling & Validation

**Problem**: No validation of:
- Required fields
- Field length limits
- Invalid characters in slugs
- Duplicate slugs within same post type

**Status**: Need validation before import.

### 6. ❌ Content URL Rewriting

**Problem**: WordPress content may contain:
- Absolute URLs to WordPress site
- Relative URLs that need to be updated
- Image URLs that need to be updated after media upload

**Status**: May need to rewrite URLs in content after import.

### 7. ❌ Large Dataset Handling

**Problem**: 
- Study In Kazakhstan has 5,102 programs
- Need to handle rate limiting
- Need to handle API timeouts
- Need progress tracking

**Status**: Import script needs batching and retry logic.

## Data Quality Issues

### 1. ⚠️ Inconsistent Data Formats

**Examples**:
- Some durations as strings: `"4"`, others as numbers: `4`
- Some prices as strings: `"3000.0"`, should probably be numbers
- Some fields empty strings vs null vs missing

**Status**: Need normalization.

### 2. ⚠️ Missing Required Fields

**Problem**: Some posts may be missing required fields for Omni-CMS.

**Status**: Need to check Omni-CMS requirements and add defaults.

### 3. ⚠️ Special Characters in Slugs

**Problem**: WordPress slugs may contain special characters that Omni-CMS doesn't allow.

**Status**: Need slug sanitization.

## Import Order Dependencies

### Critical Order:
1. ✅ Organizations (already exist)
2. ⏳ Users/Authors (must exist before posts)
3. ⏳ Post Types (must exist before posts)
4. ⏳ Custom Fields (must exist before posts)
5. ⏳ Taxonomies (must exist before posts)
6. ⏳ Taxonomy Terms (must exist before posts)
7. ⏳ Media Upload (should happen before posts for featured images)
8. ⏳ Posts (depends on all above)
9. ⏳ Post Custom Field Values (depends on posts and custom fields)
10. ⏳ Post Taxonomy Links (depends on posts and taxonomy terms)
11. ⏳ Post Relationships (depends on posts)

## Immediate Fixes Needed

### Priority 1 (Critical):
1. ❌ Fix media ID conversion bug (non-media fields being converted)
2. ❌ Extract and map custom taxonomies
3. ❌ Validate dates before conversion

### Priority 2 (Important):
4. ⚠️ Add content sanitization
5. ⚠️ Add slug validation/sanitization
6. ⚠️ Normalize custom field types
7. ⚠️ Preserve taxonomy hierarchies

### Priority 3 (Nice to Have):
8. ⚠️ URL rewriting in content
9. ⚠️ Duplicate detection
10. ⚠️ Better error handling

