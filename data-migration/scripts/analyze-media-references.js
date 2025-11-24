/**
 * Analyze Media References in Fetched Data
 * 
 * Checks for:
 * - featured_media (WordPress media IDs)
 * - Direct image URLs in properties/metadata
 * - Media references in custom fields
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findMediaReferences(obj, path = 'root', results = []) {
  if (obj === null || obj === undefined) return results;
  
  if (typeof obj === 'string') {
    // Check if it's a URL
    if (obj.match(/^https?:\/\//i) || obj.match(/\.(jpg|jpeg|png|gif|webp|svg|pdf|mp4|mp3)/i)) {
      results.push({ path, value: obj, type: 'url' });
    }
    // Check if it's a numeric ID (could be media ID)
    if (/^\d+$/.test(obj) && parseInt(obj) > 0) {
      results.push({ path, value: obj, type: 'possible_id' });
    }
  } else if (typeof obj === 'number') {
    // Could be a media ID
    if (obj > 0) {
      results.push({ path, value: obj.toString(), type: 'possible_id' });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      findMediaReferences(item, `${path}[${index}]`, results);
    });
  } else if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = path === 'root' ? key : `${path}.${key}`;
      
      // Check for common media-related keys
      if (key.toLowerCase().includes('media') || 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('thumbnail') ||
          key.toLowerCase().includes('photo') ||
          key.toLowerCase().includes('picture') ||
          key.toLowerCase().includes('url') ||
          key.toLowerCase().includes('attachment')) {
        results.push({ path: newPath, value: JSON.stringify(value).substring(0, 200), type: 'media_key' });
      }
      
      findMediaReferences(value, newPath, results);
    });
  }
  
  return results;
}

async function analyzeFile(filePath, contentType) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Analyzing: ${contentType}`);
  console.log(`File: ${filePath}`);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log('  ⚠ Empty or invalid data');
      return null;
    }
    
    console.log(`  Total items: ${data.length}`);
    
    // Analyze first few items in detail
    const sampleSize = Math.min(5, data.length);
    const samples = data.slice(0, sampleSize);
    
    const analysis = {
      contentType,
      totalItems: data.length,
      featuredMedia: {
        count: 0,
        ids: new Set(),
      },
      mediaReferences: [],
      directUrls: [],
      metaMediaFields: new Set(),
    };
    
    samples.forEach((item, index) => {
      console.log(`\n  Sample ${index + 1}:`);
      console.log(`    ID: ${item.id}`);
      console.log(`    Title: ${item.title?.rendered || item.title || 'N/A'}`);
      
      // Check featured_media
      if (item.featured_media) {
        analysis.featuredMedia.count++;
        analysis.featuredMedia.ids.add(item.featured_media);
        console.log(`    Featured Media ID: ${item.featured_media}`);
      }
      
      // Check for media in meta
      if (item.meta && typeof item.meta === 'object') {
        Object.entries(item.meta).forEach(([key, value]) => {
          if (key.toLowerCase().includes('image') || 
              key.toLowerCase().includes('media') ||
              key.toLowerCase().includes('photo') ||
              key.toLowerCase().includes('thumbnail') ||
              key.toLowerCase().includes('url')) {
            analysis.metaMediaFields.add(key);
            
            if (typeof value === 'string') {
              if (value.match(/^https?:\/\//i)) {
                analysis.directUrls.push({ key, value: value.substring(0, 100) });
                console.log(`    Meta[${key}]: ${value.substring(0, 80)}...`);
              } else if (/^\d+$/.test(value)) {
                console.log(`    Meta[${key}]: Media ID ${value}`);
              }
            }
          }
        });
      }
      
      // Deep search for media references
      const mediaRefs = findMediaReferences(item, `item[${index}]`);
      mediaRefs.forEach(ref => {
        if (ref.type === 'url' && ref.value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
          analysis.directUrls.push({ path: ref.path, value: ref.value.substring(0, 100) });
        }
      });
    });
    
    // Count across all items
    let totalFeaturedMedia = 0;
    const allMediaIds = new Set();
    data.forEach(item => {
      if (item.featured_media) {
        totalFeaturedMedia++;
        allMediaIds.add(item.featured_media);
      }
    });
    
    console.log(`\n  Summary:`);
    console.log(`    Items with featured_media: ${totalFeaturedMedia} / ${data.length}`);
    console.log(`    Unique media IDs: ${allMediaIds.size}`);
    console.log(`    Meta fields with media references: ${Array.from(analysis.metaMediaFields).join(', ') || 'None found'}`);
    console.log(`    Direct image URLs found: ${analysis.directUrls.length}`);
    
    return {
      ...analysis,
      totalFeaturedMedia,
      uniqueMediaIds: allMediaIds.size,
      mediaIds: Array.from(allMediaIds).slice(0, 20),
    };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Media References Analysis');
  console.log('='.repeat(60));
  console.log('\nAnalyzing fetched data for media references...');
  
  const organizations = [
    {
      slug: 'study-in-kazakhstan',
      contentTypes: ['blogs', 'programs', 'universities', 'team-members', 'reviews'],
    },
    {
      slug: 'paris-american-international-university',
      contentTypes: ['blogs', 'programs', 'academic-staff', 'team-members', 'instructors'],
    },
  ];
  
  const allAnalyses = {};
  
  for (const org of organizations) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Organization: ${org.slug}`);
    console.log('='.repeat(60));
    
    allAnalyses[org.slug] = {};
    
    for (const contentType of org.contentTypes) {
      const filePath = path.join(
        __dirname,
        `../organizations/${org.slug}/raw-data/${contentType}/raw.json`
      );
      
      try {
        await fs.access(filePath);
        const analysis = await analyzeFile(filePath, contentType);
        if (analysis) {
          allAnalyses[org.slug][contentType] = analysis;
        }
      } catch (error) {
        console.log(`\n  ⚠ File not found: ${filePath}`);
      }
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Overall Summary');
  console.log('='.repeat(60));
  
  Object.entries(allAnalyses).forEach(([orgSlug, analyses]) => {
    console.log(`\n${orgSlug}:`);
    Object.entries(analyses).forEach(([contentType, analysis]) => {
      console.log(`  ${contentType}:`);
      console.log(`    Featured Media: ${analysis.totalFeaturedMedia} items`);
      console.log(`    Unique Media IDs: ${analysis.uniqueMediaIds}`);
      console.log(`    Direct URLs: ${analysis.directUrls.length}`);
      if (analysis.metaMediaFields.size > 0) {
        console.log(`    Meta Media Fields: ${Array.from(analysis.metaMediaFields).join(', ')}`);
      }
    });
  });
  
  // Save analysis
  const analysisPath = path.join(__dirname, '../media-analysis.json');
  await fs.writeFile(
    analysisPath,
    JSON.stringify(allAnalyses, null, 2)
  );
  console.log(`\n✓ Analysis saved to: ${analysisPath}`);
}

main().catch(console.error);

