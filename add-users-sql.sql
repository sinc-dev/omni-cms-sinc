
> -- Step 1: Create users (if they don't exist)
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'joseph@studyinnc.com',
    'Joseph',
    0,
    1764021756,
    1764021756
  );
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'safak@studyinnc.com',
    'Safak',
    0,
    1764021756,
    1764021756
  );
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'grace@studyinnc.com',
    'Grace',
    0,
    1764021756,
    1764021756
  );
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'jesse@studyinnc.com',
    'Jesse',
    0,
    1764021756,
    1764021756
  );
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'abdulraheem@studyinnc.com',
    'Abdulraheem',
    0,
    1764021756,
    1764021756
  );
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'selman@studyinnc.com',
    'Selman',
    0,
    1764021756,
    1764021756
  );
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'zahra@studyinnc.com',
    'Zahra',
    0,
    1764021756,
    1764021756
  );
  
  INSERT OR IGNORE INTO users (
    id,
    email,
    name,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    lower(hex(randomblob(16))),
    'christiane@studyinnc.com',
    'Christiane',
    0,
    1764021756,
    1764021756
  );
  
> -- Step 2: Grant access to all organizations
  -- This will add each user to all organizations with org_admin role
  
  -- First, let's verify we have the org_admin role
  -- If the role doesn't exist, you may need to create it first
  
  -- Grant joseph@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'joseph@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
  -- Grant safak@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'safak@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
  -- Grant grace@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'grace@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
  -- Grant jesse@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'jesse@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
  -- Grant abdulraheem@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'abdulraheem@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
  -- Grant selman@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'selman@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
  -- Grant zahra@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'zahra@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
  -- Grant christiane@studyinnc.com access to all organizations
  INSERT OR IGNORE INTO users_organizations (
    id,
    user_id,
    organization_id,
    role_id,
    created_at,
    updated_at
  )
  SELECT 
    lower(hex(randomblob(16))) as id,
    u.id as user_id,
    o.id as organization_id,
    r.id as role_id,
    strftime('%s', 'now') as created_at,
    strftime('%s', 'now') as updated_at
  FROM users u
  CROSS JOIN organizations o
  CROSS JOIN roles r
  WHERE u.email = 'christiane@studyinnc.com'
    AND r.name = 'org_admin'
    AND NOT EXISTS (
      SELECT 1 FROM users_organizations uo
      WHERE uo.user_id = u.id AND uo.organization_id = o.id
    );
  
> -- Step 3: Verify the setup
  
  -- Check that all users were created:
  SELECT email, name, is_super_admin FROM users WHERE email IN (
    'joseph@studyinnc.com',
    'safak@studyinnc.com',
    'grace@studyinnc.com',
    'jesse@studyinnc.com',
    'abdulraheem@studyinnc.com',
    'selman@studyinnc.com',
    'zahra@studyinnc.com',
    'christiane@studyinnc.com'
  ) ORDER BY email;
  
  -- Check user-organization access:
  SELECT 
    u.email,
    u.name as user_name,
    o.name as org_name,
    o.slug as org_slug,
    r.name as role_name
  FROM users_organizations uo
  JOIN users u ON uo.user_id = u.id
  JOIN organizations o ON uo.organization_id = o.id
  JOIN roles r ON uo.role_id = r.id
  WHERE u.email IN ('joseph@studyinnc.com', 'safak@studyinnc.com', 'grace@studyinnc.com', 'jesse@studyinnc.com', 'abdulraheem@studyinnc.com', 'selman@studyinnc.com', 'zahra@studyinnc.com', 
'christiane@studyinnc.com')
  ORDER BY u.email, o.name;
  
  -- Count organizations per user:
  SELECT 
    u.email,
    COUNT(uo.organization_id) as org_count
  FROM users u
  LEFT JOIN users_organizations uo ON u.id = uo.user_id
  WHERE u.email IN ('joseph@studyinnc.com', 'safak@studyinnc.com', 'grace@studyinnc.com', 'jesse@studyinnc.com', 'abdulraheem@studyinnc.com', 'selman@studyinnc.com', 'zahra@studyinnc.com', 
'christiane@studyinnc.com')
  GROUP BY u.email
  ORDER BY u.email;
  ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
ΓöÇΓöÇΓöÇΓöÇ
  
  ≡ƒÆí To execute:
     1. Copy the SQL above
     2. Run via wrangler:
        wrangler d1 execute omni-cms --command="<paste SQL above>"
  
     Or via Cloudflare Dashboard:
        Workers & Pages ΓåÆ D1 ΓåÆ omni-cms ΓåÆ Execute SQL
  
  ΓÜá∩╕Å  Important Notes:
     - The script uses INSERT OR IGNORE to avoid duplicates
     - Users must exist in Cloudflare Access to login
     - Add these emails to Cloudflare Access policies:
       - joseph@studyinnc.com
       - safak@studyinnc.com
       - grace@studyinnc.com
       - jesse@studyinnc.com
       - abdulraheem@studyinnc.com
       - selman@studyinnc.com
       - zahra@studyinnc.com
       - christiane@studyinnc.com
  
     Or add the domain @studyinnc.com to Cloudflare Access policies
  
  Γ£à SQL generation complete!


