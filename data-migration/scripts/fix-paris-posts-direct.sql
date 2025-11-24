-- ============================================================
-- Fix Paris American Posts - Direct Approach
-- ============================================================
-- Get post type IDs first, then update directly
-- ============================================================

-- Step 1: Create post types for Paris American (if they don't exist)
INSERT OR IGNORE INTO post_types (id, organization_id, name, slug, description, created_at, updated_at)
VALUES 
  (lower(hex(randomblob(12))), 'ND-k8iHHx70s5XaW28Mk2', 'Blog', 'blogs', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
  (lower(hex(randomblob(12))), 'ND-k8iHHx70s5XaW28Mk2', 'Academic Staff', 'academic-staff', NULL, strftime('%s', 'now'), strftime('%s', 'now'));

-- Step 2: Get the post type IDs we just created/verified
SELECT 
  'Paris American Blog Post Type ID' AS info,
  pt.id AS post_type_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug = 'blogs'
LIMIT 1;

SELECT 
  'Paris American Academic Staff Post Type ID' AS info,
  pt.id AS post_type_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug = 'academic-staff'
LIMIT 1;

-- Step 3: Update blog posts - Replace 'REPLACE_WITH_BLOG_POST_TYPE_ID' with the ID from Step 2
-- First, let's see what post_type_id these posts currently have
SELECT 
  p.id,
  p.title,
  p.post_type_id AS current_post_type_id,
  pt.slug AS current_post_type_slug,
  pt.organization_id AS current_org_id
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i', 'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr', 'H20Mk7QghpkTod2LteRd9', 'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62', 'piHn518vACfFg8mAnIWUk', 'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7', 'WqetMlba0vyhUMUL-XG-A', 'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7', 'AM2L2z2cZ7eChe6KdE04n', 'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix'
);

-- Step 4: Update blog posts using a variable approach
-- We'll use a CTE to get the target post_type_id, then update
WITH target_post_type AS (
  SELECT pt.id AS target_id
  FROM post_types pt
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
    AND pt.slug = 'blogs'
  LIMIT 1
)
UPDATE posts
SET post_type_id = (SELECT target_id FROM target_post_type)
WHERE id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i', 'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr', 'H20Mk7QghpkTod2LteRd9', 'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62', 'piHn518vACfFg8mAnIWUk', 'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7', 'WqetMlba0vyhUMUL-XG-A', 'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7', 'AM2L2z2cZ7eChe6KdE04n', 'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix'
)
AND EXISTS (SELECT 1 FROM target_post_type);

-- Step 5: Update academic-staff posts using CTE
WITH target_post_type AS (
  SELECT pt.id AS target_id
  FROM post_types pt
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
    AND pt.slug = 'academic-staff'
  LIMIT 1
)
UPDATE posts
SET post_type_id = (SELECT target_id FROM target_post_type)
WHERE id IN (
  'DLr02lPqQ3BeXhzSqtmMZ', 'rgcCeWNb6yewFcjGjVbBV', 'UHVesc7LzBIbKgxP4OvPg',
  'Vkh3RiQkkl7_OJCOhqNaA', 'J3GKUoenYB4Zt3_7oodAt', 'KK2y7XA7G4ba2x6Wvw4um',
  'G5tzW0ISig0y1dw7EipwI', 'W8pbn5bfNVuaSDyQFTyBi', 'gTac1bV3UwfmKz7mbgMLt',
  'z6K8EqIjwazvyzZZx6YHB'
)
AND EXISTS (SELECT 1 FROM target_post_type);

-- Step 6: Verify the updates
SELECT 
  o.name AS organization,
  pt.slug AS post_type,
  COUNT(p.id) AS post_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE p.id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i', 'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr', 'H20Mk7QghpkTod2LteRd9', 'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62', 'piHn518vACfFg8mAnIWUk', 'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7', 'WqetMlba0vyhUMUL-XG-A', 'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7', 'AM2L2z2cZ7eChe6KdE04n', 'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix', 'DLr02lPqQ3BeXhzSqtmMZ', 'rgcCeWNb6yewFcjGjVbBV',
  'UHVesc7LzBIbKgxP4OvPg', 'Vkh3RiQkkl7_OJCOhqNaA', 'J3GKUoenYB4Zt3_7oodAt',
  'KK2y7XA7G4ba2x6Wvw4um', 'G5tzW0ISig0y1dw7EipwI', 'W8pbn5bfNVuaSDyQFTyBi',
  'gTac1bV3UwfmKz7mbgMLt', 'z6K8EqIjwazvyzZZx6YHB'
)
GROUP BY o.id, o.name, pt.id, pt.slug
ORDER BY o.name, pt.slug;

-- Step 7: Final count
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2')
GROUP BY o.id, o.name
ORDER BY o.name;

