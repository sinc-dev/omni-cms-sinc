-- Fix Inline Media URLs in Blog Posts
-- Replaces WordPress URLs with Workers route URLs
-- Generated: 2025-11-24
-- Workers Base URL: https://omni-cms-api.joseph-9a2.workers.dev

-- IMPORTANT: This SQL file provides queries to identify posts with WordPress URLs
-- To generate actual UPDATE statements, you need to:
-- 1. Run the queries below to get post IDs and content
-- 2. Match WordPress filenames to media.file_key records
-- 3. Generate UPDATE statements using the fix-inline-media-urls.js script

-- ============================================================
-- Step 1: Find posts with WordPress URLs
-- ============================================================

-- Study in North Cyprus
SELECT 
  id,
  title,
  LENGTH(content) - LENGTH(REPLACE(content, 'r2.cloudflarestorage.com', '')) as r2_url_count,
  LENGTH(content) - LENGTH(REPLACE(content, 'wp-content/uploads/', '')) as wp_url_count,
  SUBSTR(content, 1, 200) as content_preview
FROM posts
WHERE organization_id = '3Kyv3hvrybf_YohTZRgPV'
  AND (content LIKE '%r2.cloudflarestorage.com%' OR content LIKE '%wp-content/uploads/%')
ORDER BY (r2_url_count + wp_url_count) DESC;

-- Paris American International University
SELECT 
  id,
  title,
  LENGTH(content) - LENGTH(REPLACE(content, 'r2.cloudflarestorage.com', '')) as r2_url_count,
  LENGTH(content) - LENGTH(REPLACE(content, 'wp-content/uploads/', '')) as wp_url_count,
  SUBSTR(content, 1, 200) as content_preview
FROM posts
WHERE organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND (content LIKE '%r2.cloudflarestorage.com%' OR content LIKE '%wp-content/uploads/%')
ORDER BY (r2_url_count + wp_url_count) DESC;

-- Study In Kazakhstan
SELECT 
  id,
  title,
  LENGTH(content) - LENGTH(REPLACE(content, 'r2.cloudflarestorage.com', '')) as r2_url_count,
  LENGTH(content) - LENGTH(REPLACE(content, 'wp-content/uploads/', '')) as wp_url_count,
  SUBSTR(content, 1, 200) as content_preview
FROM posts
WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms'
  AND (content LIKE '%r2.cloudflarestorage.com%' OR content LIKE '%wp-content/uploads/%')
ORDER BY (r2_url_count + wp_url_count) DESC;

-- ============================================================
-- Step 2: Find media records by filename pattern
-- ============================================================

-- Example: Find media for a specific filename
-- Replace 'filename.jpg' with actual filename from WordPress URL
/*
SELECT id, file_key, filename
FROM media
WHERE organization_id = '3Kyv3hvrybf_YohTZRgPV'
  AND filename LIKE '%filename.jpg%';
*/

-- ============================================================
-- Step 3: Generate UPDATE statements
-- ============================================================

-- Template UPDATE statement (replace values as needed):
/*
UPDATE posts 
SET content = REPLACE(
  content,
  'https://studyinnc.com/wp-content/uploads/old-filename.jpg',
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/NEW_FILE_KEY'
)
WHERE id = 'POST_ID';
*/

-- ============================================================
-- Step 4: Verification - Check for remaining WordPress URLs
-- ============================================================

SELECT 
  o.name as organization,
  COUNT(*) as posts_with_media_urls,
  SUM(LENGTH(p.content) - LENGTH(REPLACE(p.content, 'r2.cloudflarestorage.com', ''))) as r2_urls,
  SUM(LENGTH(p.content) - LENGTH(REPLACE(p.content, 'wp-content/uploads/', ''))) as wp_urls
FROM posts p
JOIN organizations o ON p.organization_id = o.id
WHERE p.content LIKE '%r2.cloudflarestorage.com%' OR p.content LIKE '%wp-content/uploads/%'
GROUP BY o.id, o.name
ORDER BY (r2_urls + wp_urls) DESC;

-- Individual posts with WordPress URLs (after updates)
SELECT 
  o.name as organization,
  p.id,
  p.title,
  LENGTH(p.content) - LENGTH(REPLACE(p.content, 'r2.cloudflarestorage.com', '')) as remaining_r2_urls,
  LENGTH(p.content) - LENGTH(REPLACE(p.content, 'wp-content/uploads/', '')) as remaining_wp_urls
FROM posts p
JOIN organizations o ON p.organization_id = o.id
WHERE p.content LIKE '%r2.cloudflarestorage.com%' OR p.content LIKE '%wp-content/uploads/%'
ORDER BY (remaining_r2_urls + remaining_wp_urls) DESC;

-- ============================================================
-- Instructions:
-- ============================================================
-- 1. Run the queries in Step 1 to see which posts have WordPress URLs
-- 2. For each post, extract the WordPress URLs from the content
-- 3. Match filenames to media records using Step 2 queries
-- 4. Use the fix-inline-media-urls.js script to generate UPDATE statements:
--    node fix-inline-media-urls.js
-- 5. Review the generated SQL file before executing
-- 6. Execute: npx wrangler d1 execute omni-cms --remote --file=fix-inline-media-urls.sql
-- 7. Verify with Step 4 queries

