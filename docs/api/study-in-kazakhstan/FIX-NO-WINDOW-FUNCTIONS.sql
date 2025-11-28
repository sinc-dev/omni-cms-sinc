-- ============================================================================
-- FIX: Attach Custom Fields (No Window Functions - D1 Compatible)
-- 
-- Use this if D1 doesn't support ROW_NUMBER() OVER window functions
-- This version uses simpler SQL that works in all SQLite versions
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Current State
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

-- ============================================================================
-- STEP 2: Attach Fields (No Window Functions)
-- ============================================================================
-- This version uses a simple approach: order by field name, sequential numbering

INSERT INTO post_type_fields (
    id,
    post_type_id,
    custom_field_id,
    is_required,
    "order",
    created_at
)
SELECT 
    lower(hex(randomblob(12))) AS id,
    post_type_id,
    custom_field_id,
    0 AS is_required,
    -- Sequential order: existing max + row number within post type
    (
        SELECT COALESCE(MAX(ptf_existing."order"), 0)
        FROM post_type_fields ptf_existing
        WHERE ptf_existing.post_type_id = fields_to_attach.post_type_id
    ) + (
        SELECT COUNT(*) 
        FROM (
            SELECT DISTINCT p2.post_type_id, pfv2.custom_field_id
            FROM post_field_values pfv2
            JOIN posts p2 ON pfv2.post_id = p2.id
            JOIN post_types pt2 ON p2.post_type_id = pt2.id
            JOIN organizations o_post2 ON pt2.organization_id = o_post2.id
            JOIN custom_fields cf2 ON pfv2.custom_field_id = cf2.id
            JOIN organizations o_field2 ON cf2.organization_id = o_field2.id
            WHERE o_post2.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
              AND o_post2.id = o_field2.id
              AND pt2.id = fields_to_attach.post_type_id
              AND cf2.name < (
                  SELECT cf3.name 
                  FROM custom_fields cf3 
                  WHERE cf3.id = fields_to_attach.custom_field_id
              )
              AND NOT EXISTS (
                SELECT 1 FROM post_type_fields ptf2 
                WHERE ptf2.post_type_id = pt2.id
                  AND ptf2.custom_field_id = pfv2.custom_field_id
              )
        ) AS earlier_fields
    ) + 1 AS "order",
    unixepoch() AS created_at
FROM (
    SELECT DISTINCT
        p.post_type_id,
        pfv.custom_field_id
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
) AS fields_to_attach;

-- ============================================================================
-- STEP 3: Verify
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

-- After running, attached_fields should be > 0

