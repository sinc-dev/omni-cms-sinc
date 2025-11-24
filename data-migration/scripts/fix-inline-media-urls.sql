-- Fix Inline Media URLs in Blog Posts
-- Replaces WordPress URLs with Workers route URLs
-- Generated: 2025-11-24T19:10:47.589Z
-- Workers Base URL: https://omni-cms-api.joseph-9a2.workers.dev

-- Before running, backup your database!
-- Review all UPDATE statements carefully

-- ============================================================
-- Summary
-- ============================================================
-- Total posts updated: 0
-- Total URL replacements: 0

-- Verification: Check for remaining WordPress URLs
SELECT id, title, content
FROM posts
WHERE content LIKE '%wp-content/uploads/%'
ORDER BY id;
