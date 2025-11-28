# Regenerate Unknown Fields Mapping SQL

## Overview

This script queries the current database to analyze unknown fields and generate SQL to map them to correct custom fields based on value patterns.

## How It Works

1. **Queries Database**: Gets all unknown fields with their values, post types, and organizations
2. **Gets Valid Fields**: Retrieves all valid custom fields by organization and post type
3. **Pattern Matching**: Matches unknown fields to correct fields based on:
   - Currency codes (USD, EUR, etc.) → `tuition_currency`
   - Degree levels (Undergraduate, Postgraduate, PhD) → `degree_level`
   - Languages (English, Kazakh, Russian) → `language`
   - Durations (2, 4, 3-4) → `duration_in_years`
   - Prices (3500.0, 5000.0) → `yearly_tuition_fee`
   - Media placeholders (wp-media-*) → `logo`, `featured_image`, etc.
   - University names → `associated_university_name`
   - Disciplines → `disciplines`
   - Entry requirements → `entry_requirements`
   - Review content → review fields
   - And more...

4. **Generates SQL**: Creates UPDATE statements to map unknown fields to correct fields

## Usage

```bash
cd data-migration/scripts
node regenerate-unknown-fields-mapping.js
```

The script will:
- Query the remote database
- Analyze all unknown fields
- Generate `map-unknown-fields-regenerated.sql`

## Review and Execute

1. **Review the generated SQL**:
   ```bash
   cat map-unknown-fields-regenerated.sql
   ```

2. **Execute the mapping**:
   ```bash
   cd ../..
   npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/map-unknown-fields-regenerated.sql --yes
   ```

3. **Verify results**:
   ```bash
   npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/check-remaining-unknown-fields.sql --yes
   ```

## Notes

- The script uses pattern matching, so some fields may not be matched if their values don't match known patterns
- Unmatched fields will be listed in the console output
- The generated SQL handles duplicate prevention
- Widget code fields (position: fixed) are NOT included - delete those separately

## Expected Results

Based on the analysis:
- **~2,381 fields** should be mapped (real data)
- **~271 fields** should be mapped (media placeholders)
- **~24 fields** should be deleted separately (widget code)
