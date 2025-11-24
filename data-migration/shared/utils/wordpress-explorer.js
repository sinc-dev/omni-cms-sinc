/**
 * WordPress Data Explorer
 * 
 * Explores and analyzes WordPress REST API data structure
 * Helps understand tags, categories, relationships, dates, authors, etc.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Fetch data from WordPress API endpoint
 * @param {string} baseUrl - WordPress site base URL
 * @param {string} endpoint - API endpoint (e.g., 'posts', 'categories')
 * @param {object} params - Query parameters
 * @param {object} auth - Optional authentication { username, password }
 */
export async function fetchWordPressData(baseUrl, endpoint, params = {}, auth = null) {
  // Handle endpoint that already includes namespace (wp/v2/, wp/v1/, etc.)
  // or query params
  let endpointPath = endpoint;
  let existingParams = {};
  
  // Extract query params if present
  if (endpoint.includes('?')) {
    const [path, queryString] = endpoint.split('?');
    endpointPath = path;
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        existingParams[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }
  
  // Build URL - if endpoint already has namespace, use as-is, otherwise add wp/v2/
  const fullEndpoint = endpointPath.startsWith('wp/') 
    ? endpointPath 
    : `wp/v2/${endpointPath}`;
  
  const url = new URL(`${baseUrl}/wp-json/${fullEndpoint}`);
  
  // Add existing params first
  Object.entries(existingParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  // Then add new params (will override existing if same key)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const headers = {};
  
  // Add Basic Auth if credentials provided
  if (auth && auth.username && auth.password) {
    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  try {
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

/**
 * Get all items with pagination
 * @param {string} baseUrl - WordPress site base URL
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @param {object} auth - Optional authentication { username, password }
 * @param {object} options - Options { limitPages, perPage, onProgress }
 */
export async function fetchAllItems(baseUrl, endpoint, params = {}, auth = null, options = {}) {
  const { limitPages = null, perPage = 100, onProgress = null } = options;
  const allItems = [];
  let page = 1;
  let hasMore = true;
  let totalPages = null;

  while (hasMore) {
    const items = await fetchWordPressData(baseUrl, endpoint, {
      ...params,
      page,
      per_page: perPage,
    }, auth);

    if (!items || items.length === 0) {
      hasMore = false;
    } else {
      allItems.push(...items);
      
      // Check if we've reached the limit
      if (limitPages && page >= limitPages) {
        hasMore = false;
      } else {
        page++;
        
        // Check total pages from response headers if available
        // WordPress REST API returns X-WP-TotalPages header
        // We'll check if we got fewer items than perPage (last page)
        if (items.length < perPage) {
          hasMore = false;
        }
      }
      
      // Progress callback
      if (onProgress) {
        onProgress({
          page,
          totalItems: allItems.length,
          currentPageItems: items.length,
        });
      }
    }
  }

  return allItems;
}

/**
 * Analyze a WordPress post/item structure
 */
export function analyzeItemStructure(item, itemType = 'post') {
  const analysis = {
    type: itemType,
    fields: {},
    relationships: {},
    dates: {},
    metadata: {},
  };

  // Analyze all fields
  for (const [key, value] of Object.entries(item)) {
    const fieldType = typeof value;
    
    if (key.includes('date') || key.includes('Date')) {
      analysis.dates[key] = {
        value,
        type: fieldType,
        isDate: !isNaN(Date.parse(value)),
      };
    } else if (key.includes('author') || key.includes('Author')) {
      analysis.relationships.author = {
        field: key,
        value,
        type: fieldType,
      };
    } else if (key.includes('category') || key.includes('Category')) {
      analysis.relationships.categories = {
        field: key,
        value,
        type: Array.isArray(value) ? 'array' : fieldType,
        length: Array.isArray(value) ? value.length : undefined,
      };
    } else if (key.includes('tag') || key.includes('Tag')) {
      analysis.relationships.tags = {
        field: key,
        value,
        type: Array.isArray(value) ? 'array' : fieldType,
        length: Array.isArray(value) ? value.length : undefined,
      };
    } else if (key.includes('media') || key.includes('Media') || key.includes('image') || key.includes('Image')) {
      analysis.relationships.media = {
        field: key,
        value,
        type: fieldType,
      };
    } else if (key.includes('_links') || key.includes('Links')) {
      analysis.metadata.links = {
        field: key,
        availableLinks: Object.keys(value || {}),
      };
    } else {
      analysis.fields[key] = {
        type: fieldType,
        isArray: Array.isArray(value),
        isObject: fieldType === 'object' && value !== null,
        sampleValue: Array.isArray(value) 
          ? value.slice(0, 3) 
          : fieldType === 'object' 
            ? Object.keys(value || {}).slice(0, 5)
            : String(value).substring(0, 100),
      };
    }
  }

  return analysis;
}

/**
 * Analyze WordPress site structure
 * @param {object} siteConfig - Site configuration { name, baseUrl, customPostTypes, auth }
 */
export async function analyzeWordPressSite(siteConfig) {
  const { name, baseUrl, customPostTypes = [], auth = null } = siteConfig;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Analyzing: ${name}`);
  console.log(`URL: ${baseUrl}`);
  console.log('='.repeat(60));

  const analysis = {
    site: name,
    baseUrl,
    timestamp: new Date().toISOString(),
    endpoints: {},
    postTypes: {},
    taxonomies: {},
    authors: {},
    structure: {},
  };

  // Test API accessibility
  console.log('\n1. Testing API accessibility...');
  const testPost = await fetchWordPressData(baseUrl, 'posts', { per_page: 1 }, auth);
  if (!testPost || testPost.length === 0) {
    console.log('⚠ No posts found or API not accessible');
    return analysis;
  }
  console.log('✓ API is accessible');

  // Analyze standard post structure
  console.log('\n2. Analyzing standard post structure...');
  const samplePost = testPost[0];
  const postAnalysis = analyzeItemStructure(samplePost, 'post');
  analysis.structure.post = postAnalysis;
  
  console.log('Fields:', Object.keys(postAnalysis.fields).length);
  console.log('Dates:', Object.keys(postAnalysis.dates));
  console.log('Relationships:', Object.keys(postAnalysis.relationships));

  // Get all post types
  console.log('\n3. Discovering post types...');
  const postTypes = await fetchWordPressData(baseUrl, 'types', {}, auth);
  if (postTypes) {
    analysis.postTypes = postTypes;
    console.log('Available post types:', Object.keys(postTypes));
  }

  // Analyze categories
  console.log('\n4. Analyzing categories...');
  const categories = await fetchAllItems(baseUrl, 'categories', {}, auth);
  if (categories && categories.length > 0) {
    analysis.taxonomies.categories = {
      count: categories.length,
      sample: categories.slice(0, 5).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
        parent: cat.parent,
      })),
      structure: analyzeItemStructure(categories[0], 'category'),
    };
    console.log(`Found ${categories.length} categories`);
  }

  // Analyze tags
  console.log('\n5. Analyzing tags...');
  const tags = await fetchAllItems(baseUrl, 'tags', {}, auth);
  if (tags && tags.length > 0) {
    analysis.taxonomies.tags = {
      count: tags.length,
      sample: tags.slice(0, 5).map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag.count,
      })),
      structure: analyzeItemStructure(tags[0], 'tag'),
    };
    console.log(`Found ${tags.length} tags`);
  }

  // Analyze authors
  console.log('\n6. Analyzing authors...');
  const authors = await fetchAllItems(baseUrl, 'users', {}, auth);
  if (authors && authors.length > 0) {
    analysis.authors = {
      count: authors.length,
      sample: authors.slice(0, 5).map(author => ({
        id: author.id,
        name: author.name,
        slug: author.slug,
        email: author.email,
        avatar_urls: author.avatar_urls ? Object.keys(author.avatar_urls) : null,
      })),
      structure: analyzeItemStructure(authors[0], 'author'),
    };
    console.log(`Found ${authors.length} authors`);
  }

  // Analyze custom post types
  console.log('\n7. Analyzing custom post types...');
  for (const postType of customPostTypes) {
    console.log(`  Checking ${postType}...`);
    const items = await fetchWordPressData(baseUrl, postType, { per_page: 1 }, auth);
    if (items && items.length > 0) {
      analysis.structure[postType] = analyzeItemStructure(items[0], postType);
      console.log(`  ✓ Found ${postType} posts`);
    } else {
      console.log(`  ⚠ No ${postType} posts found or endpoint doesn't exist`);
    }
  }

  // Analyze media
  console.log('\n8. Analyzing media structure...');
  const media = await fetchWordPressData(baseUrl, 'media', { per_page: 1 }, auth);
  if (media && media.length > 0) {
    analysis.structure.media = analyzeItemStructure(media[0], 'media');
    console.log('✓ Media structure analyzed');
  }

  return analysis;
}

/**
 * Generate detailed report
 */
export function generateReport(analysis, outputPath) {
  const report = {
    summary: {
      site: analysis.site,
      analyzedAt: analysis.timestamp,
      postTypesFound: Object.keys(analysis.postTypes || {}).length,
      categoriesFound: analysis.taxonomies?.categories?.count || 0,
      tagsFound: analysis.taxonomies?.tags?.count || 0,
      authorsFound: analysis.authors?.count || 0,
    },
    structure: analysis.structure,
    taxonomies: analysis.taxonomies,
    authors: analysis.authors,
    postTypes: analysis.postTypes,
  };

  return fs.writeFile(outputPath, JSON.stringify(report, null, 2));
}

