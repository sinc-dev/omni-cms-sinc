-- Analyze the missing field IDs to understand the scope

-- Count unique missing field IDs
SELECT 
    'Unique missing field IDs' AS metric,
    COUNT(DISTINCT pfv.custom_field_id) AS count
FROM post_field_values pfv
LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE cf.id IS NULL;

-- Sample of missing field IDs with their usage count
SELECT 
    pfv.custom_field_id AS missing_field_id,
    COUNT(*) AS usage_count,
    COUNT(DISTINCT p.post_type_id) AS post_types_using_it,
    COUNT(DISTINCT p.organization_id) AS orgs_using_it
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE cf.id IS NULL
GROUP BY pfv.custom_field_id
ORDER BY usage_count DESC
LIMIT 20;

-- Check if any of the missing field IDs match custom field IDs by looking at patterns
-- (This might help identify if they're just different ID formats)
SELECT 
    'Pattern analysis' AS analysis,
    COUNT(DISTINCT pfv.custom_field_id) AS missing_ids,
    MIN(LENGTH(pfv.custom_field_id)) AS min_length,
    MAX(LENGTH(pfv.custom_field_id)) AS max_length
FROM post_field_values pfv
LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE cf.id IS NULL;

-- Check how many field IDs DO exist
SELECT 
    'Field IDs that exist' AS metric,
    COUNT(DISTINCT pfv.custom_field_id) AS count
FROM post_field_values pfv
JOIN custom_fields cf ON pfv.custom_field_id = cf.id;
