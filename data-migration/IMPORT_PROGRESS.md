# Import Scripts Progress

## ✅ Completed

1. **API Client** (`shared/utils/api-client.js`)
   - Base API request function
   - Functions for creating post types, taxonomies, terms, posts, relationships, media
   - Organization ID lookup

2. **Import Post Types** (`scripts/import-post-types.js`)
   - Creates post types for each organization
   - Handles existing post types (skips if already exists)
   - Saves mapping for later use

3. **Import Taxonomies** (`scripts/import-taxonomies.js`)
   - Creates standard taxonomies (categories, tags)
   - Creates custom taxonomies from fetched data
   - Saves mapping for later use

4. **Import Taxonomy Terms** (`scripts/import-taxonomy-terms.js`)
   - Imports categories and tags
   - Imports custom taxonomy terms
   - Preserves parent-child relationships
   - Saves mapping for later use

5. **Main Import Script** (`scripts/import-all.js`)
   - Orchestrates entire import process
   - Follows correct order
   - Provides progress tracking

## ⏳ Remaining Scripts

1. **Import Custom Fields** (`scripts/import-custom-fields.js`)
   - Analyze custom fields from transformed data
   - Create custom field definitions
   - Map WordPress field names to Omni-CMS field IDs

2. **Import Media** (`scripts/import-media.js`)
   - Download media files from WordPress
   - Upload to R2 via Omni-CMS API
   - Create WordPress → Omni-CMS media ID mapping

3. **Import Posts** (`scripts/import-posts.js`)
   - Load transformed posts
   - Map taxonomy IDs, author IDs, media IDs
   - Create posts with all relationships
   - Handle batching for large datasets

4. **Import Relationships** (`scripts/import-relationships.js`)
   - Load relationship data from transformed posts
   - Map university names to post IDs
   - Create post-to-post relationships

## Usage

```bash
# Set Omni-CMS base URL (defaults to http://localhost:8787)
export OMNI_CMS_BASE_URL=https://your-omni-cms-instance.com

# Run full import
npm run import
```

## Import Order

1. Post Types
2. Taxonomies
3. Taxonomy Terms (with parent relationships)
4. Custom Fields
5. Media Files
6. Posts
7. Relationships

## Mapping Files

All mappings are saved to `organizations/{org}/import-mappings/`:
- `post-types.json` - Post type slug → ID
- `taxonomies.json` - Taxonomy slug → ID
- `taxonomy-terms.json` - "taxonomy-slug-wp-id" → Omni-CMS term ID
- `custom-fields.json` - Custom field slug → ID (to be created)
- `media.json` - WordPress media ID → Omni-CMS media ID (to be created)
- `posts.json` - WordPress post ID → Omni-CMS post ID (to be created)

