# Data Migration Scripts

## Exploration Scripts

### 1. `explore-wordpress-sites.js`
**Purpose**: High-level exploration of WordPress sites

**What it does**:
- Tests API accessibility
- Discovers available post types
- Analyzes categories, tags, and authors
- Examines custom post types
- Generates structure reports

**Usage**:
```bash
pnpm tsx scripts/explore-wordpress-sites.js
```

**Output**:
- `organizations/{slug}/analysis-report.json` - Individual site reports
- `wordpress-analysis-combined.json` - Combined report

### 2. `analyze-sample-data.js`
**Purpose**: Deep analysis of sample data

**What it does**:
- Fetches sample posts, categories, tags, authors
- Analyzes field structure and types
- Identifies date fields (created, updated, published)
- Maps relationships (categories, tags, authors, media)
- Detects custom fields
- Examines nested objects and arrays

**Usage**:
```bash
pnpm tsx scripts/analyze-sample-data.js
```

**Output**:
- `organizations/{slug}/detailed-analysis.json` - Detailed analysis per site
- `wordpress-detailed-analysis.json` - Combined detailed analysis

## Setup Scripts

### 3. `create-organizations.ts`
**Purpose**: Create organizations in Omni-CMS

**Usage**:
```bash
API_KEY=your-token pnpm tsx scripts/create-organizations.ts
```

## Workflow

1. **First**: Run `explore-wordpress-sites.js` to get overview
2. **Second**: Run `analyze-sample-data.js` to understand data structure
3. **Review**: Check the generated JSON files to understand:
   - What fields exist
   - How dates are structured
   - What relationships exist
   - What custom fields are used
4. **Then**: Create transformation scripts based on findings
5. **Finally**: Create import scripts

## Understanding the Analysis

### Date Fields
Look for fields containing "date" or "Date":
- `date` - Publication date
- `date_gmt` - Publication date (GMT)
- `modified` - Last modified date
- `modified_gmt` - Last modified date (GMT)

### Relationships
- `categories` - Array of category IDs
- `tags` - Array of tag IDs
- `author` - Author user ID
- `featured_media` - Featured image media ID

### Custom Fields
Fields starting with `acf_`, `custom_`, or containing `_field` are likely custom fields from Advanced Custom Fields or similar plugins.

