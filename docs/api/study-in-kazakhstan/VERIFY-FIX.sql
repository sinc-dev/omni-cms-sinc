-- ============================================================================
-- VERIFY: Check if the Fix Actually Worked
-- ============================================================================
-- Run these queries to diagnose what happened

-- ============================================================================
-- CHECK 1: Did the INSERT actually run? (Count attached fields)
-- ============================================================================

SELECT 
    o.slug AS organization_slug,
    COUNT(DISTINCT ptf.id) AS total_attached_fields
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug
ORDER BY o.slug;

-- If this shows 0 for all organizations, the INSERT didn't work
-- If it shows numbers > 0, fields were attached

-- ============================================================================
-- CHECK 2: Do custom field values exist? (Verify data exists)
-- ============================================================================

SELECT 
    o.slug AS organization_slug,
    pt.slug AS post_type_slug,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
JOIN posts p ON pt.id = p.post_type_id
JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;

-- This shows if there are custom field values that need to be attached
-- If this shows 0, there are no values to attach

-- ============================================================================
-- CHECK 3: Check for cross-organizational issues (Step 1.5)
-- ============================================================================

SELECT 
    o_post.slug AS post_organization,
    o_field.slug AS field_organization,
    COUNT(*) AS mismatched_count
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND o_post.id != o_field.id  -- Different organizations!
GROUP BY o_post.slug, o_field.slug;

-- If this returns rows, there are cross-org issues preventing the fix
-- Expected: 0 rows

-- ============================================================================
-- CHECK 4: Full Status Check (Step 3 from fix script)
-- ============================================================================

SELECT 
    o.slug AS organization_slug,
    o.name AS organization_name,
    pt.slug AS post_type_slug,
    pt.name AS post_type_name,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values,
    CASE 
        WHEN COUNT(DISTINCT ptf.id) = COUNT(DISTINCT pfv.custom_field_id) 
             AND COUNT(DISTINCT ptf.id) > 0 
        THEN '✅ FIXED'
        WHEN COUNT(DISTINCT ptf.id) = 0 AND COUNT(DISTINCT pfv.post_id) > 0 
        THEN '❌ NEEDS FIX'
        WHEN COUNT(DISTINCT pfv.post_id) = 0 
        THEN '⚠️ NO VALUES'
        ELSE '⚠️ PARTIAL'
    END AS status
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug, o.name, pt.slug, pt.name
ORDER BY o.slug, pt.slug;

-- This shows the full status:
-- ✅ FIXED = Fields attached correctly
-- ❌ NEEDS FIX = Values exist but not attached
-- ⚠️ NO VALUES = No custom field values to attach
-- ⚠️ PARTIAL = Some fields attached but not all

-- ============================================================================
-- CHECK 5: Test the actual INSERT query (Dry run - no INSERT)
-- ============================================================================
-- This shows what WOULD be inserted without actually inserting

SELECT 
    o_post.slug AS organization_slug,
    pt.slug AS post_type_slug,
    cf.name AS field_name,
    cf.slug AS field_slug,
    COUNT(*) AS would_attach_count
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
  )
GROUP BY o_post.slug, pt.slug, cf.id, cf.name, cf.slug
ORDER BY o_post.slug, pt.slug, cf.name;

-- This shows what fields would be attached if you run the INSERT
-- If this is empty, either:
-- 1. All fields are already attached, OR
-- 2. There are no custom field values, OR
-- 3. There's a cross-org issue preventing attachment

-- ============================================================================
-- CHECK 6: Simple count of post_type_fields table
-- ============================================================================

SELECT COUNT(*) AS total_post_type_fields
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university');

-- This shows total number of attachments across all three organizations
-- If 0, nothing was attached

