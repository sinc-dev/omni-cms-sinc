-- ============================================================
-- Check Post Type Breakdown for Study in North Cyprus
-- ============================================================
-- Verify what post types the 6,444 posts belong to
-- ============================================================

-- 1. Post counts by post type for Study in North Cyprus
SELECT 
  pt.name AS post_type,
  pt.slug AS post_type_slug,
  COUNT(p.id) AS post_count,
  MIN(p.created_at) AS first_post_date,
  MAX(p.created_at) AS last_post_date
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name, pt.slug
ORDER BY post_count DESC;

-- 2. Expected vs Actual comparison
-- Expected from transformed data:
--   blogs: 113
--   programs: 967
--   universities: 13
--   team-members: 14
--   reviews: 129
--   video-testimonials: 9
--   dormitories: 24
--   Total: 1,269

SELECT 
  pt.slug AS post_type_slug,
  COUNT(p.id) AS actual_count,
  CASE pt.slug
    WHEN 'blogs' THEN 113
    WHEN 'programs' THEN 967
    WHEN 'universities' THEN 13
    WHEN 'team-members' THEN 14
    WHEN 'reviews' THEN 129
    WHEN 'video-testimonials' THEN 9
    WHEN 'dormitories' THEN 24
    ELSE NULL
  END AS expected_count,
  COUNT(p.id) - CASE pt.slug
    WHEN 'blogs' THEN 113
    WHEN 'programs' THEN 967
    WHEN 'universities' THEN 13
    WHEN 'team-members' THEN 14
    WHEN 'reviews' THEN 129
    WHEN 'video-testimonials' THEN 9
    WHEN 'dormitories' THEN 24
    ELSE NULL
  END AS difference
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.slug
ORDER BY post_count DESC;

-- 3. Check if there are post types we didn't expect
SELECT 
  pt.name AS post_type,
  pt.slug AS post_type_slug,
  COUNT(p.id) AS post_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
  AND pt.slug NOT IN ('blogs', 'programs', 'universities', 'team-members', 'reviews', 'video-testimonials', 'dormitories')
GROUP BY pt.id, pt.name, pt.slug
ORDER BY post_count DESC;

-- 4. Check creation dates to see if there are old posts
SELECT 
  DATE(p.created_at, 'unixepoch') AS creation_date,
  COUNT(*) AS posts_created,
  GROUP_CONCAT(DISTINCT pt.slug) AS post_types
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY DATE(p.created_at, 'unixepoch')
ORDER BY creation_date DESC
LIMIT 30;

-- 5. Sample posts from each post type to verify they're correct
SELECT 
  pt.slug AS post_type,
  p.title,
  p.slug,
  p.created_at
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
ORDER BY pt.slug, p.created_at DESC
LIMIT 50;

