-- Step 1: Create users (if they don't exist)

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
  strftime('%s', 'now'),
  strftime('%s', 'now')
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
  strftime('%s', 'now'),
  strftime('%s', 'now')
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
  strftime('%s', 'now'),
  strftime('%s', 'now')
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
  strftime('%s', 'now'),
  strftime('%s', 'now')
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
  strftime('%s', 'now'),
  strftime('%s', 'now')
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
  strftime('%s', 'now'),
  strftime('%s', 'now')
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
  strftime('%s', 'now'),
  strftime('%s', 'now')
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
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Step 2: Grant access to all organizations

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


