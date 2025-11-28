-- ============================================================================
-- FIX: Attach Custom Fields to Post Types
-- 
-- ISSUE: The migration script (generate-repopulation-migration.js) creates
-- post_field_values but does NOT create post_type_fields entries.
-- This means custom fields have values but aren't attached to post types,
-- so the API filters them out.
--
-- This script finds all custom fields that have values and attaches them
-- to their respective post types.
-- ============================================================================

-- ============================================================================
-- STEP 1: Attach Custom Fields to Universities Post Type
-- ============================================================================
-- This finds all custom fields that have values for universities posts
-- and attaches them to the universities post type

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
    ROW_NUMBER() OVER (
        PARTITION BY p.post_type_id 
        ORDER BY cf.name
    ) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug = 'universities'
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 2: Attach Custom Fields to Programs Post Type
-- ============================================================================

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
    ROW_NUMBER() OVER (
        PARTITION BY p.post_type_id 
        ORDER BY cf.name
    ) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug = 'programs'
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 3: Attach Custom Fields to ALL Other Post Types
-- ============================================================================
-- This catches any other post types that might have custom field values

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
    ROW_NUMBER() OVER (
        PARTITION BY p.post_type_id 
        ORDER BY cf.name
    ) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug NOT IN ('universities', 'programs')  -- Already handled above
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 4: Verify the Fix
-- ============================================================================

SELECT 
    p.title,
    p.slug,
    pt.name AS post_type,
    (SELECT COUNT(*) 
     FROM post_type_fields ptf 
     WHERE ptf.post_type_id = p.post_type_id) AS fields_attached,
    (SELECT COUNT(*) 
     FROM post_field_values pfv 
     WHERE pfv.post_id = p.id) AS values_set,
    (SELECT GROUP_CONCAT(cf.slug, ', ') 
     FROM post_type_fields ptf 
     JOIN custom_fields cf ON ptf.custom_field_id = cf.id
     WHERE ptf.post_type_id = p.post_type_id) AS attached_slugs,
    (SELECT GROUP_CONCAT(cf.slug, ', ') 
     FROM post_field_values pfv 
     JOIN custom_fields cf ON pfv.custom_field_id = cf.id
     WHERE pfv.post_id = p.id) AS fields_with_values
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.slug = 'coventry-university-kazakhstan'
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan');

-- After running this, you should see:
-- fields_attached: 6 (or more, matching values_set)
-- values_set: 6
-- attached_slugs: list of field slugs (should match fields_with_values)
-- fields_with_values: list of field slugs

-- ============================================================================
-- STEP 5: Summary by Post Type
-- ============================================================================

SELECT 
    pt.slug AS post_type_slug,
    pt.name AS post_type_name,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values
FROM post_types pt
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs')
GROUP BY pt.slug, pt.name
ORDER BY pt.slug;

-- This shows the summary:
-- - How many fields are now attached to each post type
-- - How many posts exist
-- - How many posts have custom field values
