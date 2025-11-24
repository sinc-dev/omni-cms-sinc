-- ============================================================
-- Remaining 5 Relationship INSERTs with Verification
-- ============================================================
-- Each INSERT is followed by a SELECT to show the result
-- ============================================================

-- 1. English Preparatory Program (Certificate Based) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'jvnWxUCO8D41x2qquU-zI', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Verify: Check if relationship was created
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ Created: English Preparatory Program -> International University of Alasia'
    ELSE '✗ Skipped: Relationship already exists or failed'
  END AS result;

-- 2. International Trade and Business (Bachelor&#8217;s of Art) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'z_nsit5VczTBhsBmoJjri', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Verify: Check if relationship was created
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ Created: International Trade and Business -> International University of Alasia'
    ELSE '✗ Skipped: Relationship already exists or failed'
  END AS result;

-- 3. Political Science and International Relations (Bachelor&#8217;s of Art) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'qH9OwGlzam3_6CBRzpZBo', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Verify: Check if relationship was created
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ Created: Political Science and International Relations -> International University of Alasia'
    ELSE '✗ Skipped: Relationship already exists or failed'
  END AS result;

-- 4. Business Administration (Bachelor&#8217;s of Art) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'U0K3ldXO6_qGzBwSX_n0f', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Verify: Check if relationship was created
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ Created: Business Administration -> International University of Alasia'
    ELSE '✗ Skipped: Relationship already exists or failed'
  END AS result;

-- 5. Software Engineering (Bachelor&#8217;s of Science) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'SUkmuM9YJfOWsfT3tsOcJ', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Verify: Check if relationship was created
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ Created: Software Engineering -> International University of Alasia'
    ELSE '✗ Skipped: Relationship already exists or failed'
  END AS result;

-- ============================================================
-- Final Summary Query
-- ============================================================
-- Count all program-university relationships
SELECT 
  'Total program-university relationships' AS description,
  COUNT(*) AS count
FROM post_relationships 
WHERE relationship_type = 'university';

-- List all program-university relationships
SELECT 
  pr.id,
  p1.title AS program_title,
  p2.title AS university_title,
  pr.created_at
FROM post_relationships pr
JOIN posts p1 ON pr.from_post_id = p1.id
JOIN posts p2 ON pr.to_post_id = p2.id
WHERE pr.relationship_type = 'university'
ORDER BY pr.created_at DESC
LIMIT 20;
