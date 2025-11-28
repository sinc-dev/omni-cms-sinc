-- Check if the field IDs from the generated SQL actually exist in custom_fields
-- Run this to see which field IDs are missing

-- Sample check for one of the field IDs from the error
SELECT 
    'Field exists' AS status,
    COUNT(*) AS count
FROM custom_fields
WHERE id IN ('53eda4e44ac60eb55560b6ce', '16b0db61f7c5226b01cf6f78', '7bc7822825bd014fcb284f42');

-- Check if post_type_id exists
SELECT 
    'Post type exists' AS status,
    COUNT(*) AS count
FROM post_types
WHERE id = 'ce1eb9313998ef3ca6ff7621';

-- Check how many field IDs from post_field_values exist in custom_fields
SELECT 
    'Total field IDs in post_field_values' AS metric,
    COUNT(DISTINCT custom_field_id) AS count
FROM post_field_values;

SELECT 
    'Field IDs that exist in custom_fields' AS metric,
    COUNT(DISTINCT pfv.custom_field_id) AS count
FROM post_field_values pfv
JOIN custom_fields cf ON pfv.custom_field_id = cf.id;

SELECT 
    'Field IDs missing from custom_fields' AS metric,
    COUNT(DISTINCT pfv.custom_field_id) AS count
FROM post_field_values pfv
LEFT JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE cf.id IS NULL;
