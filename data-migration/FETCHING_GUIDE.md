# Data Fetching Guide

## Overview

This guide explains how to fetch ALL data from WordPress sites, including handling large datasets (5000+ programs).

## Scripts Available

### 1. `fetch-all-data.js` - **Full Fetch (Recommended)**
Fetches **ALL** data from all WordPress sites.

**Features:**
- ✅ Handles large datasets (5000+ items)
- ✅ Progress tracking
- ✅ Saves all data to organized folders
- ✅ Fetches taxonomies and authors
- ✅ Downloads media files

**Usage:**
```bash
node scripts/fetch-all-data.js
```

**What it fetches:**
- All blog posts
- All team members / academic staff
- All universities
- **ALL programs (5000+ for studyinkzk.com)**
- Categories and tags
- Authors/users
- Media files

### 2. `fetch-all-data-quick.js` - **Test Fetch**
Quick test to verify endpoints work before full fetch.

**Usage:**
```bash
node scripts/fetch-all-data-quick.js
```

Fetches first 5 pages (~500 items) to test.

### 3. Individual Site Scrapers
Each organization has its own scraper in `organizations/{slug}/scripts/scrape.js`

## Handling Large Datasets

### Study In Kazakhstan - 5000+ Programs

The scripts are configured to handle this:

1. **No page limits** - Fetches all pages
2. **Progress tracking** - Shows progress every 10 pages or 1000 items
3. **Efficient pagination** - Uses WordPress REST API pagination
4. **Error handling** - Continues on errors, logs issues

### Estimated Time

For 5000+ programs:
- **~50-100 API requests** (100 items per page)
- **~5-10 minutes** depending on server response time
- **Progress updates** every 10 pages

## Output Structure

After fetching, data is organized as:

```
organizations/
  study-in-kazakhstan/
    raw-data/
      blogs/
        raw.json          # All blog posts
      team-members/
        raw.json          # All team members
      universities/
        raw.json          # All universities
      programs/
        raw.json          # ALL programs (5000+)
      media/              # Downloaded media files
      taxonomies.json     # Categories and tags
      authors.json        # All authors
      fetch-summary.json  # Summary of what was fetched
```

## Progress Tracking

The script shows progress:
```
Fetching programs...
  Page 10: 1000 items fetched...
  Page 20: 2000 items fetched...
  Page 30: 3000 items fetched...
  ...
  ✓ Fetched 5234 programs
```

## Error Handling

- **Network errors**: Retries automatically
- **Rate limiting**: Includes delays between requests
- **Missing data**: Logs warnings, continues
- **Partial failures**: Saves what was fetched

## After Fetching

Once data is fetched:

1. **Review the data**:
   ```bash
   # Check summary
   cat organizations/study-in-kazakhstan/raw-data/fetch-summary.json
   
   # Count items
   node -e "const d=require('./organizations/study-in-kazakhstan/raw-data/programs/raw.json'); console.log(d.length)"
   ```

2. **Transform the data** (next step):
   - Convert WordPress format to Omni-CMS format
   - Map relationships
   - Clean and normalize

3. **Import to Cloudflare**:
   - Upload media to R2
   - Create posts via API
   - Link relationships

## Tips

1. **Run during off-peak hours** for large datasets
2. **Monitor progress** - the script shows updates
3. **Check fetch-summary.json** after completion
4. **Verify data** - spot check a few items
5. **Keep raw data** - don't delete until import is complete

## Troubleshooting

### "Rate limited" or "429 errors"
- The script includes delays, but if you see this:
- Increase delays in the script
- Run during off-peak hours

### "Timeout" errors
- Some endpoints may be slow
- The script will continue and log errors
- Check `fetch-summary.json` for what succeeded

### "Missing media files"
- Media downloads may fail for some files
- Check `media-map.json` for what was downloaded
- You can re-run media download separately if needed

### "Out of memory"
- For very large datasets, process in batches
- Or increase Node.js memory: `node --max-old-space-size=4096 scripts/fetch-all-data.js`

