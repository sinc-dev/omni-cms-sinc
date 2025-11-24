-- Step 1: Check if Paris American post types exist
SELECT 
  pt.id,
  pt.slug,
  pt.organization_id,
  o.name AS org_name
FROM post_types pt
JOIN organizations o ON pt.organization_id = o.id
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug IN ('blogs', 'academic-staff')
ORDER BY pt.slug;

