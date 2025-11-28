-- Attach Featured Image Field to Paris American Programs
-- This allows mapping media placeholders to the featured field

INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT 
  lower(hex(randomblob(12))) as id,
  'ce1eb9313998ef3ca6ff7621' as post_type_id,
  '35d1a3209e50ff543c4c2aae' as custom_field_id,
  0 as is_required,
  0 as "order",
  CAST(strftime('%s', 'now') AS INTEGER) as created_at
WHERE NOT EXISTS (
  SELECT 1 FROM post_type_fields 
  WHERE post_type_id = 'ce1eb9313998ef3ca6ff7621' 
    AND custom_field_id = '35d1a3209e50ff543c4c2aae'
);
