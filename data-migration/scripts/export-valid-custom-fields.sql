-- Export Valid Custom Fields Data
-- Run this in D1 and save output as CSV: valid-custom-fields-export.csv

SELECT 
  cf.id,
  cf.name,
  cf.slug,
  cf.organization_id,
  o.slug as org_slug,
  pt.slug as post_type_slug,
  COUNT(pfv.id) as usage_count
FROM custom_fields cf
INNER JOIN post_field_values pfv ON cf.id = pfv.custom_field_id
INNER JOIN posts p ON pfv.post_id = p.id
INNER JOIN organizations o ON p.organization_id = o.id
INNER JOIN post_types pt ON p.post_type_id = pt.id
WHERE cf.name != 'Unknown Field' AND cf.slug NOT LIKE 'unknown-field-%'
GROUP BY cf.id, cf.name, cf.slug, cf.organization_id, o.slug, pt.slug
ORDER BY o.slug, pt.slug, usage_count DESC;
