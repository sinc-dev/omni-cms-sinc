-- ============================================================
-- Fix Study in Kazakhstan Posts
-- ============================================================
-- Move Kazakhstan posts from Study in North Cyprus to Study in Kazakhstan
-- ============================================================

-- Step 1: Check what post types Study in Kazakhstan has
SELECT 
  pt.id,
  pt.slug,
  pt.organization_id,
  o.name AS org_name,
  COUNT(p.id) AS post_count
FROM post_types pt
JOIN organizations o ON pt.organization_id = o.id
LEFT JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = 'IBfLssGjH23-f9uxjH5Ms'  -- Study in Kazakhstan
GROUP BY pt.id, pt.slug, pt.organization_id, o.name
ORDER BY pt.slug;

-- Step 2: Check what post types North Cyprus has (to copy structure)
SELECT DISTINCT pt.slug
FROM post_types pt
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
ORDER BY pt.slug;

-- Step 3: Create post types for Study in Kazakhstan (based on what North Cyprus has)
-- We'll create: blogs, programs, universities, team-members, reviews, video-testimonials, dormitories
INSERT OR IGNORE INTO post_types (id, organization_id, name, slug, description, created_at, updated_at)
SELECT 
  lower(hex(randomblob(12))) AS id,
  'IBfLssGjH23-f9uxjH5Ms' AS organization_id,
  CASE pt.slug
    WHEN 'blogs' THEN 'Blog'
    WHEN 'programs' THEN 'Program'
    WHEN 'universities' THEN 'University'
    WHEN 'team-members' THEN 'Team Member'
    WHEN 'reviews' THEN 'Review'
    WHEN 'video-testimonials' THEN 'Video Testimonial'
    WHEN 'dormitories' THEN 'Dormitory'
    ELSE pt.name
  END AS name,
  pt.slug,
  NULL AS description,
  strftime('%s', 'now') AS created_at,
  strftime('%s', 'now') AS updated_at
FROM post_types pt
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
  AND pt.slug IN ('blogs', 'programs', 'universities', 'team-members', 'reviews', 'video-testimonials', 'dormitories')
  AND NOT EXISTS (
    SELECT 1 FROM post_types pt2 
    WHERE pt2.organization_id = 'IBfLssGjH23-f9uxjH5Ms' 
      AND pt2.slug = pt.slug
  );

-- Step 4: Find Kazakhstan blog posts to move
-- Get post IDs for Kazakhstan blog posts
SELECT 
  p.id,
  p.title,
  'blogs' AS target_post_type
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Currently in North Cyprus
  AND pt.slug = 'blogs'
  AND (
    p.title LIKE '%Kazakhstan%' 
    OR p.title LIKE '%Kazakh%'
    OR p.slug LIKE '%kazakhstan%'
    OR p.slug LIKE '%kazakh%'
  )
LIMIT 100;

-- Step 5: Update blog posts to Study in Kazakhstan
UPDATE posts
SET post_type_id = (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = 'IBfLssGjH23-f9uxjH5Ms'
    AND pt.slug = 'blogs'
  LIMIT 1
)
WHERE id IN (
  SELECT p.id
  FROM posts p
  JOIN post_types pt ON p.post_type_id = pt.id
  WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
    AND pt.slug = 'blogs'
    AND (
      p.title LIKE '%Kazakhstan%' 
      OR p.title LIKE '%Kazakh%'
      OR p.slug LIKE '%kazakhstan%'
      OR p.slug LIKE '%kazakh%'
    )
)
AND EXISTS (
  SELECT 1 FROM post_types pt 
  WHERE pt.organization_id = 'IBfLssGjH23-f9uxjH5Ms' 
    AND pt.slug = 'blogs'
);

-- Step 6: Verify the move
SELECT 
  o.name AS organization,
  pt.slug AS post_type,
  COUNT(p.id) AS post_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE p.id IN (
  SELECT p.id
  FROM posts p
  JOIN post_types pt ON p.post_type_id = pt.id
  WHERE pt.organization_id IN ('3Kyv3hvrybf_YohTZRgPV', 'IBfLssGjH23-f9uxjH5Ms')
    AND (
      p.title LIKE '%Kazakhstan%' 
      OR p.title LIKE '%Kazakh%'
      OR p.slug LIKE '%kazakhstan%'
      OR p.slug LIKE '%kazakh%'
    )
)
GROUP BY o.id, o.name, pt.id, pt.slug
ORDER BY o.name, pt.slug;

-- Step 7: Final count check
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'IBfLssGjH23-f9uxjH5Ms')
GROUP BY o.id, o.name
ORDER BY o.name;

