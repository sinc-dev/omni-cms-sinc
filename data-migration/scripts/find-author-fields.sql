-- Find custom fields that might contain author/email information
SELECT 
    cf.slug,
    cf.name,
    COUNT(DISTINCT pfv.post_id) as posts_with_field
FROM custom_fields cf
JOIN post_field_values pfv ON cf.id = pfv.custom_field_id
WHERE cf.slug LIKE '%author%' 
   OR cf.name LIKE '%author%'
   OR cf.slug LIKE '%user%'
   OR cf.name LIKE '%user%'
GROUP BY cf.id, cf.slug, cf.name
ORDER BY posts_with_field DESC
LIMIT 20;
