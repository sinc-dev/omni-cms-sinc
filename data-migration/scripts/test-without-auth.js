/**
 * Test WordPress endpoints WITHOUT authentication
 * 
 * Some endpoints might be publicly accessible
 */

async function testPublicEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}/wp-json/${endpoint}`;
  console.log(`\nTesting: ${endpoint}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      try {
        const json = JSON.parse(text);
        
        if (Array.isArray(json)) {
          console.log(`  ✓ Success! Array with ${json.length} items`);
          if (json.length > 0) {
            console.log(`  Sample keys:`, Object.keys(json[0]).slice(0, 10).join(', '));
            const sample = json[0];
            console.log(`  Sample item:`);
            console.log(`    ID: ${sample.id}`);
            console.log(`    Title: ${sample.title?.rendered || sample.title || 'N/A'}`);
            console.log(`    Type: ${sample.type || 'N/A'}`);
            console.log(`    Status: ${sample.status || 'N/A'}`);
            return { success: true, data: json, endpoint };
          }
        } else if (typeof json === 'object') {
          console.log(`  ✓ Success! Object response`);
          console.log(`  Keys:`, Object.keys(json).slice(0, 20).join(', '));
          return { success: true, data: json, endpoint };
        }
      } catch (e) {
        console.log(`  ⚠ Not JSON:`, text.substring(0, 200));
      }
    } else {
      try {
        const error = JSON.parse(text);
        console.log(`  ✗ Error:`, JSON.stringify(error, null, 2));
      } catch (e) {
        console.log(`  ✗ Error:`, text.substring(0, 200));
      }
    }
  } catch (error) {
    console.log(`  ✗ Exception:`, error.message);
  }
  
  return { success: false, endpoint };
}

async function main() {
  const sites = [
    { name: 'Study In Kazakhstan', baseUrl: 'https://studyinkzk.com' },
    { name: 'Study in North Cyprus', baseUrl: 'https://studyinnc.com' },
  ];
  
  console.log('Testing WordPress Endpoints WITHOUT Authentication');
  console.log('='.repeat(60));
  console.log('\nTesting public endpoints (no auth required)...\n');
  
  const endpoints = [
    'wp/v2/posts?per_page=5',
    'wp/v2/posts?per_page=5&status=publish',
    'wp/v2/pages?per_page=5',
    'wp/v2/categories',
    'wp/v2/tags',
    'wp/v2/types',
    'wp/v2/programs?per_page=5',
    'wp/v2/universities?per_page=5',
    'wp/v2/team-members?per_page=5',
  ];
  
  for (const site of sites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Site: ${site.name}`);
    console.log('='.repeat(60));
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const result = await testPublicEndpoint(site.baseUrl, endpoint);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    const working = results.filter(r => r.success);
    if (working.length > 0) {
      console.log(`\n✓ Found ${working.length} working public endpoints:`);
      working.forEach(r => {
        const count = Array.isArray(r.data) ? r.data.length : 'object';
        console.log(`  - ${r.endpoint} (${count} items)`);
      });
    } else {
      console.log(`\n✗ No public endpoints found`);
    }
  }
}

main().catch(console.error);

