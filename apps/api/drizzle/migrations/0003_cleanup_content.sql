-- Migration: Cleanup Content Data
-- This migration removes all content data while preserving organizations, users, and media
-- Run this before repopulating from transformed data

-- Delete in order to respect foreign key constraints

-- 1. Delete post relationships (no dependencies)
DELETE FROM post_relationships;

-- 2. Delete post taxonomies (depends on posts and taxonomy_terms)
DELETE FROM post_taxonomies;

-- 3. Delete post field values (depends on posts and custom_fields)
DELETE FROM post_field_values;

-- 4. Delete post type fields (depends on post_types and custom_fields)
DELETE FROM post_type_fields;

-- 5. Delete posts (depends on post_types, users, organizations, media)
DELETE FROM posts;

-- 6. Delete post types (depends on organizations)
DELETE FROM post_types;

-- 7. Delete taxonomy terms (depends on taxonomies)
DELETE FROM taxonomy_terms;

-- 8. Delete taxonomies (depends on organizations)
DELETE FROM taxonomies;

-- 9. Delete custom fields (depends on organizations)
DELETE FROM custom_fields;

-- Note: The following are preserved:
-- - organizations (kept)
-- - users (kept)
-- - media (kept)
-- - api_keys (kept)
-- - roles (kept)
-- - users_organizations (kept)
-- - All other tables that don't contain content data

