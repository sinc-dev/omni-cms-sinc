-- ============================================================================
-- BASIC INSERT FIX: Simplest possible approach
-- This should work in any SQLite database including D1
-- ============================================================================

-- ============================================================================
-- STEP 1: Get the IDs we need
-- ============================================================================

SELECT 
    o.id AS org_id,
    pt.id AS universities_post_type_id,
    pt_programs.id AS programs_post_type_id
FROM organizations o
LEFT JOIN post_types pt ON pt.organization_id = o.id AND pt.slug = 'universities'
LEFT JOIN post_types pt_programs ON pt_programs.organization_id = o.id AND pt_programs.slug = 'programs'
WHERE o.slug = 'study-in-kazakhstan';

-- Copy the IDs: universities_post_type_id and programs_post_type_id

-- ============================================================================
-- STEP 2: Attach ALL custom fields that have values to Universities
-- Replace 'YOUR_UNIVERSITIES_POST_TYPE_ID' with the actual ID from Step 1
-- ============================================================================

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    (SELECT id FROM post_types WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') AND slug = 'universities' LIMIT 1) AS post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Simple: just use 1 for all, or increment manually
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
WHERE p.post_type_id = (SELECT id FROM post_types WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') AND slug = 'universities' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = (SELECT id FROM post_types WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') AND slug = 'universities' LIMIT 1)
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 3: Attach ALL custom fields that have values to Programs
-- ============================================================================

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    (SELECT id FROM post_types WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') AND slug = 'programs' LIMIT 1) AS post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
WHERE p.post_type_id = (SELECT id FROM post_types WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') AND slug = 'programs' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = (SELECT id FROM post_types WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan') AND slug = 'programs' LIMIT 1)
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 4: Verify it worked
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

-- You should now see attached_fields > 0

-- ============================================================================
-- TROUBLESHOOTING: If it still shows 0, check these
-- ============================================================================

-- Check if the INSERT actually ran (should show rows inserted)
SELECT COUNT(*) AS total_attached_fields
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
WHERE pt.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs');

-- Check if there are any custom field values at all
SELECT COUNT(*) AS total_custom_field_values
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
  AND pt.slug IN ('universities', 'programs');

-- Check if custom fields exist
SELECT COUNT(*) AS total_custom_fields
FROM custom_fields
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan');
