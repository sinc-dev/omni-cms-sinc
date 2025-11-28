# SQL Diagnostic Guide for Custom Fields

## Quick Start

1. **Run the quick diagnostic first:**
   ```sql
   -- See quick-diagnostic.sql
   ```
   This will show you immediately if fields are attached and if values exist.

2. **If you need more details, use the comprehensive queries:**
   ```sql
   -- See check-custom-fields.sql
   ```

## What to Look For

### Scenario 1: No Custom Fields Attached
**Symptom:** `attached_fields_count = 0` or query returns 0 rows

**Meaning:** Custom fields exist in the `custom_fields` table but are NOT linked to the post types via `post_type_fields` table.

**Fix:** You need to insert records into `post_type_fields` to attach custom fields to post types.

**Example Fix SQL:**
```sql
-- First, get the IDs you need:
-- 1. Organization ID
SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan';

-- 2. Post Type ID for universities
SELECT id FROM post_types 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND slug = 'universities';

-- 3. Custom Field IDs
SELECT id, slug FROM custom_fields 
WHERE organization_id = 'YOUR_ORG_ID'
  AND slug IN ('location', 'website', 'logo', 'background_image');

-- Then attach them:
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
VALUES 
  (lower(hex(randomblob(12))), 'UNIVERSITIES_POST_TYPE_ID', 'LOCATION_FIELD_ID', 0, 1, unixepoch()),
  (lower(hex(randomblob(12))), 'UNIVERSITIES_POST_TYPE_ID', 'WEBSITE_FIELD_ID', 0, 2, unixepoch()),
  -- ... etc
```

### Scenario 2: Fields Attached But No Values
**Symptom:** `attached_fields_count > 0` but `custom_field_values_count = 0`

**Meaning:** Custom fields are attached to the post type, but no values have been set for the posts.

**Fix:** You need to populate the `post_field_values` table with actual values.

**Example Fix SQL:**
```sql
-- Get post ID
SELECT id FROM posts WHERE slug = 'coventry-university-kazakhstan';

-- Get custom field IDs that are attached
SELECT ptf.custom_field_id, cf.slug
FROM post_type_fields ptf
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE ptf.post_type_id = 'UNIVERSITIES_POST_TYPE_ID';

-- Insert values
INSERT INTO post_field_values (id, post_id, custom_field_id, value, created_at, updated_at)
VALUES 
  (lower(hex(randomblob(12))), 'POST_ID', 'LOCATION_FIELD_ID', 'Almaty', unixepoch(), unixepoch()),
  (lower(hex(randomblob(12))), 'POST_ID', 'WEBSITE_FIELD_ID', 'https://coventry.kz', unixepoch(), unixepoch()),
  -- ... etc
```

### Scenario 3: Everything Looks Good But API Still Returns Empty
**Symptom:** Both `attached_fields_count > 0` and `custom_field_values_count > 0`

**Meaning:** The data exists in the database, so the problem is likely in the API code logic.

**Check:**
1. Verify the API is filtering by `postTypeFieldsMap` correctly
2. Check if media fields need special resolution
3. Verify the organization_id is being passed correctly
4. Check if there are any WHERE clause filters excluding the data

## Common Issues

### Issue: Can't Find Organization
**Query:**
```sql
SELECT * FROM organizations WHERE slug LIKE '%kazakhstan%';
```

### Issue: Can't Find Post Types
**Query:**
```sql
SELECT * FROM post_types 
WHERE organization_id = 'YOUR_ORG_ID';
```

### Issue: Custom Fields Exist But Wrong Organization
**Query:**
```sql
SELECT cf.*, o.slug AS org_slug
FROM custom_fields cf
JOIN organizations o ON cf.organization_id = o.id
WHERE cf.slug IN ('location', 'website', 'tuition_fee');
```

## Expected Results for Working System

For a working system, you should see:

```
post_type: universities
attached_custom_fields: 10+ (or however many you have)
total_posts: 1+ (at least Coventry)
posts_with_values: 1+ (at least Coventry has values)

post_type: programs  
attached_custom_fields: 5+ (tuition_fee, duration, language, etc.)
total_posts: 10+ (or however many programs exist)
posts_with_values: 10+ (all programs should have values)
```

## Next Steps After Diagnosis

1. **If fields aren't attached:**
   - Use the CMS admin to attach fields, OR
   - Run INSERT statements to create `post_type_fields` records

2. **If values don't exist:**
   - Use the CMS admin to populate values, OR
   - Run INSERT statements to create `post_field_values` records

3. **If everything exists but API fails:**
   - Check API code in `apps/web/apps/api/src/routes/public/posts.ts`
   - Look for filtering logic around line 478-540
   - Verify `postTypeFieldsMap` is being populated

## SQL Files

- **`quick-diagnostic.sql`** - Single query to get overview
- **`check-custom-fields.sql`** - Step-by-step detailed queries
