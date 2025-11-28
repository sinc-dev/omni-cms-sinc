-- ============================================================================
-- Diagnose: Why is the INSERT not working?
-- ============================================================================

-- Check 1: Do post_field_values exist for paris programs?
SELECT COUNT(*) AS total_values
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs';

-- Check 2: Do custom_fields exist and match organization?
SELECT 
    COUNT(*) AS matching_fields,
    COUNT(DISTINCT cf.id) AS unique_fields
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id;

-- Check 3: Are fields already attached?
SELECT COUNT(*) AS already_attached
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs';

-- Check 4: What would be inserted (without NOT EXISTS check)?
SELECT 
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    COUNT(*) AS usage_count
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id
GROUP BY pt.id, cf.id
LIMIT 10;

-- Check 5: What would be inserted (WITH NOT EXISTS check)?
SELECT 
    pt.id AS post_type_id,
    cf.id AS custom_field_id,
    COUNT(*) AS usage_count
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  )
GROUP BY pt.id, cf.id
LIMIT 10;

-- Check 6: Test the actual INSERT query structure
SELECT DISTINCT
    pt.id AS post_type_id,
    cf.id AS custom_field_id
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug = 'paris-american-international-university'
  AND pt.slug = 'programs'
  AND o.id = cf.organization_id
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf
    WHERE ptf.post_type_id = pt.id
      AND ptf.custom_field_id = cf.id
  )
LIMIT 10;
