-- ============================================================
-- Check Organization Import Status
-- ============================================================
-- Run these queries in Cloudflare D1 to see what's imported
-- ============================================================

-- 1. Check all organizations
SELECT 
  id,
  name,
  slug,
  created_at
FROM organizations
ORDER BY created_at DESC;

-- 2. Check posts count by organization
SELECT 
  o.name AS organization_name,
  o.slug AS organization_slug,
  pt.name AS post_type_name,
  pt.slug AS post_type_slug,
  COUNT(p.id) AS post_count
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN posts p ON p.post_type_id = pt.id
GROUP BY o.id, o.name, o.slug, pt.id, pt.name, pt.slug
ORDER BY o.name, pt.name;

-- 3. Check total posts per organization
SELECT 
  o.name AS organization_name,
  o.slug AS organization_slug,
  COUNT(p.id) AS total_posts
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN posts p ON p.post_type_id = pt.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- 4. Check relationships count per organization
SELECT 
  o.name AS organization_name,
  o.slug AS organization_slug,
  pr.relationship_type,
  COUNT(pr.id) AS relationship_count
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
JOIN posts p ON p.post_type_id = pt.id
JOIN post_relationships pr ON pr.from_post_id = p.id
GROUP BY o.id, o.name, o.slug, pr.relationship_type
ORDER BY o.name, pr.relationship_type;

-- 5. Check media count per organization
SELECT 
  o.name AS organization_name,
  o.slug AS organization_slug,
  COUNT(m.id) AS media_count
FROM organizations o
LEFT JOIN media m ON m.organization_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- 6. Check taxonomies count per organization
SELECT 
  o.name AS organization_name,
  o.slug AS organization_slug,
  COUNT(t.id) AS taxonomy_count
FROM organizations o
LEFT JOIN taxonomies t ON t.organization_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- 7. Check custom fields count per organization
SELECT 
  o.name AS organization_name,
  o.slug AS organization_slug,
  COUNT(cf.id) AS custom_field_count
FROM organizations o
LEFT JOIN custom_fields cf ON cf.organization_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- 8. Detailed breakdown for Study In Kazakhstan (org ID: IBfLssGjH23-f9uxjH5Ms)
SELECT 
  'Study In Kazakhstan' AS organization,
  pt.name AS post_type,
  COUNT(p.id) AS post_count
FROM post_types pt
JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = 'IBfLssGjH23-f9uxjH5Ms'
GROUP BY pt.id, pt.name
ORDER BY pt.name;

-- 9. Detailed breakdown for Paris American International University (org ID: ND-k8iHHx70s5XaW28Mk2)
SELECT 
  'Paris American International University' AS organization,
  pt.name AS post_type,
  COUNT(p.id) AS post_count
FROM post_types pt
JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
GROUP BY pt.id, pt.name
ORDER BY pt.name;

-- 10. Detailed breakdown for Study in North Cyprus (org ID: 3Kyv3hvrybf_YohTZRgPV)
SELECT 
  'Study in North Cyprus' AS organization,
  pt.name AS post_type,
  COUNT(p.id) AS post_count
FROM post_types pt
JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name
ORDER BY pt.name;

-- 11. Summary table for all organizations
SELECT 
  o.id AS org_id,
  o.name AS org_name,
  o.slug AS org_slug,
  (SELECT COUNT(*) FROM post_types WHERE organization_id = o.id) AS post_types,
  (SELECT COUNT(*) FROM posts p JOIN post_types pt ON p.post_type_id = pt.id WHERE pt.organization_id = o.id) AS posts,
  (SELECT COUNT(*) FROM taxonomies WHERE organization_id = o.id) AS taxonomies,
  (SELECT COUNT(*) FROM custom_fields WHERE organization_id = o.id) AS custom_fields,
  (SELECT COUNT(*) FROM media WHERE organization_id = o.id) AS media,
  (SELECT COUNT(*) FROM post_relationships pr 
   JOIN posts p ON pr.from_post_id = p.id 
   JOIN post_types pt ON p.post_type_id = pt.id 
   WHERE pt.organization_id = o.id) AS relationships
FROM organizations o
ORDER BY o.name;

