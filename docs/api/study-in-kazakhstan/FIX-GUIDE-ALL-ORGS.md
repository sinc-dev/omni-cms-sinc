# Fix Guide: Attach Custom Fields for ALL Organizations

## Organizations

This fix applies to all three organizations:
1. **study-in-kazakhstan**
2. **study-in-north-cyprus**
3. **paris-american-international-university**

## Quick Fix (Recommended)

### Option 1: Fix All Organizations at Once

Run **`FIX-ALL-ORGANIZATIONS.sql`** - Step 2

This single query fixes all organizations and all post types in one go.

**Time:** ~1 minute

### Option 2: Fix One Organization at a Time

Use the alternative queries in `FIX-ALL-ORGANIZATIONS.sql` to fix each organization separately.

## Step-by-Step

### Step 1: Check Current State

Run Step 1 from `FIX-ALL-ORGANIZATIONS.sql`:

```sql
SELECT 
    o.slug AS organization_slug,
    pt.slug AS post_type_slug,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;
```

**Expected:** Most will show `attached_fields = 0` but `posts_with_values > 0`

### Step 2: Run the Fix

Run Step 2 from `FIX-ALL-ORGANIZATIONS.sql`:

```sql
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    p.post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (PARTITION BY p.post_type_id ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );
```

This will attach all custom fields to all post types for all three organizations.

### Step 3: Verify

Run Step 3 from `FIX-ALL-ORGANIZATIONS.sql` to see the status:

**Expected:** Status should show `✅ FIXED` for post types with values

## Post Types by Organization

### Study in Kazakhstan
- blogs
- programs
- universities
- team-members
- reviews
- video-testimonials
- dormitories

### Study in North Cyprus
- blogs
- programs
- universities
- team-members
- reviews
- video-testimonials
- dormitories

### Paris American International University
- blogs
- programs
- team-members
- academic-staff
- instructors

## Safety

✅ **Safe to run multiple times** - Uses `NOT EXISTS`
✅ **No data loss** - Only adds entries
✅ **Works for all post types** - Not just universities/programs
✅ **Handles all organizations** - One script fixes everything

## After Running

Test the API for each organization:

```bash
# Study in Kazakhstan
curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-kazakhstan/posts/coventry-university-kazakhstan" \
  -H "Authorization: Bearer omni_099c139e8f5dce0edfc59cc9926d0cd7"

# Study in North Cyprus (if you have a test post)
curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/study-in-north-cyprus/posts/{post-slug}" \
  -H "Authorization: Bearer {api-key}"

# Paris American (if you have a test post)
curl "https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/paris-american-international-university/posts/{post-slug}" \
  -H "Authorization: Bearer {api-key}"
```

Custom fields should now appear in all API responses!

