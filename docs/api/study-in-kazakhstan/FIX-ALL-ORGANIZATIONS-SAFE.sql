-- ============================================================================
-- FIX: Attach Custom Fields to Post Types (For ALL Organizations) - SAFE VERSION
-- 
-- This script fixes existing databases that were imported before the
-- attachment step was implemented.
-- 
-- Organizations:
-- 1. study-in-kazakhstan
-- 2. study-in-north-cyprus
-- 3. paris-american-international-university
-- 
-- SAFETY: Verifies custom fields belong to the same organization as post types
-- SAFE TO RUN MULTIPLE TIMES - Uses NOT EXISTS to prevent duplicates
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify Current State for ALL Organizations
-- ============================================================================
-- Run this first to see what needs fixing across all organizations

SELECT 
    o.slug AS organization_slug,
    o.name AS organization_name,
    pt.slug AS post_type_slug,
    pt.name AS post_type_name,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug, o.name, pt.slug, pt.name
ORDER BY o.slug, pt.slug;

-- Expected output before fix:
-- Most post types will show: attached_fields = 0, but posts_with_values > 0

-- ============================================================================
-- STEP 1.5: Check for Cross-Organizational Issues (SAFETY CHECK)
-- ============================================================================
-- Run this to verify there are no custom fields from wrong organizations
-- This should return 0 rows if data is clean

SELECT 
    o_post.slug AS post_organization,
    o_field.slug AS field_organization,
    COUNT(*) AS mismatched_count
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND o_post.id != o_field.id  -- Different organizations!
GROUP BY o_post.slug, o_field.slug;

-- If this returns any rows, there's a data integrity issue that needs fixing first
-- Expected: 0 rows (all custom fields should belong to same org as posts)

-- ============================================================================
-- STEP 2: Fix ALL Organizations - Attach Fields to ALL Post Types (SAFE)
-- ============================================================================
-- This version includes an extra safety check to ensure custom fields
-- belong to the same organization as the post types

INSERT INTO post_type_fields (
    id,
    post_type_id,
    custom_field_id,
    is_required,
    "order",
    created_at
)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    p.post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (
        PARTITION BY p.post_type_id 
        ORDER BY cf.name
    ) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  -- SAFETY CHECK: Ensure custom field belongs to same organization as post type
  AND o_post.id = o_field.id
  AND NOT EXISTS (
    SELECT 1 
    FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- STEP 3: Verify the Fix Worked for ALL Organizations
-- ============================================================================

SELECT 
    o.slug AS organization_slug,
    o.name AS organization_name,
    pt.slug AS post_type_slug,
    pt.name AS post_type_name,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_fields_with_values,
    CASE 
        WHEN COUNT(DISTINCT ptf.id) = COUNT(DISTINCT pfv.custom_field_id) 
             AND COUNT(DISTINCT ptf.id) > 0 
        THEN '✅ FIXED'
        WHEN COUNT(DISTINCT ptf.id) = 0 AND COUNT(DISTINCT pfv.post_id) > 0 
        THEN '❌ NEEDS FIX'
        WHEN COUNT(DISTINCT pfv.post_id) = 0 
        THEN '⚠️ NO VALUES'
        ELSE '⚠️ PARTIAL'
    END AS status
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug, o.name, pt.slug, pt.name
ORDER BY o.slug, pt.slug;

-- After the fix:
-- Status should show '✅ FIXED' for post types with values
-- attached_fields should match unique_fields_with_values

-- ============================================================================
-- STEP 4: Verify Organizational Isolation (Post-Fix Check)
-- ============================================================================
-- Verify that all attached fields belong to the correct organizations

SELECT 
    o.slug AS organization_slug,
    pt.slug AS post_type_slug,
    COUNT(DISTINCT ptf.id) AS attached_fields,
    COUNT(DISTINCT CASE WHEN cf.organization_id = o.id THEN ptf.id END) AS correct_org_fields,
    COUNT(DISTINCT CASE WHEN cf.organization_id != o.id THEN ptf.id END) AS wrong_org_fields
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;

-- Expected: wrong_org_fields should always be 0
-- If wrong_org_fields > 0, there's a cross-organizational issue

-- ============================================================================
-- STEP 5: See What Fields Were Attached (Summary by Organization)
-- ============================================================================

SELECT 
    o.slug AS organization_slug,
    pt.slug AS post_type_slug,
    COUNT(DISTINCT ptf.id) AS total_attached_fields,
    GROUP_CONCAT(DISTINCT cf.slug, ', ') AS attached_field_slugs
FROM organizations o
JOIN post_types pt ON pt.organization_id = o.id
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
  AND ptf.id IS NOT NULL
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;

-- ============================================================================
-- ALTERNATIVE: Fix One Organization at a Time (With Safety Check)
-- ============================================================================
-- If you prefer to fix organizations one at a time, use these queries

-- For Study in Kazakhstan:
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    p.post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (PARTITION BY p.post_type_id ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug = 'study-in-kazakhstan'
  AND o_post.id = o_field.id  -- Safety check
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- For Study in North Cyprus:
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    p.post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (PARTITION BY p.post_type_id ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug = 'study-in-north-cyprus'
  AND o_post.id = o_field.id  -- Safety check
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- For Paris American International University:
INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)
SELECT DISTINCT
    lower(hex(randomblob(12))) AS id,
    p.post_type_id,
    pfv.custom_field_id,
    0 AS is_required,
    ROW_NUMBER() OVER (PARTITION BY p.post_type_id ORDER BY cf.name) AS "order",
    unixepoch() AS created_at
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN post_types pt ON p.post_type_id = pt.id
JOIN organizations o_post ON pt.organization_id = o_post.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
JOIN organizations o_field ON cf.organization_id = o_field.id
WHERE o_post.slug = 'paris-american-international-university'
  AND o_post.id = o_field.id  -- Safety check
  AND NOT EXISTS (
    SELECT 1 FROM post_type_fields ptf 
    WHERE ptf.post_type_id = p.post_type_id
      AND ptf.custom_field_id = pfv.custom_field_id
  );

-- ============================================================================
-- DETAILED VIEW: See All Attached Fields by Organization
-- ============================================================================

SELECT 
    o.slug AS organization_slug,
    pt.slug AS post_type_slug,
    cf.name AS field_name,
    cf.slug AS field_slug,
    cf.field_type,
    ptf."order",
    CASE 
        WHEN cf.organization_id = o.id THEN '✅ CORRECT'
        ELSE '❌ WRONG ORG'
    END AS org_check
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus', 'paris-american-international-university')
ORDER BY o.slug, pt.slug, ptf."order";

-- This shows you exactly which fields are attached to each post type for each organization
-- org_check should always show '✅ CORRECT'
