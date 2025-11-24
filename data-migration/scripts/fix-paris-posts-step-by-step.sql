-- ============================================================
-- Fix Paris American Posts - Step by Step Debugging
-- ============================================================
-- Let's debug why UPDATE isn't working
-- ============================================================

-- Step 1: Check current state - where are the posts now?
SELECT 
  p.id,
  p.title,
  p.post_type_id AS current_post_type_id,
  pt.slug AS current_post_type_slug,
  pt.organization_id AS current_org_id,
  o.name AS current_org_name
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE p.id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i'
)
ORDER BY p.id;

-- Step 2: Check if Paris American post types exist
SELECT 
  'Paris American Post Types' AS check_type,
  pt.id,
  pt.slug,
  pt.organization_id,
  o.name AS org_name
FROM post_types pt
JOIN organizations o ON pt.organization_id = o.id
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug IN ('blogs', 'academic-staff')
ORDER BY pt.slug;

-- Step 3: Get the exact post type IDs we need
-- Paris American blog post type ID
SELECT 
  pt.id AS paris_blog_post_type_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug = 'blogs';

-- Paris American academic-staff post type ID  
SELECT 
  pt.id AS paris_academic_staff_post_type_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug = 'academic-staff';

-- Step 4: Test UPDATE on ONE post first
-- Replace 'REPLACE_WITH_PARIS_BLOG_POST_TYPE_ID' with the ID from Step 3
-- First, let's see what the current post_type_id is for one blog post
SELECT 
  p.id,
  p.post_type_id AS current_id,
  'Will update to Paris American blog post type' AS action
FROM posts p
WHERE p.id = 't8Q-ZKFanC3t06KABtM41';

-- Step 5: Manual UPDATE for one post (replace with actual ID from Step 3)
-- Example: UPDATE posts SET post_type_id = 'actual-id-here' WHERE id = 't8Q-ZKFanC3t06KABtM41';
-- Run this manually after getting the ID from Step 3

-- Step 6: If Step 5 works, update all blog posts
-- Replace 'REPLACE_WITH_PARIS_BLOG_POST_TYPE_ID' with actual ID
UPDATE posts
SET post_type_id = 'REPLACE_WITH_PARIS_BLOG_POST_TYPE_ID'
WHERE id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i', 'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr', 'H20Mk7QghpkTod2LteRd9', 'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62', 'piHn518vACfFg8mAnIWUk', 'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7', 'WqetMlba0vyhUMUL-XG-A', 'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7', 'AM2L2z2cZ7eChe6KdE04n', 'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix'
);

-- Step 7: Update all academic-staff posts
-- Replace 'REPLACE_WITH_PARIS_ACADEMIC_STAFF_POST_TYPE_ID' with actual ID
UPDATE posts
SET post_type_id = 'REPLACE_WITH_PARIS_ACADEMIC_STAFF_POST_TYPE_ID'
WHERE id IN (
  'DLr02lPqQ3BeXhzSqtmMZ', 'rgcCeWNb6yewFcjGjVbBV', 'UHVesc7LzBIbKgxP4OvPg',
  'Vkh3RiQkkl7_OJCOhqNaA', 'J3GKUoenYB4Zt3_7oodAt', 'KK2y7XA7G4ba2x6Wvw4um',
  'G5tzW0ISig0y1dw7EipwI', 'W8pbn5bfNVuaSDyQFTyBi', 'gTac1bV3UwfmKz7mbgMLt',
  'z6K8EqIjwazvyzZZx6YHB'
);

-- Step 8: Verify after update
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2')
GROUP BY o.id, o.name
ORDER BY o.name;

