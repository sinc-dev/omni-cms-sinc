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

