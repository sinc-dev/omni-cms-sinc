-- Get user IDs by email for author assignment
SELECT id, email, name
FROM users
WHERE email IN (
  'abdulraheem@studyinnc.com',
  'joseph@studyinnc.com',
  'safak@studyinnc.com',
  'grace@studyinnc.com',
  'jesse@studyinnc.com',
  'selman@studyinnc.com',
  'zahra@studyinnc.com',
  'christiane@studyinnc.com'
)
ORDER BY email;
