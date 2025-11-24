-- ============================================================
-- Diagnose and Fix Paris American Posts
-- ============================================================
-- Step-by-step diagnosis and fix
-- ============================================================

-- Step 1: Check current state of the posts
SELECT 
  p.id,
  p.title,
  pt.slug AS current_post_type,
  pt.organization_id AS current_org_id,
  o.name AS current_org_name
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
ORDER BY pt.slug, p.title;

-- Step 2: Check if Paris American post types exist
SELECT 
  'Paris American Post Types' AS check_type,
  pt.id,
  pt.slug,
  pt.organization_id,
  o.name AS org_name,
  COUNT(p.id) AS post_count
FROM post_types pt
JOIN organizations o ON pt.organization_id = o.id
LEFT JOIN posts p ON p.post_type_id = pt.id
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
GROUP BY pt.id, pt.slug, pt.organization_id, o.name
ORDER BY pt.slug;

-- Step 3: Get the post type IDs we need from North Cyprus
SELECT 
  'North Cyprus Post Type IDs' AS info,
  pt.id AS post_type_id,
  pt.slug,
  pt.organization_id
FROM post_types pt
WHERE pt.organization_id = '3Kyv3hvrybf_YohTZRgPV'
  AND pt.slug IN ('blogs', 'academic-staff')
ORDER BY pt.slug;

-- Step 4: Create post types for Paris American (if they don't exist)
-- Get the blog post type ID from North Cyprus to copy structure
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

-- Step 5: Verify post types were created
SELECT 
  'After Creation - Paris American Post Types' AS status,
  pt.id,
  pt.slug,
  pt.organization_id
FROM post_types pt
WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
ORDER BY pt.slug;

-- Step 6: Update blog posts - Use direct post_type_id lookup
UPDATE posts
SET post_type_id = (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
    AND pt.slug = 'blogs'
  LIMIT 1
)
WHERE id IN (
  't8Q-ZKFanC3t06KABtM41',
  'hJUMRWtTWCT6s0WlNL4-i',
  'O33NQbi-BFYp9t25pVjoL',
  'NVQBhzFme3L35OOpBJOIr',
  'H20Mk7QghpkTod2LteRd9',
  'te_tracjvr0ayAl4beYsC',
  'RdGX6cJKH7QPbruG4DZ62',
  'piHn518vACfFg8mAnIWUk',
  'pHQAa-TIJ0Ybk16oDu719',
  'qtknIcQLDF8qd78IAqrQ7',
  'WqetMlba0vyhUMUL-XG-A',
  'Bo8LQ-Gioy2AKnp4Q06ef',
  'tbliX6RCJuniCFjve_Zr7',
  'AM2L2z2cZ7eChe6KdE04n',
  'r20ih91EAepnld7sP-4T8',
  'c2bKvIUl5RHzF99yi04ix'
);

-- Step 7: Update academic-staff posts
UPDATE posts
SET post_type_id = (
  SELECT pt.id 
  FROM post_types pt 
  WHERE pt.organization_id = 'ND-k8iHHx70s5XaW28Mk2'
    AND pt.slug = 'academic-staff'
  LIMIT 1
)
WHERE id IN (
  'DLr02lPqQ3BeXhzSqtmMZ',
  'rgcCeWNb6yewFcjGjVbBV',
  'UHVesc7LzBIbKgxP4OvPg',
  'Vkh3RiQkkl7_OJCOhqNaA',
  'J3GKUoenYB4Zt3_7oodAt',
  'KK2y7XA7G4ba2x6Wvw4um',
  'G5tzW0ISig0y1dw7EipwI',
  'W8pbn5bfNVuaSDyQFTyBi',
  'gTac1bV3UwfmKz7mbgMLt',
  'z6K8EqIjwazvyzZZx6YHB'
);

-- Step 8: Check how many rows were updated
SELECT 
  'Update Results' AS status,
  'Blog posts updated' AS type,
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
  'Update Results' AS status,
  'Academic staff updated' AS type,
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

-- Step 9: Final verification - Check posts by organization
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

-- Step 10: Final count check
SELECT 
  o.name AS organization,
  COUNT(p.id) AS total_posts
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
WHERE o.id IN ('3Kyv3hvrybf_YohTZRgPV', 'ND-k8iHHx70s5XaW28Mk2')
GROUP BY o.id, o.name
ORDER BY o.name;

