-- Verify "World Peace University" relationships were created
-- Check programs that should be linked to "Altinbas International University (World Peace University)"

SELECT 
  pr.id AS relationship_id,
  p1.title AS program_title,
  p1.slug AS program_slug,
  p2.title AS university_title,
  p2.slug AS university_slug,
  pr.created_at
FROM post_relationships pr
JOIN posts p1 ON pr.from_post_id = p1.id
JOIN posts p2 ON pr.to_post_id = p2.id
WHERE pr.relationship_type = 'university'
  AND (
    p2.title LIKE '%World Peace%' 
    OR p2.title LIKE '%Altinbas%'
  )
ORDER BY pr.created_at DESC;

-- Count total relationships for World Peace University
SELECT 
  COUNT(*) AS total_relationships,
  p2.title AS university_title
FROM post_relationships pr
JOIN posts p2 ON pr.to_post_id = p2.id
WHERE pr.relationship_type = 'university'
  AND (
    p2.title LIKE '%World Peace%' 
    OR p2.title LIKE '%Altinbas%'
  )
GROUP BY p2.title;

