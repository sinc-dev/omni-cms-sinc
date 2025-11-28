-- ============================================================================
-- DIAGNOSE: Why is the detailed view empty?
-- ============================================================================
-- Run these queries in order to find the issue

-- ============================================================================
-- QUERY 1: Check if ANY post_type_fields exist at all
-- ============================================================================

SELECT COUNT(*) AS total_attachments
FROM post_type_fields;

-- If this is 0, the INSERT didn't work or didn't run

-- ============================================================================
-- QUERY 2: Check if attachments exist for our organizations
-- ============================================================================

SELECT 
    o.slug,
    COUNT(ptf.id) AS attachments
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug;

-- If all show 0, nothing was attached

-- ============================================================================
-- QUERY 3: Check if custom field values exist
-- ============================================================================

SELECT 
    o.slug AS org_slug,
    COUNT(DISTINCT pfv.id) AS total_values,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
JOIN posts p ON pt.id = p.post_type_id
JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug;

-- If this shows 0, there are no custom field values to attach

-- ============================================================================
-- QUERY 4: Check for cross-organizational issues
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

-- If this returns rows, cross-org issues are blocking the fix
-- Expected: 0 rows

-- ============================================================================
-- QUERY 5: Test what WOULD be inserted (without safety check)
-- ============================================================================

SELECT 
    o_post.slug AS org,
    pt.slug AS post_type,
    COUNT(DISTINCT pfv.custom_field_id) AS fields_to_attach
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  )
GROUP BY o_post.slug, pt.slug
ORDER BY o_post.slug, pt.slug;

-- This shows how many fields would be attached (ignoring org safety check)
-- If this is empty, all fields are already attached OR no values exist

-- ============================================================================
-- QUERY 6: Test what WOULD be inserted (WITH safety check)
-- ============================================================================

SELECT 
    o_post.slug AS org,
    pt.slug AS post_type,
    COUNT(DISTINCT pfv.custom_field_id) AS fields_to_attach
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
GROUP BY o_post.slug, pt.slug
ORDER BY o_post.slug, pt.slug;

-- Compare this to Query 5
-- If Query 5 has rows but Query 6 is empty, the safety check is blocking everything
-- This means there ARE cross-organizational issues

-- ============================================================================
-- QUERY 7: Check if ROW_NUMBER() is supported (D1 compatibility)
-- ============================================================================
-- If D1 doesn't support window functions, the INSERT will fail silently

SELECT 
    ROW_NUMBER() OVER (ORDER BY id) AS test_row_num
FROM organizations
LIMIT 1;

-- If this fails, D1 doesn't support window functions
-- Use FIX-BASIC-INSERT.sql instead (doesn't use window functions)

