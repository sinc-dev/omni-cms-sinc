-- ============================================================================
-- Create Missing Custom Fields
-- Total fields to create: 34
-- Generated from trace-wordpress-meta-keys-report.json
-- Note: D1 executes each statement atomically, no transaction needed
-- ============================================================================

-- Organization: study-in-north-cyprus (3Kyv3hvrybf_YohTZRgPV)
-- Creating 2 custom fields

-- Accreditation (from meta key: "accreditation")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '58016befa91459271ed31d2f',
  '3Kyv3hvrybf_YohTZRgPV',
  'Accreditation',
  'accreditation',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = '3Kyv3hvrybf_YohTZRgPV')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = '3Kyv3hvrybf_YohTZRgPV' AND slug = 'accreditation');

-- Featured (from meta key: "featured")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '15e4657d32091bc22412712c',
  '3Kyv3hvrybf_YohTZRgPV',
  'Featured',
  'featured',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = '3Kyv3hvrybf_YohTZRgPV')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = '3Kyv3hvrybf_YohTZRgPV' AND slug = 'featured');

-- Organization: study-in-kazakhstan (IBfLssGjH23-f9uxjH5Ms)
-- Creating 32 custom fields

-- Accreditation (from meta key: "accreditation")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'b53cb21aa1f3d29de02037f2',
  'IBfLssGjH23-f9uxjH5Ms',
  'Accreditation',
  'accreditation',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'accreditation');

-- Tuition Fees Without Discount (from meta key: "tuition-fees-without-discount")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '90f8510689dca110541d213f',
  'IBfLssGjH23-f9uxjH5Ms',
  'Tuition Fees Without Discount',
  'tuition_fees_without_discount',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'tuition_fees_without_discount');

-- Tuition Fees With Discount (from meta key: "tuition-fees-with-discount")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'd2aa01b988295cb96f893278',
  'IBfLssGjH23-f9uxjH5Ms',
  'Tuition Fees With Discount',
  'tuition_fees_with_discount',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'tuition_fees_with_discount');

-- Featured (from meta key: "featured")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'c1d48961ccfab766c19b0263',
  'IBfLssGjH23-f9uxjH5Ms',
  'Featured',
  'featured',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'featured');

-- Program Salesforce Id (from meta key: "program-salesforce-id")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '4cf8444e55c4d35038d148f2',
  'IBfLssGjH23-f9uxjH5Ms',
  'Program Salesforce Id',
  'program_salesforce_id',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'program_salesforce_id');

-- Scholarship (from meta key: "scholarship")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'bbce66c6069f69f8b7d64683',
  'IBfLssGjH23-f9uxjH5Ms',
  'Scholarship',
  'scholarship',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'scholarship');

-- Application Link (from meta key: "application-link")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '3c798fe706bf6ec5a27931f5',
  'IBfLssGjH23-f9uxjH5Ms',
  'Application Link',
  'application_link',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'application_link');

-- Google Map Gallery (from meta key: "google_map_gallery")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '82f4002b43f79986cd596015',
  'IBfLssGjH23-f9uxjH5Ms',
  'Google Map Gallery',
  'google_map_gallery',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'google_map_gallery');

-- Founding Year (from meta key: "founding-year")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '8ca17edd2109ad76952e5635',
  'IBfLssGjH23-f9uxjH5Ms',
  'Founding Year',
  'founding_year',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'founding_year');

-- Student Number (from meta key: "student-number")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '362314ede62810310dc3c466',
  'IBfLssGjH23-f9uxjH5Ms',
  'Student Number',
  'student_number',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'student_number');

-- Academic Staff Number (from meta key: "academic-staff-number")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '882506941eaabf4e98f7a9e3',
  'IBfLssGjH23-f9uxjH5Ms',
  'Academic Staff Number',
  'academic_staff_number',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'academic_staff_number');

-- Programs (from meta key: "programs")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'ef3cb35fe0a96ec27d11beef',
  'IBfLssGjH23-f9uxjH5Ms',
  'Programs',
  'programs',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'programs');

-- Nationalities (from meta key: "nationalities")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '8d5a8a11282d015ed64b656a',
  'IBfLssGjH23-f9uxjH5Ms',
  'Nationalities',
  'nationalities',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'nationalities');

-- Motto (from meta key: "motto")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'c82e2b1a8c3dbb87f6acff69',
  'IBfLssGjH23-f9uxjH5Ms',
  'Motto',
  'motto',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'motto');

-- Cover (from meta key: "cover")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'd256443c4586542d88f7b000',
  'IBfLssGjH23-f9uxjH5Ms',
  'Cover',
  'cover',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'cover');

-- Reson1 (from meta key: "reson1")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '8ba6e0fd5d2016fd261901eb',
  'IBfLssGjH23-f9uxjH5Ms',
  'Reson1',
  'reson1',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'reson1');

-- Reason2 (from meta key: "reason2")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '81ef12649f1cbde5037ab27c',
  'IBfLssGjH23-f9uxjH5Ms',
  'Reason2',
  'reason2',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'reason2');

-- Reason2 704 (from meta key: "reason2_704")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '2d1d8061ad6c747769425f45',
  'IBfLssGjH23-f9uxjH5Ms',
  'Reason2 704',
  'reason2_704',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'reason2_704');

-- About University (from meta key: "about-university")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '6cf13f79a1ed6f9705d485f8',
  'IBfLssGjH23-f9uxjH5Ms',
  'About University',
  'about_university',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'about_university');

-- Facilities (from meta key: "facilities")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '79ff364a18e72d4c97e7aa7e',
  'IBfLssGjH23-f9uxjH5Ms',
  'Facilities',
  'facilities',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'facilities');

-- Gallery (from meta key: "gallery")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '9a46f935577b53cabbf5f775',
  'IBfLssGjH23-f9uxjH5Ms',
  'Gallery',
  'gallery',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'gallery');

-- Promotional Video (from meta key: "promotional-video")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'af785cb06c2315f9d4643c09',
  'IBfLssGjH23-f9uxjH5Ms',
  'Promotional Video',
  'promotional_video',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'promotional_video');

-- Student Life (from meta key: "student-life")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '0052e00625db731df32426b0',
  'IBfLssGjH23-f9uxjH5Ms',
  'Student Life',
  'student_life',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'student_life');

-- Locations (from meta key: "locations")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'f061890f89503f501b6daa7a',
  'IBfLssGjH23-f9uxjH5Ms',
  'Locations',
  'locations',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'locations');

-- Admissions (from meta key: "admissions")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'bdd8ee569748344abf8daf1b',
  'IBfLssGjH23-f9uxjH5Ms',
  'Admissions',
  'admissions',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'admissions');

-- Admission Criteria (from meta key: "admission-criteria")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '3b9eb7e82f383fba37948a69',
  'IBfLssGjH23-f9uxjH5Ms',
  'Admission Criteria',
  'admission_criteria',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'admission_criteria');

-- Tuition Fees Text (from meta key: "tuition-fees-text")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '5cbb4d6caa1a3ea2ba91ef71',
  'IBfLssGjH23-f9uxjH5Ms',
  'Tuition Fees Text',
  'tuition_fees_text',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'tuition_fees_text');

-- Scholarship Opportunities Text (from meta key: "scholarship-opportunities-text")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '7598bd4e5556d0bf3e6b7fa3',
  'IBfLssGjH23-f9uxjH5Ms',
  'Scholarship Opportunities Text',
  'scholarship_opportunities_text',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'scholarship_opportunities_text');

-- Accreditations Amp Rankings Text (from meta key: "accreditations-amp-rankings-text")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'a4fdde8ccad6ce02130a2c67',
  'IBfLssGjH23-f9uxjH5Ms',
  'Accreditations Amp Rankings Text',
  'accreditations_amp_rankings_text',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'accreditations_amp_rankings_text');

-- Accommodation (from meta key: "accommodation")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '9d95ad8cb475f68dbbbefbef',
  'IBfLssGjH23-f9uxjH5Ms',
  'Accommodation',
  'accommodation',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'accommodation');

-- Programs Text (from meta key: "programs-text")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  '4e5de8d57ee5744cb7563d43',
  'IBfLssGjH23-f9uxjH5Ms',
  'Programs Text',
  'programs_text',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'programs_text');

-- Acceptance Rate (from meta key: "acceptance-rate")
INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)
SELECT
  'f17a225623a608b52e5cf85f',
  'IBfLssGjH23-f9uxjH5Ms',
  'Acceptance Rate',
  'acceptance_rate',
  'text',
  NULL,
  1764358047,
  1764358047
WHERE EXISTS (SELECT 1 FROM organizations WHERE id = 'IBfLssGjH23-f9uxjH5Ms')
  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = 'IBfLssGjH23-f9uxjH5Ms' AND slug = 'acceptance_rate');
