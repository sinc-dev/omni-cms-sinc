-- ============================================================
-- Find Posts Assigned to Wrong Organization
-- ============================================================
-- Identify posts that belong to other organizations but are under Study in North Cyprus
-- ============================================================

-- 1. Check for posts about Kazakhstan (should be under Study In Kazakhstan)
SELECT 
  'Kazakhstan posts in North Cyprus' AS issue,
  COUNT(*) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Study in North Cyprus
  AND (
    p.title LIKE '%Kazakhstan%' 
    OR p.title LIKE '%Kazakh%'
    OR p.slug LIKE '%kazakhstan%'
    OR p.slug LIKE '%kazakh%'
  );

-- 2. Check for posts about Paris American (should be under Paris American)
SELECT 
  'Paris American posts in North Cyprus' AS issue,
  COUNT(*) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Study in North Cyprus
  AND (
    p.title LIKE '%Paris American%' 
    OR p.title LIKE '%PAIU%'
    OR p.slug LIKE '%paris-american%'
    OR p.slug LIKE '%paiu%'
  );

-- 3. Check for academic-staff post type (should be under Paris American, not North Cyprus)
SELECT 
  'Academic staff posts in North Cyprus' AS issue,
  COUNT(*) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Study in North Cyprus
  AND pt.slug = 'academic-staff';

-- 4. List all post types in Study in North Cyprus (to see unexpected ones)
SELECT 
  pt.name AS post_type,
  pt.slug AS post_type_slug,
  COUNT(p.id) AS post_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
GROUP BY pt.id, pt.name, pt.slug
ORDER BY post_count DESC;

-- 5. Sample posts that might be in wrong organization
SELECT 
  pt.slug AS post_type,
  p.title,
  p.slug,
  CASE 
    WHEN p.title LIKE '%Kazakhstan%' OR p.title LIKE '%Kazakh%' THEN 'Should be Study In Kazakhstan'
    WHEN p.title LIKE '%Paris American%' OR p.title LIKE '%PAIU%' THEN 'Should be Paris American'
    WHEN pt.slug = 'academic-staff' THEN 'Should be Paris American'
    ELSE 'Check manually'
  END AS likely_correct_org
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
  AND (
    p.title LIKE '%Kazakhstan%' 
    OR p.title LIKE '%Kazakh%'
    OR p.title LIKE '%Paris American%'
    OR p.title LIKE '%PAIU%'
    OR pt.slug = 'academic-staff'
  )
ORDER BY pt.slug, p.created_at DESC
LIMIT 50;

-- 6. Check what post types exist for each organization
SELECT 
  o.name AS organization,
  pt.slug AS post_type_slug,
  COUNT(p.id) AS post_count
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN posts p ON p.post_type_id = pt.id
GROUP BY o.id, o.name, pt.id, pt.slug
ORDER BY o.name, post_count DESC;

-- 7. Find posts that should be moved to Study In Kazakhstan
SELECT 
  p.id,
  p.title,
  p.slug,
  pt.slug AS current_post_type,
  'IBfLssGjH23-f9uxjH5Ms' AS correct_org_id,
  'Study In Kazakhstan' AS correct_org_name
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Currently in North Cyprus
  AND (
    p.title LIKE '%Kazakhstan%' 
    OR p.title LIKE '%Kazakh%'
    OR p.slug LIKE '%kazakhstan%'
    OR p.slug LIKE '%kazakh%'
  )
LIMIT 100;

-- 8. Find posts that should be moved to Paris American
SELECT 
  p.id,
  p.title,
  p.slug,
  pt.slug AS current_post_type,
  'ND-k8iHHx70s5XaW28Mk2' AS correct_org_id,
  'Paris American International University' AS correct_org_name
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Currently in North Cyprus
  AND (
    p.title LIKE '%Paris American%' 
    OR p.title LIKE '%PAIU%'
    OR p.slug LIKE '%paris-american%'
    OR p.slug LIKE '%paiu%'
    OR pt.slug = 'academic-staff'
  )
LIMIT 100;

