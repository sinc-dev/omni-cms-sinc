-- ============================================================================
-- QUICK DIAGNOSTIC: Check Custom Fields for Study in Kazakhstan
-- Run this single query to get a complete picture
-- ============================================================================

WITH org_info AS (
    SELECT id AS org_id, name AS org_name
    FROM organizations
    WHERE slug = 'study-in-kazakhstan'
    LIMIT 1
),
post_types_info AS (
    SELECT 
        pt.id AS post_type_id,
        pt.slug AS post_type_slug,
        pt.name AS post_type_name,
        COUNT(DISTINCT ptf.id) AS attached_fields_count,
        GROUP_CONCAT(DISTINCT cf.slug) AS attached_field_slugs
    FROM org_info oi
    JOIN post_types pt ON pt.organization_id = oi.org_id
    LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
    LEFT JOIN custom_fields cf ON ptf.custom_field_id = cf.id
    WHERE pt.slug IN ('universities', 'programs')
    GROUP BY pt.id, pt.slug, pt.name
),
posts_info AS (
    SELECT 
        p.id AS post_id,
        p.title,
        p.slug,
        p.post_type_id,
        COUNT(DISTINCT pfv.id) AS custom_field_values_count,
        GROUP_CONCAT(DISTINCT cf.slug) AS fields_with_values
    FROM org_info oi
    JOIN posts p ON p.organization_id = oi.org_id
    LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
    LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id
    WHERE p.slug = 'coventry-university-kazakhstan'
    GROUP BY p.id, p.title, p.slug, p.post_type_id
)
SELECT 
    oi.org_name,
    pti.post_type_slug,
    pti.post_type_name,
    pti.attached_fields_count,
    pti.attached_field_slugs,
    pi.title AS sample_post_title,
    pi.custom_field_values_count,
    pi.fields_with_values,
    CASE 
        WHEN pti.attached_fields_count = 0 THEN '❌ NO FIELDS ATTACHED'
        WHEN pi.custom_field_values_count = 0 THEN '⚠️ FIELDS ATTACHED BUT NO VALUES'
        ELSE '✅ FIELDS ATTACHED AND VALUES EXIST'
    END AS status
FROM org_info oi
CROSS JOIN post_types_info pti
LEFT JOIN posts_info pi ON pti.post_type_id = pi.post_type_id
ORDER BY pti.post_type_slug;

-- ============================================================================
-- ALTERNATIVE: Simpler version if the above doesn't work in D1
-- ============================================================================

-- Get organization ID
SELECT id, name, slug FROM organizations WHERE slug = 'study-in-kazakhstan';

-- Then use the org_id in this query:
SELECT 
    pt.slug AS post_type,
    COUNT(DISTINCT ptf.id) AS attached_custom_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values
FROM post_types pt
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs')
GROUP BY pt.slug;

-- ============================================================================
-- Check specific post (Coventry University)
-- ============================================================================

SELECT 
    p.title,
    p.slug,
    pt.name AS post_type,
    -- Count attached fields
    (SELECT COUNT(*) 
     FROM post_type_fields ptf 
     WHERE ptf.post_type_id = p.post_type_id) AS fields_attached,
    -- Count values
    (SELECT COUNT(*) 
     FROM post_field_values pfv 
     WHERE pfv.post_id = p.id) AS values_set,
    -- Show attached field slugs
    (SELECT GROUP_CONCAT(cf.slug) 
     FROM post_type_fields ptf 
     JOIN custom_fields cf ON ptf.custom_field_id = cf.id
     WHERE ptf.post_type_id = p.post_type_id) AS attached_slugs,
    -- Show fields with values
    (SELECT GROUP_CONCAT(cf.slug) 
     FROM post_field_values pfv 
     JOIN custom_fields cf ON pfv.custom_field_id = cf.id
     WHERE pfv.post_id = p.id) AS fields_with_values
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.slug = 'coventry-university-kazakhstan'
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan');
