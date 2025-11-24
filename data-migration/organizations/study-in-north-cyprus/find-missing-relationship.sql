-- ============================================================
-- Find Which Specific Relationship is Missing
-- ============================================================
-- Shows which of the 5 relationships does NOT exist
-- ============================================================

SELECT 
  'jvnWxUCO8D41x2qquU-zI' AS program_id,
  'English Preparatory Program' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - NEEDS TO BE CREATED'
  END AS status
UNION ALL
SELECT 
  'z_nsit5VczTBhsBmoJjri' AS program_id,
  'International Trade and Business' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - NEEDS TO BE CREATED'
  END AS status
UNION ALL
SELECT 
  'qH9OwGlzam3_6CBRzpZBo' AS program_id,
  'Political Science and International Relations' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - NEEDS TO BE CREATED'
  END AS status
UNION ALL
SELECT 
  'U0K3ldXO6_qGzBwSX_n0f' AS program_id,
  'Business Administration' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - NEEDS TO BE CREATED'
  END AS status
UNION ALL
SELECT 
  'SUkmuM9YJfOWsfT3tsOcJ' AS program_id,
  'Software Engineering' AS program_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM post_relationships 
      WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' 
        AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
        AND relationship_type = 'university'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING - NEEDS TO BE CREATED'
  END AS status;

-- ============================================================
-- Generate INSERT Statement for Missing Relationship Only
-- ============================================================

-- This will show the INSERT statement needed for the missing one
SELECT 
  '-- Missing Relationship INSERT Statement' AS instruction,
  'INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)' AS sql_line_1,
  'SELECT lower(hex(randomblob(12))), ''' || 
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'jvnWxUCO8D41x2qquU-zI'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'z_nsit5VczTBhsBmoJjri'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'qH9OwGlzam3_6CBRzpZBo'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'U0K3ldXO6_qGzBwSX_n0f'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'SUkmuM9YJfOWsfT3tsOcJ'
      ELSE 'NONE'
    END || 
    ''', ''39m8QQ66dihoSPyoQrcaT'', ''university'', strftime(''%s'', ''now'')' AS sql_line_2,
  'WHERE NOT EXISTS (' AS sql_line_3,
  '  SELECT 1 FROM post_relationships' AS sql_line_4,
  '  WHERE from_post_id = ''' ||
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'jvnWxUCO8D41x2qquU-zI'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'z_nsit5VczTBhsBmoJjri'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'qH9OwGlzam3_6CBRzpZBo'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'U0K3ldXO6_qGzBwSX_n0f'
      WHEN NOT EXISTS (SELECT 1 FROM post_relationships WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' AND to_post_id = '39m8QQ66dihoSPyoQrcaT' AND relationship_type = 'university') 
        THEN 'SUkmuM9YJfOWsfT3tsOcJ'
      ELSE 'NONE'
    END ||
    ''' AND to_post_id = ''39m8QQ66dihoSPyoQrcaT'' AND relationship_type = ''university''' AS sql_line_5,
  ');' AS sql_line_6;

