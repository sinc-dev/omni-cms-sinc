# WordPress Data Exploration Guide

## Purpose

Before migrating data, we need to understand:
1. **What data exists** on each WordPress site
2. **How it's structured** (fields, types, relationships)
3. **What relationships** exist between entities
4. **What dates** are tracked (created, updated, published)
5. **Who authored** the content
6. **What taxonomies** are used (categories, tags, custom)

## Step-by-Step Exploration

### Step 1: High-Level Exploration

Run the exploration script to get an overview:

```bash
cd data-migration
pnpm tsx scripts/explore-wordpress-sites.js
```

This will:
- ✅ Test if WordPress REST API is accessible
- ✅ Discover all available post types
- ✅ Count categories, tags, and authors
- ✅ Analyze basic structure of each post type
- ✅ Generate reports in `organizations/{slug}/analysis-report.json`

### Step 2: Deep Data Analysis

Run the detailed analysis script:

```bash
pnpm tsx scripts/analyze-sample-data.js
```

This will:
- ✅ Fetch sample data from each site
- ✅ Analyze field structure and types
- ✅ Identify all date fields
- ✅ Map relationships (categories → posts, tags → posts, etc.)
- ✅ Detect custom fields
- ✅ Generate detailed reports in `organizations/{slug}/detailed-analysis.json`

### Step 3: Review the Reports

Open the generated JSON files and look for:

#### Date Fields
```json
{
  "dates": {
    "fields": ["date", "date_gmt", "modified", "modified_gmt"],
    "patterns": {
      "date": {
        "sample": "2024-01-15T10:30:00",
        "format": "ISO 8601"
      }
    }
  }
}
```

#### Relationships
```json
{
  "relationships": {
    "categories": [1, 2, 3],
    "tags": [10, 20, 30],
    "authors": [1],
    "featuredMedia": [100]
  }
}
```

#### Field Structure
```json
{
  "structure": {
    "allFields": ["id", "title", "content", "author", ...],
    "fieldTypes": {
      "title": { "type": "object", "isObject": true },
      "author": { "type": "number" },
      "categories": { "type": "object", "isArray": true }
    }
  }
}
```

### Step 4: Document Findings

Create a document for each organization noting:

1. **Post Types Available**
   - Standard posts
   - Custom post types (team-members, universities, etc.)

2. **Date Fields**
   - Created date field name
   - Updated date field name
   - Published date field name
   - Any other date fields

3. **Relationships**
   - How categories are linked
   - How tags are linked
   - How authors are linked
   - How media is linked
   - Any custom relationships

4. **Custom Fields**
   - Field names
   - Field types
   - Field structure

5. **Taxonomies**
   - Category structure (hierarchical?)
   - Tag structure
   - Custom taxonomies

## Questions to Answer

After exploration, you should be able to answer:

- [ ] What post types exist on each site?
- [ ] What are the exact field names for dates?
- [ ] How are categories structured? (hierarchical?)
- [ ] How are tags structured?
- [ ] What author information is available?
- [ ] What custom fields exist?
- [ ] How are relationships stored? (IDs? Objects?)
- [ ] What media fields exist?
- [ ] Are there any custom taxonomies?
- [ ] What's the structure of custom post types?

## Next Steps After Exploration

Once you understand the data structure:

1. **Create transformation schemas** - Map WordPress fields to Omni-CMS fields
2. **Create transformation scripts** - Convert WordPress data to Omni-CMS format
3. **Create import scripts** - Upload transformed data to Cloudflare

## Example: What to Look For

### Example Post Structure
```json
{
  "id": 123,
  "date": "2024-01-15T10:30:00",
  "date_gmt": "2024-01-15T08:30:00",
  "modified": "2024-01-20T15:45:00",
  "modified_gmt": "2024-01-20T13:45:00",
  "slug": "example-post",
  "status": "publish",
  "title": { "rendered": "Example Post" },
  "content": { "rendered": "<p>Content...</p>" },
  "excerpt": { "rendered": "<p>Excerpt...</p>" },
  "author": 1,
  "featured_media": 456,
  "categories": [1, 2],
  "tags": [10, 20],
  "acf_custom_field": "value"
}
```

### Mapping to Omni-CMS
- `date` → `publishedAt`
- `modified` → `updatedAt`
- `author` → `authorId` (need to map WordPress user ID to Omni-CMS user ID)
- `featured_media` → `featuredImageId` (need to upload media first)
- `categories` → taxonomy term IDs
- `tags` → taxonomy term IDs
- `acf_custom_field` → custom field

## Tips

1. **Start with one site** - Understand one site fully before moving to others
2. **Check for custom endpoints** - Some WordPress sites have custom REST API endpoints
3. **Look for ACF fields** - Advanced Custom Fields plugin adds `acf_` prefixed fields
4. **Check media URLs** - Media might be on CDN or different domain
5. **Verify relationships** - Some relationships might be in custom fields, not standard fields

