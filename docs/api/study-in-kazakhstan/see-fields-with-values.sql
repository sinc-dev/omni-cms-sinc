-- ============================================================================
-- See which custom fields have values for Coventry University
-- This shows you the 6 fields that need to be attached
-- ============================================================================

SELECT 
    cf.id AS custom_field_id,
    cf.name AS custom_field_name,
    cf.slug AS custom_field_slug,
    cf.field_type,
    pfv.value,
    p.title AS post_title,
    pt.name AS post_type_name,
    pt.id AS post_type_id
FROM post_field_values pfv
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.slug = 'coventry-university-kazakhstan'
  AND p.organization_id = (SELECT id FROM organizations WHERE slug = 'study-in-kazakhstan')
ORDER BY cf.name;

-- This will show you:
-- - The 6 custom fields that have values
-- - Their field types (text, media, number, etc.)
-- - The actual values stored
-- - The post_type_id you need for the fix
