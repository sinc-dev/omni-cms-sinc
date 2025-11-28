-- Check if we can find WordPress author data in the database
-- This queries for any custom fields or metadata that might contain WordPress author information

-- Check for custom fields related to authors
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

-- Check for any post field values that might contain email addresses
SELECT 
    cf.slug,
    cf.name,
    pfv.value,
    COUNT(*) as count
FROM post_field_values pfv
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE pfv.value LIKE '%@studyinnc.com%'
   OR pfv.value LIKE '%@studyinkzk.com%'
   OR pfv.value LIKE '%@parisamerican.org%'
GROUP BY cf.id, cf.slug, cf.name, pfv.value
ORDER BY count DESC
LIMIT 20;
