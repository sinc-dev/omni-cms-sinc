-- ============================================================================
-- SIMPLE DIRECT FIX: Attach Custom Fields to Post Types
-- 
-- This is a simpler, more direct approach that should definitely work
-- ============================================================================

-- First, let's see what we're working with
SELECT 
    'DIAGNOSTIC: Custom fields with values' AS check_type,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values,
    COUNT(DISTINCT p.post_type_id) AS post_types_affected
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan');

-- ============================================================================
-- STEP 1: Get the organization ID and post type IDs
-- ============================================================================

SELECT 
    o.id AS org_id,
    pt.id AS universities_post_type_id,
    pt_programs.id AS programs_post_type_id
FROM organizations o
LEFT JOIN post_types pt ON pt.organization_id = o.id AND pt.slug = 'universities'
LEFT JOIN post_types pt_programs ON pt_programs.organization_id = o.id AND pt_programs.slug = 'programs'
WHERE o.slug = 'study-in-kazakhstan'
LIMIT 1;

-- Save these IDs and use them in the next queries
-- Example output: org_id, universities_post_type_id, programs_post_type_id

-- ============================================================================
-- STEP 2: Find all custom fields that have values for universities
-- ============================================================================
-- Replace 'UNIVERSITIES_POST_TYPE_ID' with the actual ID from Step 1

SELECT DISTINCT
    cf.id AS custom_field_id,
    cf.name AS custom_field_name,
    cf.slug AS custom_field_slug,
    cf.field_type,
    COUNT(DISTINCT pfv.post_id) AS posts_using_this_field
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE p.post_type_id = 'UNIVERSITIES_POST_TYPE_ID'  -- Replace with actual ID
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
GROUP BY cf.id, cf.name, cf.slug, cf.field_type
ORDER BY cf.name;

-- This shows you all the custom fields that need to be attached

-- ============================================================================
-- STEP 3: Attach fields to Universities (DIRECT INSERT)
-- ============================================================================
-- Replace 'UNIVERSITIES_POST_TYPE_ID' with the actual ID from Step 1

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    'UNIVERSITIES_POST_TYPE_ID' AS post_type_id,  -- Replace with actual ID
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE p.post_type_id = 'UNIVERSITIES_POST_TYPE_ID'  -- Replace with actual ID
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = 'UNIVERSITIES_POST_TYPE_ID'  -- Replace with actual ID
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 4: Attach fields to Programs (DIRECT INSERT)
-- ============================================================================
-- Replace 'PROGRAMS_POST_TYPE_ID' with the actual ID from Step 1

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    'PROGRAMS_POST_TYPE_ID' AS post_type_id,  -- Replace with actual ID
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE p.post_type_id = 'PROGRAMS_POST_TYPE_ID'  -- Replace with actual ID
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = 'PROGRAMS_POST_TYPE_ID'  -- Replace with actual ID
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- ALTERNATIVE: Single query that does everything (if D1 supports it)
-- ============================================================================

-- This version uses subqueries to get IDs automatically
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
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
  AND pt.slug IN ('universities', 'programs')
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- VERIFY: Check if it worked
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

-- After running, you should see attached_fields > 0
