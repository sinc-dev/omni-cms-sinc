# Running Remaining SQL INSERT Statements

## Status
✅ **Completed (1/8):**
- paris-american-international-university → programs (503 fields)

⏳ **Remaining (7/8):**

### study-in-north-cyprus (4 statements):
1. dormitories (97 fields)
2. programs (12,025 fields) 
3. reviews (1,019 fields)
4. universities (198 fields)

### study-in-kazakhstan (3 statements):
5. programs (50,650 fields)
6. reviews (1,019 fields)
7. universities (677 fields)

## Option 1: Run All Remaining Statements at Once

You can run the entire SQL file - Cloudflare D1 will execute all statements:

```bash
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/fix-missing-field-attachments.sql
```

**Note:** The paris-american-international-university statement will be skipped automatically due to the `NOT EXISTS` clause.

## Option 2: Run Individual Statements

If you prefer to run them one at a time, you can extract each INSERT statement from the SQL file. Each statement starts with `INSERT INTO post_type_fields` and ends with `);`.

## Verification

After running, verify the results:

```sql
-- Check total attachments created
SELECT 
  o.slug AS organization,
  pt.slug AS post_type,
  COUNT(*) AS attached_fields
FROM post_type_fields ptf
JOIN post_types pt ON ptf.post_type_id = pt.id
JOIN organizations o ON pt.organization_id = o.id
GROUP BY o.slug, pt.slug
ORDER BY o.slug, pt.slug;
```

Expected totals:
- study-in-north-cyprus: 13,339 attachments
- study-in-kazakhstan: 52,346 attachments  
- paris-american-international-university: 503 attachments (already done)

**Total expected: 66,188 attachments**
