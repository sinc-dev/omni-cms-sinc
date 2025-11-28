-- ============================================================================
-- SQL Queries to Check Custom Fields Attachment for Study in Kazakhstan
-- Run these in D1 database to diagnose why customFields are empty
-- ============================================================================

-- ============================================================================
-- STEP 1: Find the Organization ID
-- ============================================================================
SELECT 
    id,
    name,
    slug,
    created_at
FROM organizations
WHERE slug = 'study-in-kazakhstan'
LIMIT 1;

-- Save the organization_id from above query for use in subsequent queries
-- Example: 'org-123-abc' (replace with actual ID)


-- ============================================================================
-- STEP 2: Find Post Type IDs for Universities and Programs
-- ============================================================================
-- Replace 'YOUR_ORG_ID' with the organization_id from Step 1

SELECT 
    id,
    name,
    slug,
    organization_id
FROM post_types
WHERE organization_id = 'YOUR_ORG_ID'  -- Replace with actual org ID
  AND slug IN ('universities', 'programs');

-- Save the post_type_id values:
-- - universities_post_type_id
-- - programs_post_type_id


-- ============================================================================
-- STEP 3: Check if Custom Fields Exist for the Organization
-- ============================================================================
-- Replace 'YOUR_ORG_ID' with the organization_id from Step 1

SELECT 
    id,
    name,
    slug,
    field_type,
    created_at
FROM custom_fields
WHERE organization_id = 'YOUR_ORG_ID'  -- Replace with actual org ID
ORDER BY name;

-- This shows all custom fields that exist for the organization
-- Common fields might be: location, website, tuition_fee, duration, etc.


-- ============================================================================
-- STEP 4: Check if Custom Fields are Attached to Universities Post Type
-- ============================================================================
-- Replace 'UNIVERSITIES_POST_TYPE_ID' with the universities post_type_id from Step 2

SELECT 
    ptf.id,
    ptf.post_type_id,
    ptf.custom_field_id,
    ptf.is_required,
    ptf.order,
    pt.name AS post_type_name,
    cf.name AS custom_field_name,
    cf.slug AS custom_field_slug,
    cf.field_type
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE ptf.post_type_id = 'UNIVERSITIES_POST_TYPE_ID'  -- Replace with actual post_type_id
ORDER BY ptf.order;

-- If this returns 0 rows, custom fields are NOT attached to universities post type
-- This is likely the problem!


-- ============================================================================
-- STEP 5: Check if Custom Fields are Attached to Programs Post Type
-- ============================================================================
-- Replace 'PROGRAMS_POST_TYPE_ID' with the programs post_type_id from Step 2

SELECT 
    ptf.id,
    ptf.post_type_id,
    ptf.custom_field_id,
    ptf.is_required,
    ptf.order,
    pt.name AS post_type_name,
    cf.name AS custom_field_name,
    cf.slug AS custom_field_slug,
    cf.field_type
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN custom_fields cf ON ptf.custom_field_id = cf.id
WHERE ptf.post_type_id = 'PROGRAMS_POST_TYPE_ID'  -- Replace with actual post_type_id
ORDER BY ptf.order;

-- If this returns 0 rows, custom fields are NOT attached to programs post type


-- ============================================================================
-- STEP 6: Find Coventry University Post ID
-- ============================================================================
-- Replace 'YOUR_ORG_ID' and 'UNIVERSITIES_POST_TYPE_ID' with actual IDs

SELECT 
    id,
    title,
    slug,
    post_type_id,
    status,
    published_at
FROM posts
WHERE organization_id = 'YOUR_ORG_ID'  -- Replace with actual org ID
  AND slug = 'coventry-university-kazakhstan'
LIMIT 1;

-- Save the post_id (e.g., '752a2eb7cd9a095a1c5c98ad')


-- ============================================================================
-- STEP 7: Check if Custom Field Values Exist for Coventry University
-- ============================================================================
-- Replace 'COVENTRY_POST_ID' with the post_id from Step 6

SELECT 
    pfv.id,
    pfv.post_id,
    pfv.custom_field_id,
    pfv.value,
    p.title AS post_title,
    cf.name AS custom_field_name,
    cf.slug AS custom_field_slug,
    cf.field_type
FROM post_field_values pfv
JOIN posts p ON pfv.post_id = p.id
JOIN custom_fields cf ON pfv.custom_field_id = cf.id
WHERE pfv.post_id = 'COVENTRY_POST_ID'  -- Replace with actual post_id
ORDER BY cf.name;

-- If this returns 0 rows, no custom field values are set for this post
-- Even if fields are attached, if values don't exist, customFields will be empty


-- ============================================================================
-- STEP 8: Check All Posts with Custom Field Values (Summary)
-- ============================================================================
-- Replace 'YOUR_ORG_ID' with the organization_id

SELECT 
    pt.slug AS post_type_slug,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_custom_fields,
    COUNT(DISTINCT pfv.custom_field_id) AS unique_custom_fields_used
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE p.organization_id = 'YOUR_ORG_ID'  -- Replace with actual org ID
GROUP BY pt.slug;

-- This shows:
-- - How many posts exist per post type
-- - How many have custom field values
-- - How many unique custom fields are being used


-- ============================================================================
-- STEP 9: Complete Diagnostic Query (All in One)
-- ============================================================================
-- This query shows the full picture for universities post type
-- Replace 'YOUR_ORG_ID' with the organization_id

SELECT 
    'Post Type' AS check_type,
    pt.id AS post_type_id,
    pt.name AS post_type_name,
    pt.slug AS post_type_slug,
    COUNT(DISTINCT ptf.id) AS attached_custom_fields,
    COUNT(DISTINCT p.id) AS total_posts,
    COUNT(DISTINCT pfv.post_id) AS posts_with_values
FROM post_types pt
LEFT JOIN post_type_fields ptf ON pt.id = ptf.post_type_id
LEFT JOIN posts p ON pt.id = p.post_type_id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
WHERE pt.organization_id = 'YOUR_ORG_ID'  -- Replace with actual org ID
  AND pt.slug IN ('universities', 'programs')
GROUP BY pt.id, pt.name, pt.slug
ORDER BY pt.slug;

-- This shows:
-- - How many custom fields are attached to each post type
-- - How many posts exist
-- - How many posts have custom field values


-- ============================================================================
-- STEP 10: Check Specific Post with All Details
-- ============================================================================
-- Replace 'COVENTRY_POST_ID' with the actual post_id

SELECT 
    p.id AS post_id,
    p.title,
    p.slug,
    pt.name AS post_type_name,
    -- Attached custom fields
    (SELECT COUNT(*) 
     FROM post_type_fields ptf 
     WHERE ptf.post_type_id = p.post_type_id) AS attached_fields_count,
    -- Custom field values
    (SELECT COUNT(*) 
     FROM post_field_values pfv 
     WHERE pfv.post_id = p.id) AS values_count,
    -- List of attached fields
    GROUP_CONCAT(DISTINCT cf_attached.slug) AS attached_field_slugs,
    -- List of fields with values
    GROUP_CONCAT(DISTINCT cf_values.slug) AS fields_with_values
FROM posts p
JOIN post_types pt ON p.post_type_id = pt.id
LEFT JOIN post_type_fields ptf_attached ON p.post_type_id = ptf_attached.post_type_id
LEFT JOIN custom_fields cf_attached ON ptf_attached.custom_field_id = cf_attached.id
LEFT JOIN post_field_values pfv ON p.id = pfv.post_id
LEFT JOIN custom_fields cf_values ON pfv.custom_field_id = cf_values.id
WHERE p.slug = 'coventry-university-kazakhstan'
GROUP BY p.id, p.title, p.slug, pt.name;

-- This shows for a specific post:
-- - How many fields are attached to its post type
-- - How many values are set
-- - Which field slugs are attached
-- - Which field slugs have values


-- ============================================================================
-- QUICK DIAGNOSTIC (Run this first to get all IDs)
-- ============================================================================
-- This single query gets all the IDs you need for the other queries

SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    pt.id AS universities_post_type_id,
    pt_programs.id AS programs_post_type_id,
    p_coventry.id AS coventry_post_id
FROM organizations o
LEFT JOIN post_types pt ON pt.organization_id = o.id AND pt.slug = 'universities'
LEFT JOIN post_types pt_programs ON pt_programs.organization_id = o.id AND pt_programs.slug = 'programs'
LEFT JOIN posts p_coventry ON p_coventry.organization_id = o.id 
    AND p_coventry.slug = 'coventry-university-kazakhstan'
WHERE o.slug = 'study-in-kazakhstan'
LIMIT 1;

-- Use the IDs from this query in the other queries above


-- ============================================================================
-- EXPECTED RESULTS INTERPRETATION
-- ============================================================================

-- If Step 4 or 5 returns 0 rows:
--   → Custom fields are NOT attached to the post type
--   → FIX: Need to attach custom fields via post_type_fields table
--
-- If Step 7 returns 0 rows:
--   → Custom fields are attached but no values are set
--   → FIX: Need to populate post_field_values table
--
-- If Step 4/5 has rows but Step 7 is empty:
--   → Fields are attached but values aren't populated
--   → This is why customFields returns {} in the API
--
-- If both Step 4/5 and Step 7 have rows:
--   → Fields are attached AND values exist
--   → Problem might be in API code logic (check postTypeFieldsMap filtering)
