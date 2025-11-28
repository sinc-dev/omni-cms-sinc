# Fix Guide: Attach Custom Fields to Post Types

## Current Situation

You imported data days ago, but the import process was missing the step to attach custom fields to post types. This means:
- ✅ Custom fields exist in `custom_fields` table
- ✅ Custom field values exist in `post_field_values` table  
- ❌ Custom fields are NOT attached to post types in `post_type_fields` table
- ❌ API returns empty `customFields: {}` because fields aren't attached

## Solution: Use SQL (Recommended)

**Why SQL instead of JavaScript:**
- ✅ Faster - Direct database operation
- ✅ Simpler - One script, no dependencies
- ✅ Works with existing data - No need for transformed JSON files
- ✅ Safe - Uses `NOT EXISTS` to prevent duplicates
- ✅ Can run multiple times safely

## Quick Fix (3 Steps)

### Step 1: Check Current State

Run this in D1 to see what needs fixing:

```sql
SELECT 
    pt.slug AS post_type_slug,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values
FROM post_types pt
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN post_field_values pfv ON (SELECT post_type_id FROM posts WHERE id = pfv.post_id) = pt.id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs')
GROUP BY pt.slug;
```

**Expected:** `attached_fields = 0` but `posts_with_values > 0`

### Step 2: Run the Fix

Run the SQL script: **`FIX-EXISTING-DATA.sql`**

This will:
- Find all custom fields that have values for each post type
- Attach them to the post type
- Skip fields already attached (safe to run multiple times)

### Step 3: Verify

Run Step 1 again. You should now see:
- `attached_fields` matches the number of unique fields with values
- Both should be > 0

## Detailed Steps

### Option A: Use the Complete Script

1. Open `FIX-EXISTING-DATA.sql` in D1
2. Run Step 1 (verify current state)
3. Run Step 2 (attach to universities)
4. Run Step 3 (attach to programs)
5. Run Step 4 (attach to other post types if any)
6. Run Step 5 (verify fix worked)
7. Run Step 6 (see what was attached)

### Option B: Use the Simple Script

If D1 doesn't support window functions (`ROW_NUMBER() OVER`), use `FIX-BASIC-INSERT.sql` instead.

## What Gets Fixed

### Before Fix:
```
universities: attached_fields = 0, posts_with_values = 114
programs: attached_fields = 0, posts_with_values = 5102
```

### After Fix:
```
universities: attached_fields = 6+, posts_with_values = 114
programs: attached_fields = 10+, posts_with_values = 5102
```

## Safety

✅ **Safe to run multiple times** - Uses `NOT EXISTS` clause
✅ **No data loss** - Only adds entries, never deletes
✅ **Idempotent** - Same result if run multiple times
✅ **No duplicates** - Unique constraint prevents duplicates

## After Running

1. **Test the API:**
   ```bash
   curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
     -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"
   ```

2. **Check customFields:**
   - Should now contain field values instead of `{}`
   - Fields should match what you see in Step 6 query

## Troubleshooting

### If attached_fields still = 0 after running:

1. **Check if the INSERT actually ran:**
   ```sql
   SELECT COUNT(*) FROM post_type_fields 
   WHERE post_type_id IN (
     SELECT id FROM post_types 
     WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
       AND slug IN ('universities', 'programs')
   );
   ```

2. **Check if custom field values exist:**
   ```sql
   SELECT COUNT(DISTINCT custom_field_id) 
   FROM post_field_values pfv
   JOIN posts p ON pfv.post_id = p.id
   JOIN post_types pt ON p.post_type_id = pt.id
   WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
     AND pt.slug = 'universities';
   ```

3. **Check for errors:** D1 might show error messages if the query failed

### If you get "ROW_NUMBER() OVER not supported":

Use `FIX-BASIC-INSERT.sql` instead, which doesn't use window functions.

## Next Steps After Fix

1. ✅ Run the SQL fix
2. ✅ Verify fields are attached
3. ✅ Test API endpoints
4. ✅ Verify customFields appear in responses

That's it! No need to re-import anything.

