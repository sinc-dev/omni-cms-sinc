-- Create post types for Paris American if they don't exist
INSERT OR IGNORE INTO post_types (id, organization_id, name, slug, description, created_at, updated_at)
SELECT lower(hex(randomblob(12))), 'ND-k8iHHx70s5XaW28Mk2', 'Blog', 'blogs', NULL, strftime('%s', 'now'), strftime('%s', 'now')
WHERE NOT EXISTS (SELECT 1 FROM post_types WHERE organization_id = 'ND-k8iHHx70s5XaW28Mk2' AND slug = 'blogs');

INSERT OR IGNORE INTO post_types (id, organization_id, name, slug, description, created_at, updated_at)
SELECT lower(hex(randomblob(12))), 'ND-k8iHHx70s5XaW28Mk2', 'Academic Staff', 'academic-staff', NULL, strftime('%s', 'now'), strftime('%s', 'now')
WHERE NOT EXISTS (SELECT 1 FROM post_types WHERE organization_id = 'ND-k8iHHx70s5XaW28Mk2' AND slug = 'academic-staff');

