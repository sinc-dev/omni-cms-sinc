-- ============================================================
-- Diagnose Organization Data Issues
-- ============================================================
-- Check what's actually in the database vs what we imported
-- ============================================================

-- 1. Check all organizations and their IDs
SELECT 
  id,
  name,
  slug,
  created_at
FROM organizations
ORDER BY name;

-- 2. Check post types for Study in North Cyprus
SELECT 
  pt.id,
  pt.name,
  pt.slug,
  pt.organization_id,
  COUNT(p.id) AS post_count
FROM post_types pt
LEFT JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name, pt.slug, pt.organization_id
ORDER BY pt.name;

-- 3. Check if there are posts from other organizations mixed in
-- This should return 0 if data isolation is correct
SELECT 
  'Posts with wrong organization' AS issue,
  COUNT(*) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id != '3Kyv3hvrybf_YohTZRgPV'
  AND EXISTS (
    SELECT 1 FROM post_types pt2 
    WHERE pt2.organization_id = '3Kyv3hvrybf_YohTZRgPV' 
    AND pt2.slug = pt.slug
  );

-- 4. Check post counts by post type for Study in North Cyprus
SELECT 
  pt.name AS post_type,
  COUNT(p.id) AS post_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name
ORDER BY post_count DESC;

-- 5. Check if there are duplicate slugs (should be unique per post type)
SELECT 
  pt.name AS post_type,
  p.slug,
  COUNT(*) AS count,
  GROUP_CONCAT(p.id) AS post_ids
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name, p.slug
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;

-- 6. Check when posts were created (to see if there are old posts)
SELECT 
  DATE(p.created_at, 'unixepoch') AS date,
  COUNT(*) AS posts_created
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY DATE(p.created_at, 'unixepoch')
ORDER BY date DESC;

-- 7. Sample recent posts to verify they belong to Study in North Cyprus
SELECT 
  p.id,
  p.title,
  p.slug,
  pt.name AS post_type,
  pt.organization_id,
  p.created_at
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
ORDER BY p.created_at DESC
LIMIT 30;

-- 8. Check if Paris American has any post types (should have 5)
SELECT 
  pt.id,
  pt.name,
  pt.slug,
  COUNT(p.id) AS post_count
FROM post_types pt
LEFT JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
GROUP BY pt.id, pt.name, pt.slug
ORDER BY pt.name;

-- 9. Check if Study in Kazakhstan has any post types
SELECT 
  pt.id,
  pt.name,
  pt.slug,
  COUNT(p.id) AS post_count
FROM post_types pt
LEFT JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = 'IBfLssGjH23-f9uxjH5Ms'
GROUP BY pt.id, pt.name, pt.slug
ORDER BY pt.name;

-- 10. Check total unique posts vs total posts (to detect duplicates)
SELECT 
  'Total posts' AS metric,
  COUNT(*) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
UNION ALL
SELECT 
  'Unique slugs' AS metric,
  COUNT(DISTINCT p.slug) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV';

