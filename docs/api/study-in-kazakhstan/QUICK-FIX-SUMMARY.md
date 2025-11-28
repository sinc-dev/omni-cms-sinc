# Quick Fix Summary

## What You Need to Do

**Run one SQL script to fix all three organizations:**

```sql
-- File: FIX-ALL-ORGANIZATIONS.sql
-- Step 2: Fix all organizations
```

## Organizations Fixed

1. ✅ **study-in-kazakhstan**
2. ✅ **study-in-north-cyprus**  
3. ✅ **paris-american-international-university**

## The Problem

Custom fields exist and have values, but they're not attached to post types, so the API returns empty `customFields: {}`.

## The Solution

**File:** `FIX-ALL-ORGANIZATIONS.sql`

**Step 2** (the main fix) - Run this:

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

## Safety

✅ **Safe to run multiple times** - Won't create duplicates
✅ **No data loss** - Only adds entries
✅ **Works for all post types** - Not just universities/programs

## After Running

Test the API - custom fields should now appear in responses for all organizations!

