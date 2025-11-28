-- ============================================================================
-- Check for Posts Still Using Unknown Fields
-- This query shows any post_field_values that are still referencing
-- "unknown-field-*" custom fields
-- ============================================================================

-- Option 1: Count of unknown fields still in use
SELECT 
  COUNT(*) as total_unknown_field_values,
  COUNT(DISTINCT pfv.post_id) as posts_with_unknown_fields,
  COUNT(DISTINCT pfv.custom_field_id) as unique_unknown_field_ids
FROM post_field_values pfv
INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%';

-- Option 2: Detailed list of posts with unknown fields
SELECT 
  p.id as post_id,
  p.title as post_title,
  p.slug as post_slug,
  o.slug as organization_slug,
  pt.slug as post_type_slug,
  cf.id as custom_field_id,
  cf.name as field_name,
  cf.slug as field_slug,
  pfv.value as field_value,
  pfv.created_at as value_created_at
FROM post_field_values pfv
INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
INNER JOIN posts p ON pfv.post_id = p.id
INNER JOIN organizations o ON p.organization_id = o.id
INNER JOIN post_types pt ON p.post_type_id = pt.id
WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%'
ORDER BY o.slug, pt.slug, p.title, cf.slug
LIMIT 100;

-- Option 3: Summary by organization
SELECT 
  o.slug as organization_slug,
  pt.slug as post_type_slug,
  COUNT(DISTINCT p.id) as posts_affected,
  COUNT(pfv.id) as unknown_field_values,
  COUNT(DISTINCT cf.id) as unique_unknown_fields
FROM post_field_values pfv
INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
INNER JOIN posts p ON pfv.post_id = p.id
INNER JOIN organizations o ON p.organization_id = o.id
INNER JOIN post_types pt ON p.post_type_id = pt.id
WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%'
GROUP BY o.slug, pt.slug
ORDER BY unknown_field_values DESC;

-- Option 4: List of all unknown field IDs still in use
SELECT DISTINCT
  cf.id as custom_field_id,
  cf.name as field_name,
  cf.slug as field_slug,
  cf.organization_id,
  o.slug as organization_slug,
  COUNT(pfv.id) as usage_count
FROM post_field_values pfv
INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
LEFT JOIN organizations o ON cf.organization_id = o.id
WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%'
GROUP BY cf.id, cf.name, cf.slug, cf.organization_id, o.slug
ORDER BY usage_count DESC;

