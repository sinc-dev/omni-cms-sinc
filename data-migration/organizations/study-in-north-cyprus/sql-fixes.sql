-- ============================================================
-- SQL Fixes Summary
-- ============================================================

-- Generated: 2025-11-24T16:56:52.104Z

-- Statistics:
-- Posts in DB: 700
-- Posts in Transformed Data: 1269
-- Missing Posts in DB: 1223
-- Missing Relationships: 6

-- Missing Post Relationships
-- Programs without university relationships

-- Insert missing program-university relationships
-- Table: post_relationships
-- Columns: id (generated using randomblob), from_post_id, to_post_id, relationship_type, created_at
-- Note: Uses INSERT OR IGNORE with WHERE NOT EXISTS to safely skip duplicates

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

-- Computer Engineering (Bachelor&#8217;s of Science) &#8211; English -> International University of Alasia
INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)
SELECT lower(hex(randomblob(12))), 'IkDV5QAZVScGL8rN-oKK-', '39m8QQ66dihoSPyoQrcaT', 'university', strftime('%s', 'now')
WHERE NOT EXISTS (
  SELECT 1 FROM post_relationships 
  WHERE from_post_id = 'IkDV5QAZVScGL8rN-oKK-' 
    AND to_post_id = '39m8QQ66dihoSPyoQrcaT' 
    AND relationship_type = 'university'
);

-- Missing Taxonomy Term Assignments
-- Note: Adjust table/column names based on your schema

-- Example format (adjust based on your schema):
-- INSERT INTO post_taxonomy_assignments (post_id, taxonomy_term_id, created_at)
-- VALUES (post_id, term_id, datetime('now'));

-- TODO: Implement taxonomy assignment comparison

-- ============================================================
-- IMPORTANT NOTES
-- ============================================================
-- 1. Review all SQL statements before executing
-- 2. Backup your database before running these statements
-- 3. Adjust table/column names based on your actual schema
-- 4. Some statements may need to be run in a specific order
-- 5. These statements use INSERT OR IGNORE with WHERE NOT EXISTS to safely skip duplicates
