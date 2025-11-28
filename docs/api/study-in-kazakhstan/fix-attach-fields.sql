-- ============================================================================
-- FIX: Attach Custom Fields to Post Types
-- 
-- ISSUE: fields_attached = 0 but values_set = 6
-- This means custom field values exist but fields aren't attached to post type
-- The API filters by attached fields, so values won't be returned
-- ============================================================================

-- ============================================================================
-- STEP 1: Find which custom fields have values for Coventry University
-- ============================================================================

SELECT 
    cf.id AS custom_field_id,
    cf.name AS custom_field_name,
    cf.slug AS custom_field_slug,
    cf.field_type,
    pfv.value,
    p.id AS post_id,
    p.title AS post_title,
    pt.id AS post_type_id,
    pt.slug AS post_type_slug
FROM post_field_values pfv
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.slug = 'coventry-university-kazakhstan'
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
ORDER BY cf.name;

-- This shows you which 6 custom fields have values
-- Save these custom_field_id values and the post_type_id


-- ============================================================================
-- STEP 2: Check if these fields are already attached (they shouldn't be)
-- ============================================================================

-- Replace 'POST_TYPE_ID' with the post_type_id from Step 1
-- Replace the custom_field_ids with the IDs from Step 1

SELECT 
    ptf.id,
    ptf.post_type_id,
    ptf.custom_field_id,
    pt.name AS post_type_name,
    cf.name AS custom_field_name,
    cf.slug AS custom_field_slug
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE ptf.post_type_id = 'POST_TYPE_ID'  -- Replace with actual post_type_id
  AND ptf.custom_field_id IN (
    -- Replace with custom_field_ids from Step 1
    'FIELD_ID_1',
    'FIELD_ID_2',
    'FIELD_ID_3',
    'FIELD_ID_4',
    'FIELD_ID_5',
    'FIELD_ID_6'
  );

-- This should return 0 rows (confirming fields are NOT attached)


-- ============================================================================
-- STEP 3: Attach the custom fields to the post type
-- ============================================================================

-- Replace 'POST_TYPE_ID' with the post_type_id from Step 1
-- Replace the custom_field_ids with the IDs from Step 1
-- Adjust the "order" values as needed (1, 2, 3, etc.)

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
    'POST_TYPE_ID' AS post_type_id,  -- Replace with actual post_type_id
    cf.id AS custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM custom_fields cf
WHERE cf.id IN (
    -- Replace with custom_field_ids from Step 1
    'FIELD_ID_1',
    'FIELD_ID_2',
    'FIELD_ID_3',
    'FIELD_ID_4',
    'FIELD_ID_5',
    'FIELD_ID_6'
)
AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = 'POST_TYPE_ID'  -- Replace with actual post_type_id
      AND ptf.custom_field_id = cf.id
);

-- This will attach all 6 custom fields to the universities post type


-- ============================================================================
-- STEP 4: Verify the fix worked
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
    (SELECT GROUP_CONCAT(cf.slug) 
     FROM post_type_fields ptf 
     JOIN custom_fields cf ON ptf.custom_field_id = cf.id
     WHERE ptf.post_type_id = p.post_type_id) AS attached_slugs,
    (SELECT GROUP_CONCAT(cf.slug) 
     FROM post_field_values pfv 
     JOIN custom_fields cf ON pfv.custom_field_id = cf.id
     WHERE pfv.post_id = p.id) AS fields_with_values
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.slug = 'coventry-university-kazakhstan'
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan');

-- After the fix:
-- fields_attached should be 6 (or more)
-- values_set should still be 6
-- attached_slugs should show the field slugs
-- fields_with_values should show the field slugs


-- ============================================================================
-- AUTOMATED FIX: One query to attach all fields that have values
-- ============================================================================
-- This automatically finds fields with values and attaches them

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
  AND pt.slug = 'universities'  -- Change to 'programs' for programs post type
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- This will attach ALL custom fields that have values for universities posts
-- Run this for both 'universities' and 'programs' post types


-- ============================================================================
-- CHECK: See what fields are now attached
-- ============================================================================

SELECT 
    pt.slug AS post_type_slug,
    pt.name AS post_type_name,
    cf.slug AS custom_field_slug,
    cf.name AS custom_field_name,
    cf.field_type,
    ptf."order"
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs')
ORDER BY pt.slug, ptf."order";
