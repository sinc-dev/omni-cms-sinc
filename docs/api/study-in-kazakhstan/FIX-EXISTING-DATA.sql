-- ============================================================================
-- FIX: Attach Custom Fields to Post Types (For Existing Data)
-- 
-- This script fixes existing databases that were imported before the
-- attachment step was implemented.
-- 
-- NOTE: This version is for 'study-in-kazakhstan' only.
-- For ALL organizations, use: FIX-ALL-ORGANIZATIONS.sql
-- 
-- SAFE TO RUN MULTIPLE TIMES - Uses NOT EXISTS to prevent duplicates
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify Current State (Run this first to see what needs fixing)
-- ============================================================================

SELECT 
    pt.slug AS post_type_slug,
    pt.name AS post_type_name,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values
FROM post_types pt
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs')
GROUP BY pt.slug, pt.name
ORDER BY pt.slug;

-- Expected output before fix:
-- universities: attached_fields = 0, but posts_with_values > 0
-- programs: attached_fields = 0, but posts_with_values > 0

-- ============================================================================
-- STEP 2: Attach Custom Fields to Universities Post Type
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
    (SELECT id FROM post_types 
     WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') 
       AND slug = 'universities' 
     LIMIT 1) AS post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug = 'universities'
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = (SELECT id FROM post_types 
                               WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') 
                                 AND slug = 'universities' 
                               LIMIT 1)
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 3: Attach Custom Fields to Programs Post Type
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
    (SELECT id FROM post_types 
     WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') 
       AND slug = 'programs' 
     LIMIT 1) AS post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug = 'programs'
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = (SELECT id FROM post_types 
                               WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') 
                                 AND slug = 'programs' 
                               LIMIT 1)
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 4: Attach to ALL Other Post Types (if any)
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
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug NOT IN ('universities', 'programs')  -- Already handled above
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 5: Verify the Fix Worked
-- ============================================================================

SELECT 
    pt.slug AS post_type_slug,
    pt.name AS post_type_name,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values
FROM post_types pt
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs')
GROUP BY pt.slug, pt.name
ORDER BY pt.slug;

-- After the fix:
-- attached_fields should match unique_fields_with_values
-- Both should be > 0

-- ============================================================================
-- STEP 6: See What Fields Were Attached
-- ============================================================================

SELECT 
    pt.slug AS post_type_slug,
    cf.name AS field_name,
    cf.slug AS field_slug,
    cf.field_type,
    ptf."order"
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs')
ORDER BY pt.slug, ptf."order";

-- This shows you exactly which fields are now attached to each post type
