# Study In Kazakhstan - Migration Scripts

## Scraping

### Prerequisites
- Node.js 18+
- Access to studyinkzk.com WordPress REST API

### Usage

```bash
# Install dependencies (if needed)
pnpm install

# Run scraper
pnpm tsx scrape.js
```

### Configuration

Edit `scrape.js` to adjust:
- `BASE_URL` - WordPress site URL
- `CONTENT_TYPES` - Map of content types to WordPress endpoints
- Pagination settings

### Output

Raw data will be saved to `../raw-data/`:
- `blogs/raw.json` - All blog posts
- `team-members/raw.json` - All team member posts
- `universities/raw.json` - All university posts
- `programs/raw.json` - All program posts
- `media/` - Downloaded media files
- `taxonomies.json` - Categories and tags

## Transformation

After scraping, run the transformation script to convert WordPress data to Omni-CMS format.

## Import

After transformation, use the import script to upload data to Cloudflare.

