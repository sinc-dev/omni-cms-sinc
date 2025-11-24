-- Find Kazakhstan posts currently in Study in North Cyprus
SELECT 
  p.id,
  p.title,
  p.slug,
  pt.slug AS current_post_type,
  pt.organization_id AS current_org_id
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Study in North Cyprus
  AND (
    p.title LIKE '%Kazakhstan%' 
    OR p.title LIKE '%Kazakh%'
    OR p.slug LIKE '%kazakhstan%'
    OR p.slug LIKE '%kazakh%'
  )
ORDER BY p.title
LIMIT 50;

