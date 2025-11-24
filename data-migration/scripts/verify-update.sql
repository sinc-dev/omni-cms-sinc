-- Verify posts are still in North Cyprus
SELECT o.name AS organization, COUNT(p.id) AS post_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE p.id IN ('t8Q-ZKFanC3t06KABtM41', 'DLr02lPqQ3BeXhzSqtmMZ')
GROUP BY o.id, o.name;

