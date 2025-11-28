-- ============================================================================
-- Check if custom fields exist (maybe in wrong organization or missing entirely)
-- ============================================================================

-- 1. Check total custom fields count
SELECT 
    'Total Custom Fields' AS check_type,
    COUNT(*) AS count
FROM custom_fields;

-- 2. Check custom fields by organization
SELECT 
    'Custom Fields by Org' AS check_type,
    o.slug AS organization,
    COUNT(*) AS custom_fields_count
FROM custom_fields cf
JOIN organizations o ON cf.organization_id = o.id
WHERE o.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university')
GROUP BY o.slug
ORDER BY o.slug;

-- 3. Check if ANY of the field IDs from post_field_values exist in custom_fields
-- (regardless of organization)
SELECT 
    'Field IDs that exist in custom_fields' AS check_type,
    COUNT(DISTINCT pfv.custom_field_id) AS total_field_ids_in_values,
    COUNT(DISTINCT cf.id) AS field_ids_that_exist_in_custom_fields,
    COUNT(DISTINCT pfv.custom_field_id) - COUNT(DISTINCT cf.id) AS missing_field_ids
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE o.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university');

-- 4. Check if field IDs exist but in wrong organization
SELECT 
    'Fields in Wrong Org' AS check_type,
    o1.slug AS value_org,
    o2.slug AS field_org,
    COUNT(DISTINCT pfv.custom_field_id) AS mismatched_fields
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o1 ON pt.organization_id = o1.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o2 ON cf.organization_id = o2.id
WHERE o1.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university')
  AND o1.id != o2.id
GROUP BY o1.slug, o2.slug
ORDER BY o1.slug, o2.slug;

-- 5. Sample of field IDs that are missing
SELECT 
    'Sample Missing Field IDs' AS check_type,
    o.slug AS organization,
    pt.slug AS post_type,
    pfv.custom_field_id AS missing_field_id,
    COUNT(*) AS usage_count
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id AND cf.organization_id = o.id
WHERE o.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university')
  AND cf.id IS NULL
GROUP BY o.slug, pt.slug, pfv.custom_field_id
ORDER BY o.slug, pt.slug, usage_count DESC
LIMIT 20;
