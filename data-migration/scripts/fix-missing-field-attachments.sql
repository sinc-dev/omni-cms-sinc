-- ============================================================================
-- Fix Missing Custom Field Attachments
-- Generated from audit-and-fix-field-attachments.js
-- Total missing attachments: 66188
-- ============================================================================

-- This SQL uses the actual post_field_values data to attach fields
-- It includes safety checks to prevent duplicates and cross-org issues

-- Organization: study-in-north-cyprus
-- Missing attachments: 13339

-- Post Type: dormitories (97 fields)
-- Insert fields for dormitories (97 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'dormitories'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );


-- Post Type: programs (12025 fields)
-- Insert fields for programs (12025 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );


-- Post Type: reviews (1019 fields)
-- Insert fields for reviews (1019 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'reviews'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );


-- Post Type: universities (198 fields)
-- Insert fields for universities (198 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'universities'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );


-- Organization: study-in-kazakhstan
-- Missing attachments: 52346

-- Post Type: programs (50650 fields)
-- Insert fields for programs (50650 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );


-- Post Type: reviews (1019 fields)
-- Insert fields for reviews (1019 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'reviews'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );


-- Post Type: universities (677 fields)
-- Insert fields for universities (677 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'universities'
  AND o.id = cf.organization_id  -- Safety check: same organization
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  );


-- Organization: paris-american-international-university
-- Missing attachments: 503

-- Post Type: programs (503 fields)
-- Insert fields for programs (503 fields)
-- Using simple INSERT with order = 1, will fix ordering in separate step if needed
-- Optimized: No IN clause needed - join through post_field_values already filters to used fields

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    0 AS is_required,
    1 AS "order",  -- Will be updated in separate step
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

