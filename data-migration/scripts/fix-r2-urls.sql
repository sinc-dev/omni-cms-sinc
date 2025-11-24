-- Fix R2 URLs in Blog Posts
-- Replaces direct R2 URLs with Workers route URLs
-- Generated: 2025-11-24
-- Workers Base URL: https://omni-cms-api.joseph-9a2.workers.dev

-- IMPORTANT: Review and test these queries before executing!
-- Backup your database first!

-- ============================================================
-- Step 1: Find posts with R2 URLs
-- ============================================================

SELECT 
  o.name as organization,
  p.id,
  p.title,
  LENGTH(p.content) - LENGTH(REPLACE(p.content, 'r2.cloudflarestorage.com', '')) as r2_url_count,
  SUBSTR(p.content, 1, 300) as content_preview
FROM posts p
JOIN organizations o ON p.organization_id = o.id
WHERE p.content LIKE '%r2.cloudflarestorage.com%'
ORDER BY r2_url_count DESC
LIMIT 20;

-- ============================================================
-- Step 2: Replace R2 URLs with Workers route URLs
-- ============================================================
-- This uses SQL REPLACE to transform URLs:
-- FROM: https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/fileKey.jpg?variant=thumbnail
-- TO:   https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/fileKey.jpg?variant=thumbnail

-- IMPORTANT: Execute these UPDATE statements one at a time and verify results!

-- Study in North Cyprus
UPDATE posts
SET content = REPLACE(
  content,
  'https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/',
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/'
)
WHERE organization_id = '3Kyv3hvrybf_YohTZRgPV'
  AND content LIKE '%r2.cloudflarestorage.com%';

-- Paris American International University
UPDATE posts
SET content = REPLACE(
  content,
  'https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/',
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/'
)
WHERE organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND content LIKE '%r2.cloudflarestorage.com%';

-- Study In Kazakhstan
UPDATE posts
SET content = REPLACE(
  content,
  'https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/',
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/'
)
WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms'
  AND content LIKE '%r2.cloudflarestorage.com%';

-- All organizations (if R2 account ID is the same for all)
-- Uncomment if you want to update all at once:
/*
UPDATE posts
SET content = REPLACE(
  content,
  'https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/',
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/'
)
WHERE content LIKE '%r2.cloudflarestorage.com%';
*/

-- ============================================================
-- Step 3: Verification - Check for remaining R2 URLs
-- ============================================================

SELECT 
  o.name as organization,
  COUNT(*) as posts_with_r2_urls,
  SUM(LENGTH(p.content) - LENGTH(REPLACE(p.content, 'r2.cloudflarestorage.com', ''))) as total_r2_urls
FROM posts p
JOIN organizations o ON p.organization_id = o.id
WHERE p.content LIKE '%r2.cloudflarestorage.com%'
GROUP BY o.id, o.name
ORDER BY total_r2_urls DESC;

-- Individual posts with remaining R2 URLs
SELECT 
  o.name as organization,
  p.id,
  p.title,
  LENGTH(p.content) - LENGTH(REPLACE(p.content, 'r2.cloudflarestorage.com', '')) as remaining_r2_urls
FROM posts p
JOIN organizations o ON p.organization_id = o.id
WHERE p.content LIKE '%r2.cloudflarestorage.com%'
ORDER BY remaining_r2_urls DESC
LIMIT 20;

-- ============================================================
-- Notes:
-- ============================================================
-- 1. The R2 account ID (9a2b6956cc47f63e13beb91af5363970) is hardcoded
--    If you have different R2 account IDs, add additional UPDATE statements
-- 2. Query parameters (like ?variant=thumbnail) are preserved automatically
-- 3. Run Step 1 first to see how many posts will be affected
-- 4. Execute Step 2 to perform the replacements
-- 5. Run Step 3 to verify all URLs were replaced

