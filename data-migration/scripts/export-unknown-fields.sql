-- Export Unknown Fields Data
-- Run this in D1 and save output as CSV: unknown-fields-export.csv

SELECT 
  pfv.id as value_id,
  pfv.post_id,
  pfv.custom_field_id as unknown_field_id,
  pfv.value,
  p.id as post_id,
  o.slug as org_slug,
  o.id as org_id,
  pt.slug as post_type_slug,
  pt.id as post_type_id,
  cf.slug as unknown_field_slug
FROM post_field_values pfv
INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
INNER JOIN posts p ON pfv.post_id = p.id
INNER JOIN organizations o ON p.organization_id = o.id
INNER JOIN post_types pt ON p.post_type_id = pt.id
WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%'
ORDER BY o.slug, pt.slug, p.id;
