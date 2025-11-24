-- ============================================================
-- SQL Query to List All Organizations and Their API Keys
-- ============================================================
-- This query returns all organizations with their associated API keys
-- Note: Full API keys are hashed in the database, only prefixes are visible

SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  o.slug AS organization_slug,
  o.domain AS organization_domain,
  o.created_at AS organization_created_at,
  o.updated_at AS organization_updated_at,
  ak.id AS api_key_id,
  ak.name AS api_key_name,
  ak.key_prefix AS api_key_prefix,
  ak.scopes AS api_key_scopes,
  ak.rate_limit AS api_key_rate_limit,
  ak.revoked_at AS api_key_revoked_at,
  ak.rotated_from_id AS api_key_rotated_from_id,
  ak.created_at AS api_key_created_at,
  ak.updated_at AS api_key_updated_at,
  ak.last_used_at AS api_key_last_used_at,
  ak.expires_at AS api_key_expires_at,
  CASE 
    WHEN ak.revoked_at IS NOT NULL THEN 'Revoked'
    WHEN ak.expires_at IS NOT NULL AND ak.expires_at < strftime('%s', 'now') THEN 'Expired'
    WHEN ak.expires_at IS NOT NULL THEN 'Active (Expires)'
    ELSE 'Active'
  END AS api_key_status
FROM organizations o
LEFT JOIN api_keys ak ON o.id = ak.organization_id
ORDER BY o.name, ak.created_at DESC;

-- ============================================================
-- Alternative: Summary View (Count of API keys per organization)
-- ============================================================

SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  o.slug AS organization_slug,
  COUNT(ak.id) AS total_api_keys,
  COUNT(CASE WHEN ak.revoked_at IS NULL AND (ak.expires_at IS NULL OR ak.expires_at > strftime('%s', 'now')) THEN 1 END) AS active_api_keys,
  COUNT(CASE WHEN ak.revoked_at IS NOT NULL THEN 1 END) AS revoked_api_keys,
  COUNT(CASE WHEN ak.expires_at IS NOT NULL AND ak.expires_at < strftime('%s', 'now') THEN 1 END) AS expired_api_keys
FROM organizations o
LEFT JOIN api_keys ak ON o.id = ak.organization_id
GROUP BY o.id, o.name, o.slug
ORDER BY o.name;

-- ============================================================
-- Alternative: Only Active API Keys
-- ============================================================

SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  o.slug AS organization_slug,
  ak.id AS api_key_id,
  ak.name AS api_key_name,
  ak.key_prefix AS api_key_prefix,
  ak.scopes AS api_key_scopes,
  ak.rate_limit AS api_key_rate_limit,
  ak.created_at AS api_key_created_at,
  ak.last_used_at AS api_key_last_used_at
FROM organizations o
INNER JOIN api_keys ak ON o.id = ak.organization_id
WHERE ak.revoked_at IS NULL
  AND (ak.expires_at IS NULL OR ak.expires_at > strftime('%s', 'now'))
ORDER BY o.name, ak.created_at DESC;

