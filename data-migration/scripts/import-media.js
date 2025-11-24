/**
 * Import Media Files to Omni-CMS
 * 
 * Downloads media files from WordPress and uploads them to R2 via Omni-CMS API
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadMedia } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Download file from URL
 */
async function downloadFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Import media files for an organization
 */
export async function importMedia(baseUrl, orgId, orgSlug, testLimit = null) {
  const mediaMap = new Map(); // Maps WordPress media ID -> Omni-CMS media ID

  // Load media details
  const mediaDetailsPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/raw-data/media/media-details.json`
  );

  let mediaDetails = [];
  try {
    const content = await fs.readFile(mediaDetailsPath, 'utf-8');
    mediaDetails = JSON.parse(content);
  } catch (error) {
    console.warn(`   ⚠ Could not load media details: ${error.message}`);
    return mediaMap;
  }

  // Apply test limit if provided
  if (testLimit && mediaDetails.length > testLimit) {
    console.log(`   ⚠ TEST MODE: Limiting media from ${mediaDetails.length} to ${testLimit} files`);
    mediaDetails = mediaDetails.slice(0, testLimit);
  }

  console.log(`   Found ${mediaDetails.length} media files to import`);

  // Process media files in batches to avoid overwhelming the server
  const BATCH_SIZE = 10;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < mediaDetails.length; i += BATCH_SIZE) {
    const batch = mediaDetails.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (media) => {
      try {
        // Get download URL from media details
        const downloadUrl = media.source_url || media.guid?.rendered;
        if (!downloadUrl) {
          console.warn(`   ⚠ No download URL for media ${media.id}, skipping`);
          skipped++;
          return;
        }

        // Download file
        const blob = await downloadFile(downloadUrl);
        
        // Create File object from blob
        const filename = media.slug || `media-${media.id}`;
        const fileExtension = path.extname(downloadUrl) || '.jpg';
        const file = new File([blob], `${filename}${fileExtension}`, {
          type: media.mime_type || blob.type,
        });

        // Upload to Omni-CMS
        const uploaded = await uploadMedia(baseUrl, orgId, file, {
          alt_text: media.alt_text || media.title?.rendered || '',
          caption: media.caption?.rendered || media.description?.rendered || '',
        });

        mediaMap.set(media.id, uploaded.id);
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`   Progress: ${processed}/${mediaDetails.length} uploaded`);
        }
      } catch (error) {
        console.error(`   ✗ Failed to import media ${media.id}:`, error.message);
        failed++;
      }
    }));

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < mediaDetails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`   ✓ Uploaded ${processed} media files (${skipped} skipped, ${failed} failed)`);

  // Save mapping for later use
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/media.json`
  );
  await fs.mkdir(path.dirname(mappingPath), { recursive: true });
  await fs.writeFile(mappingPath, JSON.stringify(Object.fromEntries(mediaMap), null, 2));

  return mediaMap;
}

