-- ============================================================
-- Verify Organization Data Isolation
-- ============================================================
-- Check if posts are correctly isolated by organization
-- ============================================================

-- 1. Check if there are posts without proper organization linkage
SELECT 
  'Posts without organization' AS issue,
  COUNT(*) AS count
FROM posts p
LEFT JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.id IS NULL;

-- 2. Check post counts by organization (detailed)
SELECT 
  o.id AS org_id,
  o.name AS org_name,
  o.slug AS org_slug,
  pt.id AS post_type_id,
  pt.name AS post_type_name,
  COUNT(p.id) AS post_count
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN posts p ON p.post_type_id = pt.id
GROUP BY o.id, o.name, o.slug, pt.id, pt.name
ORDER BY o.name, pt.name;

-- 3. Check for Study in North Cyprus specifically
-- Should show only posts that belong to this organization
SELECT 
  pt.name AS post_type,
  COUNT(p.id) AS post_count,
  MIN(p.created_at) AS first_post,
  MAX(p.created_at) AS last_post
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name
ORDER BY pt.name;

-- 4. Check total posts for Study in North Cyprus
SELECT 
  COUNT(*) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV';

-- 5. Check if there are duplicate posts (same slug, same post type)
SELECT 
  pt.name AS post_type,
  p.slug,
  COUNT(*) AS duplicate_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name, p.slug
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- 6. Check post creation dates to see if there's a pattern
SELECT 
  DATE(p.created_at, 'unixepoch') AS creation_date,
  COUNT(*) AS posts_created
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY DATE(p.created_at, 'unixepoch')
ORDER BY creation_date DESC
LIMIT 30;

-- 7. Check if posts from other organizations are leaking
SELECT 
  o.name AS organization_name,
  o.slug AS organization_slug,
  COUNT(DISTINCT pt.id) AS post_types,
  COUNT(p.id) AS posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- 8. Sample posts from Study in North Cyprus to verify they belong
SELECT 
  p.id,
  p.title,
  p.slug,
  pt.name AS post_type,
  p.created_at
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
ORDER BY p.created_at DESC
LIMIT 20;

-- 9. Check relationships count for Study in North Cyprus
SELECT 
  COUNT(*) AS total_relationships
FROM post_relationships pr
JOIN posts p ON pr.from_post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV';

-- 10. Check media count for Study in North Cyprus
SELECT 
  COUNT(*) AS total_media
FROM media m
WHERE m.organization_id = '3Kyv3hvrybf_YohTZRgPV';

