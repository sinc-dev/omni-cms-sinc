-- ============================================================
-- SQL to add SINCUNI and SINCEDU organizations with API keys
-- ============================================================

-- Step 1: Create Organizations

-- SINCUNI
INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at)
VALUES ('fCEkq72xPGJ8v0C7vtjbt', 'SINCUNI', 'sincuni', strftime('%s', 'now'), strftime('%s', 'now'));

-- SINCEDU
INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at)
VALUES ('VS89kFXFjNAkqfJd_szUa', 'SINCEDU', 'sincedu', strftime('%s', 'now'), strftime('%s', 'now'));

-- Step 2: Create API Keys

-- IMPORTANT: API keys are stored as hashed values in the database
-- Full keys are only shown once when created via the API

-- API Key for SINCUNI (sincuni)
-- Key Prefix: 50ce85c8
INSERT OR IGNORE INTO api_keys (
  id, organization_id, name, key, key_prefix, scopes, rate_limit, created_at, updated_at
) VALUES (
  'y6A2P-ihlaZkEgcNMQdwH',
  'fCEkq72xPGJ8v0C7vtjbt',
  'Content Management API Key - sincuni',
  'b9ce7fdfee694b5d9ae2650163993feaf5f28305a80049853d0aafea0f660801',
  '50ce85c8',
  '["*"]',
  10000,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- API Key for SINCEDU (sincedu)
-- Key Prefix: 3b92a0d7
INSERT OR IGNORE INTO api_keys (
  id, organization_id, name, key, key_prefix, scopes, rate_limit, created_at, updated_at
) VALUES (
  'n-0_jCdhIaLXEkeJ2mT2h',
  'VS89kFXFjNAkqfJd_szUa',
  'Content Management API Key - sincedu',
  'ce706c2ea4829d7cb9aa7b99e9986633b9aad955dfd08a0e5b7afe4dbe4ed781',
  '3b92a0d7',
  '["*"]',
  10000,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

