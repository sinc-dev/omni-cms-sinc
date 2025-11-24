-- ============================================================
-- Verify Specific Relationships Status
-- ============================================================
-- Check if the 5 remaining relationships exist in the database
-- ============================================================

-- Check each relationship by program ID and university ID
SELECT 
  'English Preparatory Program' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status,
  (SELECT title FROM posts WHERE id = 'jvnWxUCO8D41x2qquU-zI') AS program_title,
  (SELECT title FROM posts WHERE id = '39m8QQ66dihoSPyoQrcaT') AS university_title;

SELECT 
  'International Trade and Business' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status,
  (SELECT title FROM posts WHERE id = 'z_nsit5VczTBhsBmoJjri') AS program_title,
  (SELECT title FROM posts WHERE id = '39m8QQ66dihoSPyoQrcaT') AS university_title;

SELECT 
  'Political Science and International Relations' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status,
  (SELECT title FROM posts WHERE id = 'qH9OwGlzam3_6CBRzpZBo') AS program_title,
  (SELECT title FROM posts WHERE id = '39m8QQ66dihoSPyoQrcaT') AS university_title;

SELECT 
  'Business Administration' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status,
  (SELECT title FROM posts WHERE id = 'U0K3ldXO6_qGzBwSX_n0f') AS program_title,
  (SELECT title FROM posts WHERE id = '39m8QQ66dihoSPyoQrcaT') AS university_title;

SELECT 
  'Software Engineering' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status,
  (SELECT title FROM posts WHERE id = 'SUkmuM9YJfOWsfT3tsOcJ') AS program_title,
  (SELECT title FROM posts WHERE id = '39m8QQ66dihoSPyoQrcaT') AS university_title;

-- Summary: Count how many of these 5 relationships exist
SELECT 
  'Summary' AS description,
  COUNT(*) AS relationships_found,
  (5 - COUNT(*)) AS relationships_missing
FROM (
  SELECT 1 FROM post_relationships WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university'
  UNION ALL
  SELECT 1 FROM post_relationships WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university'
  UNION ALL
  SELECT 1 FROM post_relationships WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university'
  UNION ALL
  SELECT 1 FROM post_relationships WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university'
  UNION ALL
  SELECT 1 FROM post_relationships WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university'
);

