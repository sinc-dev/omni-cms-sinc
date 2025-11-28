-- ============================================================================
-- DIAGNOSTIC QUERIES - Run this BEFORE the INSERT statements
-- This will help understand why INSERTs might return empty
-- ============================================================================

-- 1. Check if attachments already exist (this would prevent INSERTs)
SELECT 
    'Query 1: Existing Attachments' AS query_name,
    o.slug AS organization,
    pt.slug AS post_type,
    COUNT(*) AS existing_attachments
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university')
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;

-- 2. Check if post_field_values exist for these organizations
SELECT 
    'Query 2: Field Values by Org/PostType' AS query_name,
    o.slug AS organization,
    pt.slug AS post_type,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values,
    COUNT(*) AS total_field_value_entries
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university')
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;

-- 3. Check if custom_fields exist and match organization
SELECT 
    'Query 3: Custom Fields by Org' AS query_name,
    o.slug AS organization,
    COUNT(DISTINCT cf.id) AS custom_fields_count
FROM custom_fields cf
JOIN organizations o ON cf.organization_id = o.id
WHERE o.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university')
GROUP BY o.slug
ORDER BY o.slug;

-- 4. Test one specific INSERT to see if it would work
-- This simulates what the INSERT would do for study-in-north-cyprus dormitories
SELECT 
    'Query 4: Test INSERT for dormitories' AS query_name,
    COUNT(DISTINCT cf.id) AS fields_that_would_insert
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

-- 5. Check if there's a mismatch between field values and custom fields
SELECT 
    'Query 5: Field Value vs Custom Field Mismatch' AS query_name,
    o.slug AS organization,
    COUNT(DISTINCT pfv.custom_field_id) AS field_ids_in_values,
    COUNT(DISTINCT CASE WHEN cf.id IS NULL THEN pfv.custom_field_id END) AS missing_custom_fields
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id AND cf.organization_id = o.id
WHERE o.slug IN ('study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university')
GROUP BY o.slug
ORDER BY o.slug;
