/**
 * Test WordPress REST API v1 endpoints
 * 
 * Some WordPress sites use v1 instead of v2
 * Also check root endpoint to see what's actually available
 */

async function loadWordPressAuth() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const envPath = path.join(__dirname, '../.env.wordpress-auth');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const username = envContent.match(/WORDPRESS_USERNAME=(.+)/)?.[1]?.trim();
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    return { username, password };
  } catch (error) {
    return null;
  }
}

async function curlTest(url, auth = null) {
  const headers = {};
  if (auth) {
    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }
  
  try {
    const response = await fetch(url, { headers });
    const text = await response.text();
    
    return {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      body: text,
      ok: response.ok,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}

async function testEndpoint(baseUrl, endpoint, auth, description) {
  const url = `${baseUrl}/wp-json/${endpoint}`;
  console.log(`\n${description}`);
  console.log(`URL: ${url}`);
  
  const result = await curlTest(url, auth);
  
  if (result.error) {
    console.log(`  ✗ Error: ${result.error}`);
    return { success: false, error: result.error };
  }
  
  console.log(`  Status: ${result.status} ${result.statusText}`);
  console.log(`  Content-Type: ${result.contentType}`);
  
  if (result.ok) {
    try {
      const json = JSON.parse(result.body);
      
      if (Array.isArray(json)) {
        console.log(`  ✓ Success! Array with ${json.length} items`);
        if (json.length > 0) {
          console.log(`  Sample keys:`, Object.keys(json[0]).slice(0, 10).join(', '));
          console.log(`  Sample:`, JSON.stringify(json[0], null, 2).substring(0, 300));
        }
      } else if (typeof json === 'object') {
        console.log(`  ✓ Success! Object response`);
        console.log(`  Keys:`, Object.keys(json).slice(0, 20).join(', '));
        console.log(`  Sample:`, JSON.stringify(json, null, 2).substring(0, 500));
      }
      
      return { success: true, data: json };
    } catch (e) {
      console.log(`  ⚠ Response is not JSON`);
      console.log(`  Body (first 500 chars):`, result.body.substring(0, 500));
      return { success: false, notJson: true, body: result.body };
    }
  } else {
    console.log(`  ✗ Failed`);
    if (result.body) {
      try {
        const error = JSON.parse(result.body);
        console.log(`  Error:`, JSON.stringify(error, null, 2));
      } catch (e) {
        console.log(`  Error body:`, result.body.substring(0, 300));
      }
    }
    return { success: false, status: result.status };
  }
}

async function checkRoot(baseUrl, auth) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Checking Root: ${baseUrl}/wp-json/`);
  console.log('='.repeat(60));
  
  const result = await curlTest(`${baseUrl}/wp-json/`, auth);
  
  if (result.error) {
    console.log(`Error: ${result.error}`);
    return;
  }
  
  console.log(`Status: ${result.status}`);
  console.log(`Content-Type: ${result.contentType}`);
  
  if (result.ok) {
    try {
      const json = JSON.parse(result.body);
      console.log('\nRoot Response:');
      console.log(JSON.stringify(json, null, 2));
      
      // Check for namespaces
      if (json.namespaces) {
        console.log('\nAvailable Namespaces:');
        json.namespaces.forEach(ns => console.log(`  - ${ns}`));
      }
      
      // Check for routes
      if (json.routes) {
        console.log('\nAll Available Routes:');
        const routes = Object.keys(json.routes);
        console.log(`Total: ${routes.length} routes`);
        
        // Show first 50 routes
        console.log('\nFirst 50 routes:');
        routes.slice(0, 50).forEach(route => {
          console.log(`  ${route}`);
        });
        
        // Filter for interesting routes
        const interesting = routes.filter(r => 
          r.includes('program') || 
          r.includes('university') || 
          r.includes('team') ||
          r.includes('post') ||
          r.includes('v1') ||
          r.includes('v2') ||
          r.includes('jet')
        );
        
        if (interesting.length > 0) {
          console.log('\nInteresting Routes (post types, v1/v2, jet):');
          interesting.forEach(route => {
            console.log(`  ${route}`);
          });
        }
      }
    } catch (e) {
      console.log('\nResponse (not JSON):');
      console.log(result.body.substring(0, 1000));
    }
  } else {
    console.log('\nError Response:');
    try {
      const error = JSON.parse(result.body);
      console.log(JSON.stringify(error, null, 2));
    } catch (e) {
      console.log(result.body);
    }
  }
}

async function main() {
  const sites = [
    { name: 'Study In Kazakhstan', baseUrl: 'https://studyinkzk.com' },
    { name: 'Study in North Cyprus', baseUrl: 'https://studyinnc.com' },
  ];
  
  const auth = await loadWordPressAuth();
  
  console.log('WordPress REST API v1 Testing');
  console.log('='.repeat(60));
  console.log(`Auth: ${auth ? 'Yes' : 'No'}\n`);
  
  for (const site of sites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Site: ${site.name}`);
    console.log(`URL: ${site.baseUrl}`);
    console.log('='.repeat(60));
    
    // First, check root endpoint to see what's available
    await checkRoot(site.baseUrl, auth);
    
    // Test v1 endpoints
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Testing v1 Endpoints:');
    console.log('─'.repeat(60));
    
    const v1Endpoints = [
      { endpoint: 'wp/v1', desc: 'WordPress v1 Root' },
      { endpoint: 'wp/v1/posts', desc: 'WordPress v1 Posts' },
      { endpoint: 'wp/v1/posts?per_page=5', desc: 'WordPress v1 Posts (5 items)' },
      { endpoint: 'wp/v1/types', desc: 'WordPress v1 Types' },
      { endpoint: 'wp/v1/programs', desc: 'WordPress v1 Programs' },
      { endpoint: 'wp/v1/programs?per_page=5', desc: 'WordPress v1 Programs (5 items)' },
      { endpoint: 'wp/v1/universities', desc: 'WordPress v1 Universities' },
      { endpoint: 'wp/v1/universities?per_page=5', desc: 'WordPress v1 Universities (5 items)' },
    ];
    
    for (const { endpoint, desc } of v1Endpoints) {
      await testEndpoint(site.baseUrl, endpoint, auth, desc);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    // Also test v2 with different patterns
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Testing v2 Endpoints (with different patterns):');
    console.log('─'.repeat(60));
    
    const v2Endpoints = [
      { endpoint: 'wp/v2', desc: 'WordPress v2 Root' },
      { endpoint: 'wp/v2/posts?per_page=5&_embed', desc: 'WordPress v2 Posts (with embed)' },
      { endpoint: 'wp/v2/posts?per_page=5&context=edit', desc: 'WordPress v2 Posts (edit context)' },
      { endpoint: 'wp/v2/posts?per_page=5&status=any', desc: 'WordPress v2 Posts (any status)' },
    ];
    
    for (const { endpoint, desc } of v2Endpoints) {
      await testEndpoint(site.baseUrl, endpoint, auth, desc);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test JetEngine specific endpoints
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Testing JetEngine Endpoints:');
    console.log('─'.repeat(60));
    
    const jetEndpoints = [
      { endpoint: 'jet-engine/v1', desc: 'JetEngine v1 Root' },
      { endpoint: 'jet-engine/v1/programs', desc: 'JetEngine Programs' },
      { endpoint: 'jet-engine/v1/universities', desc: 'JetEngine Universities' },
      { endpoint: 'jet/v1/programs', desc: 'Jet Programs' },
      { endpoint: 'jet/v1/universities', desc: 'Jet Universities' },
    ];
    
    for (const { endpoint, desc } of jetEndpoints) {
      await testEndpoint(site.baseUrl, endpoint, auth, desc);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

