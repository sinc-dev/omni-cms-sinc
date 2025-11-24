-- Create system user for API operations
-- This user is used as the author/uploader for API-created content

INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  'system-user-api',
  'api@system.local',
  'System API User',
  0,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

