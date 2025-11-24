-- ============================================================
-- Fix Paris American Posts - Handle Same Slug Across Orgs
-- ============================================================
-- Post types can have same slug but different IDs per organization
-- We need to update posts to use Paris American's post type IDs
-- ============================================================

-- Step 1: Verify post types exist for both organizations
SELECT 
  o.name AS organization,
  pt.id AS post_type_id,
  pt.slug AS post_type_slug,
  COUNT(p.id) AS post_count
FROM post_types pt
JOIN organizations o ON pt.organization_id = o.id
LEFT JOIN posts p ON p.post_type_id = pt.id
WHERE pt.slug IN ('blogs', 'academic-staff')
  AND o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2')
GROUP BY o.id, o.name, pt.id, pt.slug
ORDER BY o.name, pt.slug;

-- Step 2: Create post types for Paris American if they don't exist
-- (They should exist, but just in case)
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

-- Step 3: Get the post type IDs we need
-- Paris American's blog post type ID
SELECT 
  'Paris American Blog Post Type ID' AS info,
  pt.id AS post_type_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug = 'blogs'
LIMIT 1;

-- Paris American's academic-staff post type ID
SELECT 
  'Paris American Academic Staff Post Type ID' AS info,
  pt.id AS post_type_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
  AND pt.slug = 'academic-staff'
LIMIT 1;

-- Step 4: Update blog posts
-- Find Paris American's blog post type ID and update posts
UPDATE posts
SET post_type_id = (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
    AND pt.slug = 'blogs'
  LIMIT 1
)
WHERE id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i', 'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr', 'H20Mk7QghpkTod2LteRd9', 'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62', 'piHn518vACfFg8mAnIWUk', 'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7', 'WqetMlba0vyhUMUL-XG-A', 'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7', 'AM2L2z2cZ7eChe6KdE04n', 'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix'
)
AND post_type_id IN (
  -- Only update if currently in North Cyprus
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
    AND pt.slug = 'blogs'
);

-- Step 5: Update academic-staff posts
UPDATE posts
SET post_type_id = (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
    AND pt.slug = 'academic-staff'
  LIMIT 1
)
WHERE id IN (
  'DLr02lPqQ3BeXhzSqtmMZ', 'rgcCeWNb6yewFcjGjVbBV', 'UHVesc7LzBIbKgxP4OvPg',
  'Vkh3RiQkkl7_OJCOhqNaA', 'J3GKUoenYB4Zt3_7oodAt', 'KK2y7XA7G4ba2x6Wvw4um',
  'G5tzW0ISig0y1dw7EipwI', 'W8pbn5bfNVuaSDyQFTyBi', 'gTac1bV3UwfmKz7mbgMLt',
  'z6K8EqIjwazvyzZZx6YHB'
)
AND post_type_id IN (
  -- Only update if currently in North Cyprus
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
    AND pt.slug = 'academic-staff'
);

-- Step 6: Check how many rows were affected
SELECT 
  'Blog posts moved' AS action,
  COUNT(*) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.id IN (
  't8Q-ZKFanC3t06KABtM41', 'hJUMRWtTWCT6s0WlNL4-i', 'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr', 'H20Mk7QghpkTod2LteRd9', 'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62', 'piHn518vACfFg8mAnIWUk', 'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7', 'WqetMlba0vyhUMUL-XG-A', 'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7', 'AM2L2z2cZ7eChe6KdE04n', 'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix'
)
AND pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
UNION ALL
SELECT 
  'Academic staff moved' AS action,
  COUNT(*) AS count
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.id IN (
  'DLr02lPqQ3BeXhzSqtmMZ', 'rgcCeWNb6yewFcjGjVbBV', 'UHVesc7LzBIbKgxP4OvPg',
  'Vkh3RiQkkl7_OJCOhqNaA', 'J3GKUoenYB4Zt3_7oodAt', 'KK2y7XA7G4ba2x6Wvw4um',
  'G5tzW0ISig0y1dw7EipwI', 'W8pbn5bfNVuaSDyQFTyBi', 'gTac1bV3UwfmKz7mbgMLt',
  'z6K8EqIjwazvyzZZx6YHB'
)
AND pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2';

-- Step 7: Final verification
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2')
GROUP BY o.id, o.name
ORDER BY o.name;

