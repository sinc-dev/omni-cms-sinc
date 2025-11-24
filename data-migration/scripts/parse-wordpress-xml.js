/**
 * Parse WordPress XML Export
 * 
 * Parses WordPress XML export files and extracts:
 * - All post types (including JetEngine custom post types)
 * - Taxonomies (categories, tags, custom)
 * - Authors
 * - Media attachments
 * - Metadata and custom fields
 * - Dates (created, updated, published)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseNodeValue: true,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
});

/**
 * Parse WordPress XML export file
 */
async function parseWordPressXML(xmlPath) {
  console.log(`\nParsing: ${xmlPath}`);
  
  const xmlContent = await fs.readFile(xmlPath, 'utf-8');
  const json = parser.parse(xmlContent);
  
  // WordPress XML structure: rss > channel > item[]
  const channel = json.rss?.channel || json.channel;
  if (!channel) {
    throw new Error('Invalid WordPress XML format');
  }
  
  const items = Array.isArray(channel.item) ? channel.item : [channel.item].filter(Boolean);
  
  console.log(`  Found ${items.length} items`);
  
  // Categorize items
  const posts = [];
  const pages = [];
  const attachments = [];
  const customPostTypes = {};
  const authors = new Map();
  const categories = new Map();
  const tags = new Map();
  
  for (const item of items) {
    const postType = item['wp:post_type'] || item.post_type || 'post';
    const title = item.title?.['#text'] || item.title || '';
    const postId = item['wp:post_id'] || item.post_id;
    
    // Extract author
    if (item['dc:creator'] || item.creator) {
      const authorName = item['dc:creator']?.['#text'] || item['dc:creator'] || item.creator;
      if (!authors.has(authorName)) {
        authors.set(authorName, {
          name: authorName,
          slug: authorName.toLowerCase().replace(/\s+/g, '-'),
        });
      }
    }
    
    // Extract categories and tags
    if (item.category) {
      const cats = Array.isArray(item.category) ? item.category : [item.category];
      cats.forEach(cat => {
        const catName = typeof cat === 'string' ? cat : (cat['#text'] || cat['@_nicename'] || cat);
        const domain = typeof cat === 'object' ? (cat['@_domain'] || 'category') : 'category';
        
        if (domain === 'category') {
          categories.set(catName, {
            name: catName,
            slug: catName.toLowerCase().replace(/\s+/g, '-'),
          });
        } else if (domain === 'post_tag') {
          tags.set(catName, {
            name: catName,
            slug: catName.toLowerCase().replace(/\s+/g, '-'),
          });
        }
      });
    }
    
    // Build post object
    const post = {
      id: postId,
      title: title,
      slug: item['wp:post_name'] || item.post_name || '',
      content: item['content:encoded'] || item.content || '',
      excerpt: item['excerpt:encoded'] || item.excerpt || '',
      status: item['wp:status'] || item.status || 'publish',
      postType: postType,
      author: item['dc:creator']?.['#text'] || item['dc:creator'] || item.creator || '',
      publishedAt: item['wp:post_date'] || item.post_date || null,
      createdAt: item['wp:post_date'] || item.post_date || null,
      updatedAt: item['wp:post_date_gmt'] || item.post_date_gmt || null,
      // Custom fields/metadata
      meta: {},
      // Taxonomies
      categories: [],
      tags: [],
    };
    
    // Extract custom fields (wp:postmeta)
    if (item['wp:postmeta']) {
      const metaItems = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
      metaItems.forEach(meta => {
        const key = meta['wp:meta_key'] || meta.meta_key;
        const value = meta['wp:meta_value'] || meta.meta_value;
        if (key && value) {
          post.meta[key] = value;
        }
      });
    }
    
    // Extract taxonomies
    if (item.category) {
      const cats = Array.isArray(item.category) ? item.category : [item.category];
      cats.forEach(cat => {
        const catName = typeof cat === 'string' ? cat : (cat['#text'] || cat['@_nicename'] || cat);
        const domain = typeof cat === 'object' ? (cat['@_domain'] || 'category') : 'category';
        
        if (domain === 'category') {
          post.categories.push(catName);
        } else if (domain === 'post_tag') {
          post.tags.push(catName);
        } else {
          // Custom taxonomy
          if (!post.meta.taxonomies) post.meta.taxonomies = {};
          if (!post.meta.taxonomies[domain]) post.meta.taxonomies[domain] = [];
          post.meta.taxonomies[domain].push(catName);
        }
      });
    }
    
    // Categorize by post type
    if (postType === 'post') {
      posts.push(post);
    } else if (postType === 'page') {
      pages.push(post);
    } else if (postType === 'attachment') {
      attachments.push(post);
    } else {
      // Custom post type (JetEngine)
      if (!customPostTypes[postType]) {
        customPostTypes[postType] = [];
      }
      customPostTypes[postType].push(post);
    }
  }
  
  return {
    posts,
    pages,
    attachments,
    customPostTypes,
    authors: Array.from(authors.values()),
    categories: Array.from(categories.values()),
    tags: Array.from(tags.values()),
    totalItems: items.length,
  };
}

/**
 * Save parsed data to JSON files
 */
async function saveParsedData(parsedData, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  
  // Save by post type
  await fs.writeFile(
    path.join(outputDir, 'posts.json'),
    JSON.stringify(parsedData.posts, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'pages.json'),
    JSON.stringify(parsedData.pages, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'attachments.json'),
    JSON.stringify(parsedData.attachments, null, 2)
  );
  
  // Save custom post types
  for (const [postType, items] of Object.entries(parsedData.customPostTypes)) {
    await fs.writeFile(
      path.join(outputDir, `${postType}.json`),
      JSON.stringify(items, null, 2)
    );
  }
  
  // Save taxonomies
  await fs.writeFile(
    path.join(outputDir, 'taxonomies.json'),
    JSON.stringify({
      categories: parsedData.categories,
      tags: parsedData.tags,
    }, null, 2)
  );
  
  // Save authors
  await fs.writeFile(
    path.join(outputDir, 'authors.json'),
    JSON.stringify(parsedData.authors, null, 2)
  );
  
  // Save summary
  const summary = {
    totalItems: parsedData.totalItems,
    posts: parsedData.posts.length,
    pages: parsedData.pages.length,
    attachments: parsedData.attachments.length,
    customPostTypes: Object.fromEntries(
      Object.entries(parsedData.customPostTypes).map(([type, items]) => [type, items.length])
    ),
    authors: parsedData.authors.length,
    categories: parsedData.categories.length,
    tags: parsedData.tags.length,
  };
  
  await fs.writeFile(
    path.join(outputDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return summary;
}

async function main() {
  const organizations = [
    { slug: 'study-in-kazakhstan', xmlFile: 'export.xml' },
    { slug: 'study-in-north-cyprus', xmlFile: 'export.xml' },
    { slug: 'paris-american-international-university', xmlFile: 'export.xml' },
  ];
  
  console.log('WordPress XML Parser');
  console.log('='.repeat(60));
  console.log('\nThis script parses WordPress XML export files.');
  console.log('Place your XML export files in:');
  organizations.forEach(org => {
    console.log(`  - organizations/${org.slug}/${org.xmlFile}`);
  });
  console.log('\n' + '='.repeat(60));
  
  for (const org of organizations) {
    const xmlPath = path.join(__dirname, `../organizations/${org.slug}/${org.xmlFile}`);
    const outputDir = path.join(__dirname, `../organizations/${org.slug}/parsed-data`);
    
    try {
      // Check if XML file exists
      await fs.access(xmlPath);
      
      // Parse XML
      const parsedData = await parseWordPressXML(xmlPath);
      
      // Save parsed data
      const summary = await saveParsedData(parsedData, outputDir);
      
      console.log(`\n✓ Parsed ${org.slug}`);
      console.log(`  Total items: ${summary.totalItems}`);
      console.log(`  Posts: ${summary.posts}`);
      console.log(`  Pages: ${summary.pages}`);
      console.log(`  Attachments: ${summary.attachments}`);
      console.log(`  Custom Post Types:`);
      Object.entries(summary.customPostTypes).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });
      console.log(`  Authors: ${summary.authors}`);
      console.log(`  Categories: ${summary.categories}`);
      console.log(`  Tags: ${summary.tags}`);
      console.log(`\n  Data saved to: ${outputDir}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`\n⚠ Skipping ${org.slug} - XML file not found`);
        console.log(`  Expected: ${xmlPath}`);
        console.log(`  Please export WordPress XML and place it there.`);
      } else {
        console.error(`\n✗ Error parsing ${org.slug}:`, error.message);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Parsing complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

