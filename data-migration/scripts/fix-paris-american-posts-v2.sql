-- ============================================================
-- Fix Paris American Posts - Move to Correct Organization (Version 2)
-- ============================================================
-- This version handles the case where post types might not exist yet
-- ============================================================

-- Step 1: Check if Paris American has the required post types
SELECT 
  'Paris American Post Types Check' AS info,
  pt.id AS post_type_id,
  pt.name AS post_type_name,
  pt.slug AS post_type_slug,
  pt.organization_id,
  COUNT(p.id) AS existing_posts
FROM post_types pt
LEFT JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'  -- Paris American
GROUP BY pt.id, pt.name, pt.slug, pt.organization_id
ORDER BY pt.slug;

-- Step 2: Check what post types exist in North Cyprus for these posts
SELECT 
  'Current Post Types in North Cyprus' AS info,
  pt.id AS post_type_id,
  pt.slug AS post_type_slug,
  COUNT(p.id) AS post_count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
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
GROUP BY pt.id, pt.slug;

-- Step 3: Create post types for Paris American if they don't exist
-- First, check if 'blogs' post type exists for Paris American
INSERT OR IGNORE INTO post_types (id, organization_id, name, slug, description, created_at, updated_at)
SELECT 
  lower(hex(randomblob(12))) AS id,
  'ND-k8iHHx70s5XaW28Mk2' AS organization_id,
  'Blog' AS name,
  'blogs' AS slug,
  NULL AS description,
  strftime('%s', 'now') AS created_at,
  strftime('%s', 'now') AS updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM post_types 
  WHERE organization_id = 'ND-k8iHHx70s5XaW28Mk2' 
    AND slug = 'blogs'
);

-- Create 'academic-staff' post type for Paris American if it doesn't exist
INSERT OR IGNORE INTO post_types (id, organization_id, name, slug, description, created_at, updated_at)
SELECT 
  lower(hex(randomblob(12))) AS id,
  'ND-k8iHHx70s5XaW28Mk2' AS organization_id,
  'Academic Staff' AS name,
  'academic-staff' AS slug,
  NULL AS description,
  strftime('%s', 'now') AS created_at,
  strftime('%s', 'now') AS updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM post_types 
  WHERE organization_id = 'ND-k8iHHx70s5XaW28Mk2' 
    AND slug = 'academic-staff'
);

-- Step 4: Now update blog posts to use Paris American's blog post type
UPDATE posts
SET post_type_id = (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'  -- Paris American
    AND pt.slug = 'blogs'
  LIMIT 1
)
WHERE id IN (
  't8Q-ZKFanC3t06KABtM41',  -- 5 Hidden Costs of Traditional Learning
  'hJUMRWtTWCT6s0WlNL4-i',  -- PAIU Executive Board Member
  'O33NQbi-BFYp9t25pVjoL',  -- Study Your Integrated Doctorate
  'NVQBhzFme3L35OOpBJOIr',  -- The Ultimate Checklist
  'H20Mk7QghpkTod2LteRd9',  -- Behind the Scenes
  'te_tracjvr0ayAl4beYsC',  -- What Makes PAIU's Online Faculty
  'RdGX6cJKH7QPbruG4DZ62',  -- How to Write a Standout Personal Statement
  'piHn518vACfFg8mAnIWUk',  -- Paris American International University Partnership
  'pHQAa-TIJ0Ybk16oDu719',  -- How to Build a Global Network
  'qtknIcQLDF8qd78IAqrQ7',  -- 5 High-Demand Jobs
  'WqetMlba0vyhUMUL-XG-A',  -- How Military Veterans
  'Bo8LQ-Gioy2AKnp4Q06ef',  -- How PAIU Supports Online Students
  'tbliX6RCJuniCFjve_Zr7',  -- The Rise of Micro-Credentials
  'AM2L2z2cZ7eChe6KdE04n',  -- Balancing Work and Study
  'r20ih91EAepnld7sP-4T8',  -- Why Choose Paris American
  'c2bKvIUl5RHzF99yi04ix'   -- A Global Classroom
);

-- Step 5: Update academic-staff posts to use Paris American's academic-staff post type
UPDATE posts
SET post_type_id = (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'  -- Paris American
    AND pt.slug = 'academic-staff'
  LIMIT 1
)
WHERE id IN (
  'DLr02lPqQ3BeXhzSqtmMZ',  -- Jennifer Marie Powell
  'rgcCeWNb6yewFcjGjVbBV',  -- Dr. Amna Mezni
  'UHVesc7LzBIbKgxP4OvPg',  -- Dr. Adama Ouedraogo
  'Vkh3RiQkkl7_OJCOhqNaA',  -- Dr. Mariya Romanova
  'J3GKUoenYB4Zt3_7oodAt',  -- Monica Goodface
  'KK2y7XA7G4ba2x6Wvw4um',  -- Dr. Ali Souag
  'G5tzW0ISig0y1dw7EipwI',  -- Dr. Julia Seng
  'W8pbn5bfNVuaSDyQFTyBi',  -- Dr. Florin Popescu
  'gTac1bV3UwfmKz7mbgMLt',  -- Tim Johnson
  'z6K8EqIjwazvyzZZx6YHB'   -- Victoire Daher
);

-- Step 6: Verify the updates worked
SELECT 
  'Verification - Posts by Organization' AS status,
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

-- Step 7: Final count check
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2')
GROUP BY o.id, o.name
ORDER BY o.name;

