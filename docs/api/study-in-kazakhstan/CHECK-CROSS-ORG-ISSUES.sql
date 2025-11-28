-- ============================================================================
-- CHECK: Are cross-organizational issues blocking the fix?
-- ============================================================================

-- This checks if custom fields belong to different organizations than the posts
-- If this returns ANY rows, the safety check is blocking the INSERT

SELECT 
    o_post.slug AS post_organization,
    o_field.slug AS field_organization,
    pt.slug AS post_type_slug,
    cf.name AS field_name,
    COUNT(*) AS mismatch_count
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND o_post.id != o_field.id  -- Different organizations!
GROUP BY o_post.slug, o_field.slug, pt.slug, cf.name
ORDER BY o_post.slug, pt.slug, cf.name;

-- If this returns rows, we have cross-org issues that need to be fixed first
-- Expected: 0 rows (all should match)

-- ============================================================================
-- Also check: What fields WOULD be attached (ignoring safety check)
-- ============================================================================

SELECT 
    o_post.slug AS org,
    pt.slug AS post_type,
    cf.name AS field_name,
    COUNT(DISTINCT pfv.post_id) AS posts_using_field
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  )
GROUP BY o_post.slug, pt.slug, cf.id, cf.name
ORDER BY o_post.slug, pt.slug, cf.name
LIMIT 20;

-- This shows what fields would be attached if we ignore the safety check
-- Compare this to the first query to see if cross-org issues are blocking
