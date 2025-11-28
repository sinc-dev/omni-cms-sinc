-- ============================================================================
-- Fix Missing Custom Field Attachments (Modified - No Custom Fields JOIN)
-- 
-- WARNING: This version doesn't require custom_fields to exist.
-- It inserts attachments based on what's in post_field_values.
-- Use this if custom_fields don't exist in the database yet.
-- ============================================================================

-- Organization: study-in-north-cyprus
-- Missing attachments: 13339

-- Post Type: dormitories (97 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'dormitories'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- Post Type: programs (12025 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'programs'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- Post Type: reviews (1019 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'reviews'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- Post Type: universities (198 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'study-in-north-cyprus'
  AND pt.slug = 'universities'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- Organization: study-in-kazakhstan
-- Missing attachments: 52346

-- Post Type: programs (50650 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'programs'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- Post Type: reviews (1019 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'reviews'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- Post Type: universities (677 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'study-in-kazakhstan'
  AND pt.slug = 'universities'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- Organization: paris-american-international-university
-- Missing attachments: 503

-- Post Type: programs (503 fields)
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    pt.id AS post_type_id,
    pfv.custom_field_id AS custom_field_id,
    0 AS is_required,
    1 AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs'
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

