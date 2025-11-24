# Data Migration Plan: WordPress to Omni-CMS

## Overview
This plan outlines the process for migrating content from WordPress sites to Omni-CMS, organizing data by organization, and populating Cloudflare D1 database.

## Organizations

### 1. Study In Kazakhstan (studyinkzk.com)
- **Slug**: `study-in-kazakhstan`
- **Content Types**:
  - Blogs
  - Team Members (custom post type)
  - Universities
  - Programs

### 2. Study in North Cyprus (studyinnc.com)
- **Slug**: `study-in-north-cyprus`
- **Content Types**:
  - Blogs
  - Team Members (custom post type)
  - Universities
  - Programs

### 3. Paris American International University
- **Slug**: `paris-american-international-university`
- **Content Types**:
  - Blogs
  - Academic Staff (custom post type)
  - Programs

## Migration Strategy

### Phase 1: Data Collection
1. **WordPress API Scraping**
   - Identify WordPress REST API endpoints for each site
   - Extract posts, custom post types, media, taxonomies
   - Store raw JSON data in organized folders

2. **Data Organization**
   - Organize by organization
   - Separate by content type
   - Preserve relationships (categories, tags, featured images, etc.)

### Phase 2: Data Transformation
1. **Schema Mapping**
   - Map WordPress post types to Omni-CMS post types
   - Transform WordPress taxonomies to Omni-CMS taxonomies
   - Convert WordPress media to R2 storage references

2. **Data Cleaning**
   - Normalize dates, slugs, URLs
   - Extract and clean HTML content
   - Handle special characters and encoding

### Phase 3: Data Import
1. **Organization Creation**
   - Create organizations in D1 database
   - Set up post types for each organization
   - Configure taxonomies (categories, tags, etc.)

2. **Content Import**
   - Import posts with proper relationships
   - Upload media to R2 and update references
   - Link taxonomies and custom fields

3. **Validation**
   - Verify all content imported correctly
   - Check relationships and references
   - Validate URLs and media links

## Folder Structure

```
data-migration/
├── organizations/
│   ├── study-in-kazakhstan/
│   │   ├── raw-data/
│   │   │   ├── blogs/
│   │   │   ├── team-members/
│   │   │   ├── universities/
│   │   │   ├── programs/
│   │   │   └── media/
│   │   ├── transformed/
│   │   │   ├── blogs/
│   │   │   ├── team-members/
│   │   │   ├── universities/
│   │   │   └── programs/
│   │   └── scripts/
│   │       ├── scrape.js
│   │       ├── transform.js
│   │       └── import.js
│   ├── study-in-north-cyprus/
│   │   ├── raw-data/
│   │   ├── transformed/
│   │   └── scripts/
│   └── paris-american-international-university/
│       ├── raw-data/
│       ├── transformed/
│       └── scripts/
├── shared/
│   ├── schemas/
│   │   ├── blog-schema.ts
│   │   ├── team-member-schema.ts
│   │   ├── university-schema.ts
│   │   └── program-schema.ts
│   ├── transformers/
│   │   ├── wordpress-to-omni.ts
│   │   └── media-transformer.ts
│   └── utils/
│       ├── api-client.ts
│       └── validators.ts
└── scripts/
    ├── create-organizations.ts
    ├── setup-post-types.ts
    └── bulk-import.ts
```

## Implementation Steps

### Step 1: Setup Organizations
- Create organizations via API
- Configure slugs and metadata

### Step 2: Setup Post Types
- Create post types for each organization:
  - Blog (standard)
  - Team Member / Academic Staff
  - University
  - Program

### Step 3: Setup Taxonomies
- Categories (for blogs)
- Tags (for blogs)
- University Types
- Program Categories
- Locations

### Step 4: Scrape WordPress Data
- Use WordPress REST API
- Handle pagination
- Download media files
- Store raw JSON

### Step 5: Transform Data
- Map to Omni-CMS schema
- Handle relationships
- Clean and normalize

### Step 6: Import to Cloudflare
- Upload media to R2
- Create posts via API
- Link relationships
- Set taxonomies

## WordPress API Endpoints

### Standard WordPress REST API
- Posts: `/wp-json/wp/v2/posts`
- Pages: `/wp-json/wp/v2/pages`
- Media: `/wp-json/wp/v2/media`
- Categories: `/wp-json/wp/v2/categories`
- Tags: `/wp-json/wp/v2/tags`
- Custom Post Types: `/wp-json/wp/v2/{post-type}`

### Custom Endpoints (if needed)
- May need custom endpoints for specific post types
- Check each site's available endpoints

## Data Mapping

### Blog Post
- WordPress `post` → Omni-CMS `blog` post type
- `title` → `title`
- `content.rendered` → `content`
- `excerpt.rendered` → `excerpt`
- `featured_media` → `featuredImageId`
- `categories` → taxonomy terms
- `tags` → taxonomy terms

### Team Member / Academic Staff
- WordPress custom post type → Omni-CMS `team-member` / `academic-staff` post type
- Custom fields → custom fields in Omni-CMS
- Featured image → media reference

### University
- WordPress custom post type → Omni-CMS `university` post type
- Location data → custom fields
- Programs → relationships

### Program
- WordPress custom post type → Omni-CMS `program` post type
- University → relationship
- Requirements → custom fields

## Next Steps

1. ✅ Create folder structure
2. ⏳ Identify WordPress API endpoints for each site
3. ⏳ Create scraping scripts
4. ⏳ Create transformation scripts
5. ⏳ Create import scripts
6. ⏳ Test with one organization
7. ⏳ Scale to all organizations

