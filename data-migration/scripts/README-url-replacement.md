# WordPress URL Replacement Guide

This guide explains how to replace WordPress media URLs in blog post content with Workers route URLs.

## Overview

WordPress URLs like `https://studyinnc.com/wp-content/uploads/image.jpg` need to be replaced with Workers route URLs like `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/{fileKey}`.

## Files

1. **`fix-inline-media-urls-simple.sql`** - SQL queries to identify posts with WordPress URLs
2. **`fix-inline-media-urls.js`** - Script to generate UPDATE statements (requires database access)
3. **`fix-inline-media-urls.sql`** - Generated SQL UPDATE statements (output file)

## Process

### Step 1: Identify Posts with WordPress URLs

Run the queries in `fix-inline-media-urls-simple.sql` to see which posts contain WordPress URLs:

```bash
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/fix-inline-media-urls-simple.sql
```

This will show you:
- Post IDs and titles
- Number of WordPress URLs in each post
- Content previews

### Step 2: Generate UPDATE Statements

**Option A: Use the Script (Recommended)**

If you have database access via wrangler:

```bash
cd data-migration/scripts
node fix-inline-media-urls.js
```

This will:
1. Query posts with WordPress URLs
2. Match WordPress filenames to media records
3. Generate SQL UPDATE statements
4. Output to `fix-inline-media-urls.sql`

**Option B: Manual Process**

1. Extract WordPress URLs from post content
2. Match filenames to media records:
   ```sql
   SELECT id, file_key, filename
   FROM media
   WHERE organization_id = 'ORG_ID'
     AND filename LIKE '%FILENAME%';
   ```
3. Generate UPDATE statements manually:
   ```sql
   UPDATE posts 
   SET content = REPLACE(
     content,
     'https://studyinnc.com/wp-content/uploads/old-filename.jpg',
     'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/NEW_FILE_KEY'
   )
   WHERE id = 'POST_ID';
   ```

### Step 3: Review and Execute

1. Review the generated `fix-inline-media-urls.sql` file
2. **Backup your database first!**
3. Execute the SQL:
   ```bash
   npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/fix-inline-media-urls.sql
   ```

### Step 4: Verify

Run the verification queries in `fix-inline-media-urls-simple.sql` to ensure all WordPress URLs have been replaced.

## Troubleshooting

### Script Can't Query Database

If `fix-inline-media-urls.js` can't query the database:
- Ensure wrangler is configured correctly
- Check that you have access to the remote database
- Use the manual process (Option B) instead

### URLs Not Matching

If WordPress URLs don't match media records:
- Check filename variations (case sensitivity, extensions)
- WordPress may have added size suffixes (e.g., `-300x200.jpg`)
- Some media may not have been imported

### Partial Replacements

If some URLs weren't replaced:
- Check the script output for warnings
- Manually verify media records exist
- Generate additional UPDATE statements for unmatched URLs

## Notes

- The Workers base URL is: `https://omni-cms-api.joseph-9a2.workers.dev`
- Media route format: `/api/public/v1/media/{fileKey}`
- All media files are served through the Workers route with proper caching

