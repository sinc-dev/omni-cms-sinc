# Media Fetch Summary

## Overview

This document summarizes the media references found in the fetched WordPress data and the media details that were retrieved.

## Media References Found

### Study in Kazakhstan

**Total Unique Media IDs: 1,051**

- **Blogs**: 21 featured media IDs
- **Universities**: 1,013 media IDs in meta fields
  - `university_background_image` (main background image)
  - `photos` (array of photo IDs)
  - `photo1`, `photo2`, `photo3`, `photo4` (individual photo IDs)
- **Team Members**: 13 featured media IDs
- **Video Testimonials**: 6 media IDs

### Paris American International University

**Total Unique Media IDs: ~119**

- **Blogs**: 46 featured media IDs
- **Programs**: 45 media IDs in `meta.image` field
- **Academic Staff**: 10 featured media IDs
- **Team Members**: 4 featured media IDs
- **Instructors**: 14 featured media IDs

## Media Details Fetched

For each media ID, we fetch:

1. **Source URL** - Full-size original image URL
2. **Thumbnail URLs** - All available sizes:
   - `thumbnail` (150x150)
   - `medium` (300x300)
   - `medium_large` (768x768)
   - `large` (1024x1024)
   - `full` (original size)
3. **File Metadata**:
   - MIME type (image/jpeg, image/png, etc.)
   - File size (bytes)
   - Dimensions (width x height)
4. **Media Details**:
   - Title
   - Description
   - Alt text
   - Caption

## File Structure

```
organizations/
  {org-slug}/
    raw-data/
      media/
        ├── media-details.json       # Full media information with URLs
        ├── media-references.json    # Mapping of media to posts
        └── media-summary.json       # Summary statistics
```

## Usage

### Finding Media for a Post

1. Check `media-references.json` to find all media IDs associated with a post
2. Look up media details in `media-details.json` using the media ID
3. Use the appropriate size URL based on your needs:
   - `media_details.sizes.thumbnail.source_url` - Small thumbnails
   - `media_details.sizes.medium.source_url` - Medium-sized images
   - `media_details.sizes.large.source_url` - Large images
   - `source_url` - Original full-size image

### Example

```javascript
// Load media references
const references = JSON.parse(fs.readFileSync('media-references.json'));
const mediaDetails = JSON.parse(fs.readFileSync('media-details.json'));

// Find media for a specific post
const postMedia = references.filter(ref => ref.postId === '57436');

// Get media details
postMedia.forEach(ref => {
  const media = mediaDetails.find(m => m.id === ref.mediaId);
  console.log(`Media ${ref.source}: ${media.source_url}`);
  console.log(`Thumbnail: ${media.media_details.sizes.thumbnail.source_url}`);
});
```

## Notes

- Media IDs in meta fields are stored as strings or numbers
- Some posts may have multiple media references (e.g., universities with multiple photos)
- Featured media is the primary image for a post
- Meta field media IDs are custom fields specific to JetEngine post types

