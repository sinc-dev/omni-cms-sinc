-- ============================================================================
-- Cleanup Unknown Fields (Direct SQL)
-- Deletes all "unknown-field-*" custom fields that are no longer referenced
-- in post_field_values after the mapping update.
-- ============================================================================
-- Note: D1 executes each statement atomically, no transaction needed

-- Delete unknown fields that are not referenced in post_field_values
DELETE FROM custom_fields
WHERE (name = 'Unknown Field' OR slug LIKE 'unknown-field-%')
  AND id NOT IN (
    SELECT DISTINCT custom_field_id 
    FROM post_field_values 
    WHERE custom_field_id IS NOT NULL
  );

-- Also delete from post_type_fields if any references exist
DELETE FROM post_type_fields
WHERE custom_field_id NOT IN (
  SELECT id FROM custom_fields
);
