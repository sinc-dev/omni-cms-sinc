-- List of unknown field slugs still in use
SELECT 
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

