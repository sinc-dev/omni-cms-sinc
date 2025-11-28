# Export Instructions for Regenerating Unknown Fields Mapping

## Step 1: Export Unknown Fields Data

Run this SQL in D1 and save the output as `unknown-fields-export.csv`:

```bash
cd "c:\Users\Acer\OneDrive\Documents\Software Projects\SINCUNI\omni-cms-sinc"
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/export-unknown-fields.sql
```

Or copy the SQL from `export-unknown-fields.sql` and run it in D1, then export the results as CSV.

**Save the CSV file as:** `data-migration/scripts/unknown-fields-export.csv`

## Step 2: Export Valid Custom Fields Data

Run this SQL in D1 and save the output as `valid-custom-fields-export.csv`:

```bash
cd "c:\Users\Acer\OneDrive\Documents\Software Projects\SINCUNI\omni-cms-sinc"
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/export-valid-custom-fields.sql
```

Or copy the SQL from `export-valid-custom-fields.sql` and run it in D1, then export the results as CSV.

**Save the CSV file as:** `data-migration/scripts/valid-custom-fields-export.csv`

## Step 3: Run the Regeneration Script

Once both CSV files are in place:

```bash
cd data-migration/scripts
node regenerate-unknown-fields-mapping.js
```

The script will:
- Read the CSV files
- Analyze and match unknown fields to correct fields
- Generate `map-unknown-fields-regenerated.sql`

## Step 4: Execute the Generated SQL

```bash
cd ../..
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/map-unknown-fields-regenerated.sql --yes
```

## Step 5: Verify Results

```bash
npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/check-remaining-unknown-fields.sql --yes
```

## Notes

- The CSV files can be large (2,676+ rows for unknown fields)
- Make sure to save as CSV format (comma-separated values)
- The script expects the CSV files to be in the `data-migration/scripts/` directory
