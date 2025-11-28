-- ============================================================================
-- Create Missing Custom Fields (Safe Version)
-- This version checks if organizations exist before inserting
-- ============================================================================

BEGIN TRANSACTION;

-- First, verify organizations exist
-- If any of these fail, the transaction will rollback

-- Organization: study-in-north-cyprus (3Kyv3hvrybf_YohTZRgPV)
-- Creating 2 custom fields

-- Accreditation (from meta key: "accreditation")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '203eb867bd06df8e41bc3274',
  '3Kyv3hvrybf_YohTZRgPV',
  'Accreditation',
  'accreditation',
  'text',
  NULL,
  1764357466,
  1764357466
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = '3Kyv3hvrybf_YohTZRgPV')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = '3Kyv3hvrybf_YohTZRgPV' AND slug = 'accreditation');

-- Featured (from meta key: "featured")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'e7f267a81d89807f85feba1e',
  '3Kyv3hvrybf_YohTZRgPV',
  'Featured',
  'featured',
  'text',
  NULL,
  1764357466,
  1764357466
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = '3Kyv3hvrybf_YohTZRgPV')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = '3Kyv3hvrybf_YohTZRgPV' AND slug = 'featured');

COMMIT;

