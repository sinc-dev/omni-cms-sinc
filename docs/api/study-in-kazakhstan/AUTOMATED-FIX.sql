-- ============================================================================
-- AUTOMATED FIX: Attach Custom Fields to Post Types
-- 
-- This will automatically find all custom fields that have values
-- and attach them to their respective post types
-- ============================================================================

-- STEP 1: Attach fields to Universities post type
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

-- STEP 2: Attach fields to Programs post type
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

-- STEP 3: Verify the fix
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
-- fields_attached: 6 (or more)
-- values_set: 6
-- attached_slugs: list of field slugs
-- fields_with_values: list of field slugs
