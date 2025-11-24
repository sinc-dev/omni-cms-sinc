-- Final verification for all three organizations
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2', 'IBfLssGjH23-f9uxjH5Ms')
GROUP BY o.id, o.name
ORDER BY o.name;

