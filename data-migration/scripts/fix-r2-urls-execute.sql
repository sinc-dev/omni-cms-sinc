-- Fix R2 URLs in Blog Posts - EXECUTE THIS FILE
-- Replaces direct R2 URLs with Workers route URLs
-- Generated: 2025-11-24
-- Workers Base URL: https://omni-cms-api.joseph-9a2.workers.dev

-- ============================================================
-- IMPORTANT: BACKUP YOUR DATABASE BEFORE RUNNING THIS!
-- ============================================================

-- Replace R2 URLs with Workers route URLs for all organizations
-- This replaces: https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/
-- With:          https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/

UPDATE posts
SET content = REPLACE(
  content,
  'https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/',
  'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/'
)
WHERE content LIKE '%r2.cloudflarestorage.com%';

-- Verification query (run after UPDATE to check results)
-- SELECT 
--   o.name as organization,
--   COUNT(*) as posts_with_r2_urls,
--   SUM(LENGTH(p.content) - LENGTH(REPLACE(p.content, 'r2.cloudflarestorage.com', ''))) as total_r2_urls
-- FROM posts p
-- JOIN organizations o ON p.organization_id = o.id
-- WHERE p.content LIKE '%r2.cloudflarestorage.com%'
-- GROUP BY o.id, o.name
-- ORDER BY total_r2_urls DESC;

