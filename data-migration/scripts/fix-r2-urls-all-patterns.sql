-- Fix R2 URLs in Blog Posts - Handles Multiple R2 Account IDs
-- Replaces direct R2 URLs with Workers route URLs
-- Generated: 2025-11-24
-- Workers Base URL: https://omni-cms-api.joseph-9a2.workers.dev

-- ============================================================
-- IMPORTANT: BACKUP YOUR DATABASE BEFORE RUNNING THIS!
-- ============================================================

-- This SQL replaces ANY R2 URL pattern with Workers route URLs
-- Pattern: https://[ACCOUNT_ID].r2.cloudflarestorage.com/[fileKey]
-- With:    https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/[fileKey]

-- Step 1: Replace R2 URLs using regex-like pattern matching
-- SQLite doesn't have regex, so we use multiple REPLACE statements for common patterns

-- Replace the specific R2 account ID you mentioned
UPDATE posts
SET content = REPLACE(
  content,
  'https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/',
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/'
)
WHERE content LIKE '%9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com%';

-- If you have other R2 account IDs, add similar UPDATE statements here
-- Example:
-- UPDATE posts
-- SET content = REPLACE(
--   content,
--   'https://OTHER_ACCOUNT_ID.r2.cloudflarestorage.com/',
--   'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/'
-- )
-- WHERE content LIKE '%OTHER_ACCOUNT_ID.r2.cloudflarestorage.com%';

-- Verification: Check for remaining R2 URLs
SELECT 
  COUNT(*) as posts_with_r2_urls
FROM posts
WHERE content LIKE '%r2.cloudflarestorage.com%';

-- Sample posts with R2 URLs (if any remain)
SELECT 
  id,
  title,
  SUBSTR(content, INSTR(content, 'r2.cloudflarestorage.com') - 30, 150) as url_sample
FROM posts
WHERE content LIKE '%r2.cloudflarestorage.com%'
LIMIT 5;

