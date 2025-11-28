-- ============================================================================
-- Investigate Remaining Unknown Fields
-- Find out which posts/fields are still using unknown fields
-- ============================================================================

-- Summary by organization and post type
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

-- List of unknown field slugs still in use
SELECT DISTINCT
  cf.slug as unknown_field_slug,
  cf.name as field_name,
  o.slug as organization_slug,
  COUNT(pfv.id) as usage_count
FROM post_field_values pfv
INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
LEFT JOIN organizations o ON cf.organization_id = o.id
WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%'
GROUP BY cf.slug, cf.name, o.slug
ORDER BY usage_count DESC
LIMIT 50;

-- Sample posts with unknown fields (first 20)
SELECT 
  p.id as post_id,
  p.title as post_title,
  p.slug as post_slug,
  o.slug as organization_slug,
  pt.slug as post_type_slug,
  cf.slug as unknown_field_slug,
  SUBSTR(pfv.value, 1, 50) as field_value_preview
FROM post_field_values pfv
INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
INNER JOIN posts p ON pfv.post_id = p.id
INNER JOIN organizations o ON p.organization_id = o.id
INNER JOIN post_types pt ON p.post_type_id = pt.id
WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%'
ORDER BY o.slug, p.title
LIMIT 20;

