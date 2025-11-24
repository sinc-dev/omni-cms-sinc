-- ============================================================
-- Fix Paris American Posts - Move to Correct Organization
-- ============================================================
-- Move posts that belong to Paris American but are in Study in North Cyprus
-- ============================================================

-- Step 1: Verify the correct post type IDs for Paris American
SELECT 
  'Paris American Post Types' AS info,
  pt.id AS post_type_id,
  pt.name AS post_type_name,
  pt.slug AS post_type_slug,
  pt.organization_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'  -- Paris American
ORDER BY pt.slug;

-- Step 2: Get the post type IDs we need
-- We need: 'blogs' and 'academic-staff' post types for Paris American
-- Store these IDs for use in UPDATE statements

-- Step 3: Update blog posts to use Paris American's blog post type
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
)
AND post_type_id IN (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Currently in North Cyprus
    AND pt.slug = 'blogs'
);

-- Step 4: Update academic-staff posts to use Paris American's academic-staff post type
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
)
AND post_type_id IN (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'  -- Currently in North Cyprus
    AND pt.slug = 'academic-staff'
);

-- Step 5: Verify the updates worked
SELECT 
  'After Update - Paris American Posts' AS status,
  pt.organization_id,
  o.name AS organization_name,
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
GROUP BY pt.organization_id, o.name, pt.slug
ORDER BY o.name, pt.slug;

-- Step 6: Final count check
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2')
GROUP BY o.id, o.name
ORDER BY o.name;

