/**
 * WordPress Scraper for Study In Kazakhstan
 * 
 * Scrapes data from studyinkzk.com WordPress REST API
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWordPressData, fetchAllItems } from '../../../shared/utils/wordpress-explorer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://studyinkzk.com';
const API_BASE = `${BASE_URL}/wp-json/wp/v2`;

// Load WordPress credentials
async function loadWordPressAuth() {
  try {
    const envPath = path.join(__dirname, '../../../.env.wordpress-auth');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const username = envContent.match(/WORDPRESS_USERNAME=(.+)/)?.[1]?.trim();
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    
    if (username && password) {
      return { username, password };
    }
  } catch (error) {
    console.warn('⚠ Could not load WordPress credentials');
  }
  return null;
}

const OUTPUT_DIR = path.join(__dirname, '../raw-data');

// Content types to scrape
const CONTENT_TYPES = {
  blogs: 'posts',
  'team-members': 'team-members', // Custom post type - adjust endpoint as needed
  universities: 'universities', // Custom post type
  programs: 'programs', // Custom post type
};

/**
 * Fetch all posts from WordPress API with pagination
 * Handles large datasets (5000+ items)
 */
async function fetchAllPosts(endpoint, params = {}, auth = null) {
  const allPosts = [];
  let page = 1;
  let hasMore = true;
  let totalPages = null;

  while (hasMore) {
    try {
      const url = new URL(`${API_BASE}/${endpoint}`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('per_page', '100'); // Max per page
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });

      const headers = {};
      if (auth && auth.username && auth.password) {
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      // Progress logging (every 10 pages or every 1000 items)
      if (page === 1 || page % 10 === 0 || allPosts.length % 1000 === 0) {
        console.log(`  Fetching ${endpoint} page ${page}... (${allPosts.length} items so far)`);
      }
      
      const response = await fetch(url.toString(), { headers });
      
      if (!response.ok) {
        if (response.status === 400) {
          hasMore = false;
          break;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const posts = await response.json();
      
      // Get total pages from headers if available
      const totalPagesHeader = response.headers.get('x-wp-totalpages');
      if (totalPagesHeader) {
        totalPages = parseInt(totalPagesHeader);
      }
      
      if (posts.length === 0) {
        hasMore = false;
      } else {
        allPosts.push(...posts);
        page++;
        
        // Check if we've reached the last page
        if (totalPages && page > totalPages) {
          hasMore = false;
        } else if (posts.length < 100) {
          // If we got fewer items than requested, we're on the last page
          hasMore = false;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint} page ${page}:`, error.message);
      hasMore = false;
    }
  }

  return allPosts;
}

/**
 * Download media file
 */
async function downloadMedia(mediaUrl, outputPath) {
  try {
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      console.warn(`Failed to download ${mediaUrl}: ${response.statusText}`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));
    return outputPath;
  } catch (error) {
    console.error(`Error downloading ${mediaUrl}:`, error.message);
    return null;
  }
}

/**
 * Scrape a specific content type
 */
async function scrapeContentType(type, endpoint, auth = null) {
  console.log(`\nScraping ${type}...`);
  
  const posts = await fetchAllPosts(endpoint, {}, auth);
  console.log(`Found ${posts.length} ${type}`);

  // Save raw JSON
  const outputFile = path.join(OUTPUT_DIR, type, 'raw.json');
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(posts, null, 2));

  // Download featured media
  const mediaDir = path.join(OUTPUT_DIR, 'media', type);
  await fs.mkdir(mediaDir, { recursive: true });

  for (const post of posts) {
    if (post.featured_media) {
      // Fetch media details
      try {
        const mediaHeaders = {};
        if (auth && auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          mediaHeaders['Authorization'] = `Basic ${credentials}`;
        }
        const mediaResponse = await fetch(`${API_BASE}/media/${post.featured_media}`, { headers: mediaHeaders });
        if (mediaResponse.ok) {
          const media = await mediaResponse.json();
          const mediaUrl = media.source_url;
          const ext = path.extname(new URL(mediaUrl).pathname);
          const filename = `${post.id}${ext}`;
          const mediaPath = path.join(mediaDir, filename);
          
          await downloadMedia(mediaUrl, mediaPath);
          console.log(`Downloaded media for ${type} ${post.id}`);
        }
      } catch (error) {
        console.error(`Error downloading media for post ${post.id}:`, error.message);
      }
    }
  }

  return posts;
}

/**
 * Main scraping function
 */
async function main() {
  console.log('Starting WordPress scraping for Study In Kazakhstan...');
  console.log(`Base URL: ${BASE_URL}`);

  // Load WordPress credentials
  const auth = await loadWordPressAuth();
  if (auth) {
    console.log('✓ WordPress credentials loaded');
  }

  // Test API connection
  try {
    const testHeaders = {};
    if (auth && auth.username && auth.password) {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      testHeaders['Authorization'] = `Basic ${credentials}`;
    }
    const testResponse = await fetch(`${API_BASE}/posts?per_page=1`, { headers: testHeaders });
    if (!testResponse.ok) {
      throw new Error(`API not accessible: ${testResponse.status}`);
    }
    console.log('✓ WordPress API is accessible');
  } catch (error) {
    console.error('✗ WordPress API is not accessible:', error.message);
    console.error('Please check:');
    console.error('1. The site URL is correct');
    console.error('2. WordPress REST API is enabled');
    console.error('3. Custom post types are registered in REST API');
    console.error('4. Authentication credentials are correct (if required)');
    process.exit(1);
  }

  // Scrape each content type
  for (const [type, endpoint] of Object.entries(CONTENT_TYPES)) {
    try {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`Scraping ${type}...`);
      if (type === 'programs') {
        console.log('⚠ This may take a while - fetching 5000+ programs...');
      }
      await scrapeContentType(type, endpoint, auth);
    } catch (error) {
      console.error(`Error scraping ${type}:`, error.message);
    }
  }

  // Scrape taxonomies
  console.log('\nScraping taxonomies...');
  const categories = await fetchAllPosts('categories', {}, auth);
  const tags = await fetchAllPosts('tags', {}, auth);
  
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'taxonomies.json'),
    JSON.stringify({ categories, tags }, null, 2)
  );

  console.log('\n✓ Scraping complete!');
  console.log(`Data saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);

