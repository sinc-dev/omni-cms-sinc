-- ============================================================================
-- Fix Missing Custom Field Attachments (Simple Version - D1 Compatible)
-- ============================================================================
-- This version doesn't use window functions and uses simpler logic
-- ============================================================================

-- ============================================================================
-- STEP 1: Diagnostic - Check what would be inserted
-- ============================================================================

-- Check for paris-american-international-university programs
SELECT 
    o.slug AS org_slug,
    pt.slug AS post_type_slug,
    COUNT(DISTINCT cf.id) AS unique_fields_to_attach,
    COUNT(DISTINCT p.id) AS posts_using_fields
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id  -- Safety check
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  )
GROUP BY o.slug, pt.slug;

-- If this returns 0, check if fields are already attached or if there's a join issue

-- ============================================================================
-- STEP 2: Simple INSERT (no window functions, order = 1 for all)
-- ============================================================================

-- Paris American International University - Programs
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- Study in North Cyprus - Dormitories
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'dormitories'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- Study in North Cyprus - Programs
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- Study in North Cyprus - Reviews
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'reviews'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- Study in North Cyprus - Universities
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'universities'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- Study in Kazakhstan - Programs
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- Study in Kazakhstan - Reviews
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'reviews'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- Study in Kazakhstan - Universities
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'universities'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );

-- ============================================================================
-- STEP 3: Verify
-- ============================================================================

SELECT 
    o.slug AS org_slug,
    pt.slug AS post_type_slug,
    COUNT(DISTINCT ptf.id) AS attached_fields
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;
