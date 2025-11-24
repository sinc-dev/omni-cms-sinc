# WordPress to Omni-CMS Data Migration

This directory contains scripts and tools for migrating data from WordPress sites to Omni-CMS (Cloudflare).

## Current Status

### ✅ Completed

1. **Public API Routes Documentation** (`PUBLIC_API_ROUTES.md`)
   - Complete documentation of all public API endpoints
   - Ready for use in Next.js applications

2. **Organization Setup**
   - Created organizations in Cloudflare
   - Generated API keys
   - Saved credentials securely

3. **WordPress API Discovery & Data Fetching**
   - ✅ Discovered WordPress REST API v2 endpoints work with authentication
   - ✅ Successfully fetched all data from Study In Kazakhstan (6,200+ items)
   - ✅ Successfully fetched all data from Study in North Cyprus (1,300+ items) - Fixed 2025-11-24
   - ✅ Successfully fetched all data from Paris American International University (139 items)
   - ✅ Fetched all JetEngine custom post types
   - ✅ Fetched media details for all organizations (1,301 media items total)

### ✅ Successfully Fetched

**Study In Kazakhstan:**
- ✅ 21 blog posts
- ✅ 6 video testimonials
- ✅ 14 team members
- ✅ 129 reviews
- ✅ **5,102 programs** (plus 765 old programs)
- ✅ 114 universities (plus 7 old universities)
- ✅ 13 categories, 112 tags
- ✅ 25 authors

**Total: ~6,200+ items fetched and saved**

See `FETCH_SUMMARY.md` for complete details.

## Quick Start

### 1. Fetch WordPress Data

Data has been fetched from Study In Kazakhstan. To fetch from other sites or re-fetch:

```bash
npm run fetch-all
```

This will:
- Fetch all WordPress blog posts
- Fetch all JetEngine custom post types
- Fetch taxonomies (categories, tags)
- Fetch authors
- Save to `organizations/{slug}/raw-data/`

**Note**: All sites are now working! Use `scrape-assist2` for Study in North Cyprus.

### 2. Transform Data ✅

Data transformation is complete! Run:

```bash
npm run transform
```

This will:
- Transform WordPress format to Omni-CMS format
- Map relationships (media, taxonomies, authors)
- Clean and normalize data
- Extract custom fields from JetEngine meta
- Save transformed data to `organizations/{slug}/transformed/`

**Transformed Data:**
- Study In Kazakhstan: 5,406 items transformed
- Study in North Cyprus: 1,269 items transformed
- Paris American International University: 119 items transformed

### 3. Import to Cloudflare

(Next step - script to be created)
- Upload media to R2
- Create posts via API
- Link relationships
- Map taxonomies

## Available Scripts

```bash
# Test Cloudflare API
npm run test-api-quick

# Setup organizations and API keys
npm run setup-orgs

# Fetch media details for all organizations
npm run fetch-media

# Transform WordPress data to Omni-CMS format
npm run transform

# Parse WordPress XML exports
npm run parse-xml

# Discover JetEngine post types (if API was available)
npm run discover-types
```

## File Structure

```
data-migration/
├── organizations/
│   ├── study-in-kazakhstan/
│   │   ├── export.xml              # WordPress XML export (you need to add this)
│   │   ├── parsed-data/            # Parsed JSON files (generated)
│   │   └── scripts/
│   ├── study-in-north-cyprus/
│   │   └── ...
│   └── paris-american-international-university/
│       └── ...
├── scripts/
│   ├── parse-wordpress-xml.js      # Parse XML exports
│   ├── setup-organizations-with-keys.js
│   └── ...
├── PUBLIC_API_ROUTES.md            # Public API documentation
├── WORDPRESS_API_BLOCKED.md        # API blocking issue and solutions
└── package.json
```

## Documentation

- **`PUBLIC_API_ROUTES.md`** - Complete public API routes for Next.js apps
- **`WORDPRESS_API_BLOCKED.md`** - WordPress API blocking issue and solutions
- **`SETUP_INSTRUCTIONS.md`** - Setup guide for organizations
- **`EXPLORATION_GUIDE.md`** - Data exploration guide

## Next Steps

1. ✅ Export WordPress XML files from admin
2. ✅ Parse XML files to extract data
3. ✅ Transform data to Omni-CMS format
4. ⏳ Create post types in Omni-CMS for each organization
5. ⏳ Import taxonomies (categories and tags) to Omni-CMS
6. ⏳ Upload media files to R2 and create media mapping
7. ⏳ Map WordPress authors to Omni-CMS users
8. ⏳ Import transformed posts to Omni-CMS with all relationships

## Notes

- WordPress REST API is blocked by Xecurify security plugin
- XML export is the recommended approach
- All scripts handle large datasets (5000+ programs)
- Progress tracking included for long operations
