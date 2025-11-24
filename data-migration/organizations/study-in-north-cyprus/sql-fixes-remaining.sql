-- Remaining 5 relationship INSERTs (Computer Engineering already executed)
-- Execute these on Cloudflare D1 remote database using: wrangler d1 execute omni-cms --remote --file=sql-fixes-remaining.sql

-- English Preparatory Program (Certificate Based) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'jvnWxUCO8D41x2qquU-zI', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'jvnWxUCO8D41x2qquU-zI' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- International Trade and Business (Bachelor&#8217;s of Art) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'z_nsit5VczTBhsBmoJjri', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'z_nsit5VczTBhsBmoJjri' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Political Science and International Relations (Bachelor&#8217;s of Art) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'qH9OwGlzam3_6CBRzpZBo', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'qH9OwGlzam3_6CBRzpZBo' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Business Administration (Bachelor&#8217;s of Art) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'U0K3ldXO6_qGzBwSX_n0f', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'U0K3ldXO6_qGzBwSX_n0f' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Software Engineering (Bachelor&#8217;s of Science) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'SUkmuM9YJfOWsfT3tsOcJ', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'SUkmuM9YJfOWsfT3tsOcJ' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

