-- ============================================================
-- SQL to create organizations and API keys for local testing
-- ============================================================

-- Step 1: Create Organizations

-- Study In Kazakhstan
INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at)
VALUES ('IBfLssGjH23-f9uxjH5Ms', 'Study In Kazakhstan', 'study-in-kazakhstan', 1763988635, 1763988635);

-- Study in North Cyprus
INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at)
VALUES ('3Kyv3hvrybf_YohTZRgPV', 'Study in North Cyprus', 'study-in-north-cyprus', 1763988635, 1763988635);

-- Paris American International University
INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at)
VALUES ('ND-k8iHHx70s5XaW28Mk2', 'Paris American International University', 'paris-american-international-university', 1763988635, 1763988635);

-- Step 2: Create API Keys

-- IMPORTANT: API keys are stored as hashed values in the database
-- Full keys are only shown once when created via the API

-- API Key for Study In Kazakhstan (study-in-kazakhstan)
-- Key Prefix: 099c139e
INSERT OR IGNORE INTO api_keys (
  id, organization_id, name, key, key_prefix, scopes, rate_limit, created_at, updated_at
) VALUES (
  'TXGW54a9dCv2WJcNgvPjp',
  'IBfLssGjH23-f9uxjH5Ms',
  'Test Import Key - study-in-kazakhstan',
  '24536a8838019484a8d5797162d067ce99138c833d06530938fcb10821696ef9',
  '099c139e',
  '["*"]',
  10000,
  1763988635,
  1763988635
);

-- API Key for Study in North Cyprus (study-in-north-cyprus)
-- Key Prefix: b9bda2be
INSERT OR IGNORE INTO api_keys (
  id, organization_id, name, key, key_prefix, scopes, rate_limit, created_at, updated_at
) VALUES (
  'enhELJZPFLQse2vO6e9MU',
  '3Kyv3hvrybf_YohTZRgPV',
  'Test Import Key - study-in-north-cyprus',
  '1cf38e4053812388c5f32418d351cd418278fa0a43d19b1464f1ae7a2face28e',
  'b9bda2be',
  '["*"]',
  10000,
  1763988635,
  1763988635
);

-- API Key for Paris American International University (paris-american-international-university)
-- Key Prefix: 5878190c
INSERT OR IGNORE INTO api_keys (
  id, organization_id, name, key, key_prefix, scopes, rate_limit, created_at, updated_at
) VALUES (
  '3VOtlfiYSDrnP0AcTrZTo',
  'ND-k8iHHx70s5XaW28Mk2',
  'Test Import Key - paris-american-international-university',
  '6586ee8dd8f9596e3330854272d843da0a8df8fd0114ee3add624914e2db659a',
  '5878190c',
  '["*"]',
  10000,
  1763988635,
  1763988635
);

