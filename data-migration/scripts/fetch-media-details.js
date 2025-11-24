/**
 * Fetch Media Details for All Media IDs
 * 
 * Collects all media IDs from fetched data and fetches their details:
 * - Featured media IDs
 * - Media IDs in meta fields
 * - Gets actual URLs, thumbnails, file sizes, etc.
 */

import { fetchWordPressData, fetchAllItems } from '../shared/utils/wordpress-explorer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadWordPressAuth(siteSlug) {
  try {
    const envPath = path.join(__dirname, '../.env.wordpress-auth');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    
    // Site-specific username configuration
    if (siteSlug === 'paris-american-international-university') {
      return {
        username: 'scrape-assist3',
        password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
      };
    }
    
    if (siteSlug === 'study-in-north-cyprus') {
      return {
        username: 'scrape-assist2',
        password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
      };
    }
    
    const username = envContent.match(/WORDPRESS_USERNAME=(.+)/)?.[1]?.trim() || 'scrape-assist';
    return { username, password };
  } catch (error) {
    return null;
  }
}

function extractMediaIds(data) {
  const mediaIds = new Set();
  const mediaReferences = [];
  
  function scanObject(obj, path = 'root') {
    if (obj === null || obj === undefined) return;
    
    // Check featured_media
    if (obj.featured_media && obj.featured_media > 0) {
      mediaIds.add(obj.featured_media);
      mediaReferences.push({
        source: 'featured_media',
        postId: obj.id,
        postType: obj.type,
        mediaId: obj.featured_media,
        path: `${path}.featured_media`,
      });
    }
    
    // Check meta fields for media IDs
    if (obj.meta && typeof obj.meta === 'object') {
      Object.entries(obj.meta).forEach(([key, value]) => {
        if (key.toLowerCase().includes('image') || 
            key.toLowerCase().includes('media') ||
            key.toLowerCase().includes('photo') ||
            key.toLowerCase().includes('thumbnail') ||
            key.toLowerCase().includes('attachment')) {
          
          // Check if value is a media ID (numeric string or number)
          if (typeof value === 'string' && /^\d+$/.test(value) && parseInt(value) > 0) {
            const mediaId = parseInt(value);
            mediaIds.add(mediaId);
            mediaReferences.push({
              source: `meta.${key}`,
              postId: obj.id,
              postType: obj.type,
              mediaId: mediaId,
              path: `${path}.meta.${key}`,
            });
          } else if (typeof value === 'number' && value > 0) {
            mediaIds.add(value);
            mediaReferences.push({
              source: `meta.${key}`,
              postId: obj.id,
              postType: obj.type,
              mediaId: value,
              path: `${path}.meta.${key}`,
            });
          } else if (Array.isArray(value)) {
            // Check if array contains media IDs
            value.forEach((item, index) => {
              if (typeof item === 'string' && /^\d+$/.test(item) && parseInt(item) > 0) {
                const mediaId = parseInt(item);
                mediaIds.add(mediaId);
                mediaReferences.push({
                  source: `meta.${key}[${index}]`,
                  postId: obj.id,
                  postType: obj.type,
                  mediaId: mediaId,
                  path: `${path}.meta.${key}[${index}]`,
                });
              } else if (typeof item === 'number' && item > 0) {
                mediaIds.add(item);
                mediaReferences.push({
                  source: `meta.${key}[${index}]`,
                  postId: obj.id,
                  postType: obj.type,
                  mediaId: item,
                  path: `${path}.meta.${key}[${index}]`,
                });
              }
            });
          }
        }
      });
    }
    
    // Recursively scan nested objects
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      Object.entries(obj).forEach(([key, value]) => {
        if (key !== 'meta' && key !== 'featured_media') {
          scanObject(value, `${path}.${key}`);
        }
      });
    }
  }
  
  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      scanObject(item, `items[${index}]`);
    });
  } else {
    scanObject(data);
  }
  
  return {
    mediaIds: Array.from(mediaIds),
    references: mediaReferences,
  };
}

async function fetchMediaDetails(baseUrl, mediaIds, auth) {
  console.log(`\n  Fetching details for ${mediaIds.length} media items...`);
  
  const mediaDetails = [];
  const failed = [];
  
  // Fetch in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < mediaIds.length; i += batchSize) {
    const batch = mediaIds.slice(i, i + batchSize);
    console.log(`    Fetching batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);
    
    await Promise.all(
      batch.map(async (mediaId) => {
        try {
          const media = await fetchWordPressData(baseUrl, `wp/v2/media/${mediaId}`, {}, auth);
          if (media && media.id) {
            mediaDetails.push(media);
          }
        } catch (error) {
          failed.push({ id: mediaId, error: error.message });
        }
      })
    );
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  console.log(`  ✓ Fetched ${mediaDetails.length} media details`);
  if (failed.length > 0) {
    console.log(`  ⚠ Failed to fetch ${failed.length} media items`);
  }
  
  return { mediaDetails, failed };
}

async function processOrganization(orgSlug, baseUrl) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${orgSlug}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('='.repeat(60));
  
  const auth = await loadWordPressAuth(orgSlug);
  if (!auth) {
    console.log('✗ Could not load credentials');
    return;
  }
  
  const rawDataDir = path.join(__dirname, `../organizations/${orgSlug}/raw-data`);
  const outputDir = path.join(__dirname, `../organizations/${orgSlug}/raw-data/media`);
  
  // Get all content type files
  const contentTypes = ['blogs', 'programs', 'universities', 'team-members', 'reviews', 'academic-staff', 'instructors', 'video-testimonials', 'dormitories'];
  
  const allMediaIds = new Set();
  const allMediaReferences = [];
  
  // Extract media IDs from all content types
  for (const contentType of contentTypes) {
    const filePath = path.join(rawDataDir, contentType, 'raw.json');
    
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      const { mediaIds, references } = extractMediaIds(data);
      
      mediaIds.forEach(id => allMediaIds.add(id));
      allMediaReferences.push(...references.map(ref => ({ ...ref, contentType })));
      
      console.log(`  ${contentType}: Found ${mediaIds.length} media IDs`);
    } catch (error) {
      // File doesn't exist or can't be read - skip
    }
  }
  
  const uniqueMediaIds = Array.from(allMediaIds);
  console.log(`\n  Total unique media IDs found: ${uniqueMediaIds.length}`);
  
  if (uniqueMediaIds.length === 0) {
    console.log('  ⚠ No media IDs found');
    return;
  }
  
  // Fetch media details
  const { mediaDetails, failed } = await fetchMediaDetails(baseUrl, uniqueMediaIds, auth);
  
  // Save media details
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'media-details.json'),
    JSON.stringify(mediaDetails, null, 2)
  );
  
  // Save media references mapping
  await fs.writeFile(
    path.join(outputDir, 'media-references.json'),
    JSON.stringify(allMediaReferences, null, 2)
  );
  
  // Save summary
  const summary = {
    totalMediaIds: uniqueMediaIds.length,
    fetchedMediaDetails: mediaDetails.length,
    failedMediaIds: failed.length,
    mediaByType: {},
    mediaReferences: allMediaReferences.length,
  };
  
  // Group by media type
  mediaDetails.forEach(media => {
    const mimeType = media.mime_type || 'unknown';
    const type = mimeType.split('/')[0] || 'unknown';
    summary.mediaByType[type] = (summary.mediaByType[type] || 0) + 1;
  });
  
  await fs.writeFile(
    path.join(outputDir, 'media-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`\n  ✓ Media details saved to: ${outputDir}/`);
  console.log(`    - media-details.json (${mediaDetails.length} items)`);
  console.log(`    - media-references.json (${allMediaReferences.length} references)`);
  console.log(`    - media-summary.json`);
  
  // Show sample media details
  if (mediaDetails.length > 0) {
    console.log(`\n  Sample media details:`);
    const sample = mediaDetails[0];
    console.log(`    ID: ${sample.id}`);
    console.log(`    Title: ${sample.title?.rendered || sample.title || 'N/A'}`);
    console.log(`    MIME Type: ${sample.mime_type || 'N/A'}`);
    console.log(`    Source URL: ${sample.source_url || sample.guid?.rendered || 'N/A'}`);
    if (sample.media_details?.sizes) {
      console.log(`    Available sizes: ${Object.keys(sample.media_details.sizes).join(', ')}`);
    }
  }
}

async function main() {
  console.log('Fetching Media Details');
  console.log('='.repeat(60));
  console.log('\nThis script will:');
  console.log('1. Extract all media IDs from fetched data');
  console.log('2. Fetch media details (URLs, thumbnails, sizes)');
  console.log('3. Save media details and reference mappings');
  console.log('='.repeat(60));
  
  const organizations = [
    { slug: 'study-in-kazakhstan', baseUrl: 'https://studyinkzk.com' },
    { slug: 'study-in-north-cyprus', baseUrl: 'https://studyinnc.com' },
    { slug: 'paris-american-international-university', baseUrl: 'https://parisamerican.org' },
  ];
  
  for (const org of organizations) {
    await processOrganization(org.slug, org.baseUrl);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between organizations
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✓ Media fetching complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

