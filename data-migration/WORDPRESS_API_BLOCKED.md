# WordPress REST API Blocked - Alternative Solutions

## Problem

The WordPress REST API is completely blocked by **Xecurify Security Plugin**:
- All endpoints return 403 Forbidden
- Error message: "With the free plan, only WordPress default endpoints can be authenticated"
- Even default WordPress endpoints (`wp/v2/posts`, `wp/v2/categories`, etc.) are blocked
- JetEngine custom post types cannot be accessed via REST API

## Impact

- Cannot fetch data via REST API
- Cannot access:
  - Programs (5000+ items)
  - Universities
  - Team Members
  - Blog Posts
  - Taxonomies
  - Media

## Alternative Solutions

### Option 1: WordPress XML Export (Recommended)

**Steps:**
1. Log into WordPress Admin
2. Go to **Tools > Export**
3. Select "All content" or specific post types
4. Click "Download Export File"
5. You'll get an XML file with all data

**Pros:**
- ✅ Includes all content (posts, pages, custom post types)
- ✅ Includes metadata, taxonomies, authors
- ✅ Standard WordPress format
- ✅ Works with JetEngine post types
- ✅ No API access needed

**Cons:**
- ⚠️ Manual process (need to export from each site)
- ⚠️ Media files need to be downloaded separately

**Implementation:**
We can create a script to parse WordPress XML exports and convert them to our format.

### Option 2: Database Direct Access

If you have database access:

**Steps:**
1. Connect to WordPress database
2. Query `wp_posts` table for custom post types
3. Query `wp_postmeta` for custom fields
4. Query `wp_term_relationships` for taxonomies

**Pros:**
- ✅ Direct access to all data
- ✅ Can export everything programmatically
- ✅ Includes all metadata

**Cons:**
- ⚠️ Requires database credentials
- ⚠️ Need to understand WordPress database structure

### Option 3: WP All Export Plugin

If WP All Export plugin is installed:

**Steps:**
1. Install/Activate WP All Export plugin
2. Create export template for each post type
3. Export to CSV/JSON
4. Process exported files

**Pros:**
- ✅ Can export custom post types
- ✅ Can filter and format data
- ✅ Multiple export formats

**Cons:**
- ⚠️ Requires plugin installation
- ⚠️ May need premium version for custom post types

### Option 4: HTML Scraping (Last Resort)

Scrape public-facing website HTML:

**Pros:**
- ✅ No API access needed
- ✅ Can get public content

**Cons:**
- ⚠️ Very complex
- ⚠️ May miss metadata
- ⚠️ Fragile (breaks if HTML changes)
- ⚠️ Slow for 5000+ items
- ⚠️ May violate terms of service

## Recommended Approach

**Use WordPress XML Export** - This is the most reliable and complete solution:

1. **Export from WordPress Admin:**
   - Study In Kazakhstan: Export all content
   - Study in North Cyprus: Export all content
   - Paris American International University: Export all content

2. **Save XML files:**
   ```
   data-migration/
     organizations/
       study-in-kazakhstan/
         export.xml
       study-in-north-cyprus/
         export.xml
       paris-american-international-university/
         export.xml
   ```

3. **Parse XML files:**
   - We'll create a script to parse WordPress XML
   - Extract all post types (programs, universities, etc.)
   - Extract taxonomies, authors, dates
   - Convert to our format

4. **Download Media:**
   - Extract media URLs from XML
   - Download images/files
   - Upload to Cloudflare R2

## Next Steps

1. **Export XML files** from WordPress admin for each site
2. **Place XML files** in the organization folders
3. **Run parsing script** to extract and structure data
4. **Transform data** to Omni-CMS format
5. **Import to Cloudflare** via API

## Scripts Available

Once you have XML exports, we can use:
- `scripts/parse-wordpress-xml.js` - Parse WordPress XML exports
- `scripts/transform-to-omni-cms.js` - Transform to Omni-CMS format
- `scripts/import-to-cloudflare.js` - Import via API

## Questions?

- Do you have access to WordPress admin to export XML?
- Do you have database access?
- Is WP All Export plugin available?
