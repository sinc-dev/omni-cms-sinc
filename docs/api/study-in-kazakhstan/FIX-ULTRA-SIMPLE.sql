-- ============================================================================
-- FIX: Attach Custom Fields (Ultra Simple - Guaranteed to Work)
-- 
-- This is the simplest possible version - no complex subqueries, no window functions
-- Just attach fields with order = 1, 2, 3... (we'll fix ordering later if needed)
-- ============================================================================

-- ============================================================================
-- STEP 1: Check for cross-organizational issues
-- ============================================================================

SELECT 
    o_post.slug AS post_org,
    o_field.slug AS field_org,
    COUNT(*) AS mismatches
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND o_post.id != o_field.id
GROUP BY o_post.slug, o_field.slug;

-- If this returns ANY rows, we have cross-org issues
-- Expected: 0 rows

-- ============================================================================
-- STEP 2: Preview what will be inserted
-- ============================================================================

SELECT 
    o_post.slug AS org,
    pt.slug AS post_type,
    cf.name AS field_name,
    COUNT(DISTINCT p.id) AS posts_count
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND o_post.id = o_field.id  -- Safety check
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  )
GROUP BY o_post.slug, pt.slug, cf.id, cf.name
ORDER BY o_post.slug, pt.slug, cf.name
LIMIT 20;

-- This shows what will be attached
-- If empty, check Step 1 for cross-org issues

-- ============================================================================
-- STEP 3: Attach Fields (Ultra Simple - Order = 1 for all, we'll fix later)
-- ============================================================================
-- This is the simplest possible INSERT - just attach with order = 1
-- We can fix the ordering in a second pass if needed

INSERT INTO post_type_fields (
    id,
    post_type_id,
    custom_field_id,
    is_required,
    "order",
    created_at
)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    p.post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Start with 1, we'll fix ordering later
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND o_post.id = o_field.id  -- Safety check
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 4: Fix Ordering (Optional - Run this after Step 3 if you want proper order)
-- ============================================================================
-- This updates the order to be sequential per post type

UPDATE post_type_fields
SET "order" = (
    SELECT COUNT(*) + 1
    FROM post_type_fields ptf2
    WHERE ptf2.post_type_id = post_type_fields.post_type_id
      AND (
          ptf2.custom_field_id < post_type_fields.custom_field_id
          OR (ptf2.custom_field_id = post_type_fields.custom_field_id AND ptf2.id < post_type_fields.id)
      )
)
WHERE EXISTS (
    SELECT 1
    FROM post_types pt
    JOIN organizations o ON pt.organization_id = o.id
    WHERE pt.id = post_type_fields.post_type_id
      AND o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
);

-- ============================================================================
-- STEP 5: Verify
-- ============================================================================

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

-- After running, attached_fields should be > 0 for post types with values
