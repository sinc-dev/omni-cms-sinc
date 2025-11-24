/**
 * Test Paris American endpoints without authentication
 * Some endpoints might be publicly accessible
 */

async function testPublicEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}/wp-json/${endpoint}`;
  console.log(`\nTesting: ${endpoint}`);
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      try {
        const json = JSON.parse(text);
        
        if (Array.isArray(json)) {
          console.log(`  ✓ Success! Found ${json.length} items (PUBLIC)`);
          if (json.length > 0) {
            const sample = json[0];
            console.log(`  Sample: ID=${sample.id}, Title=${sample.title?.rendered || sample.title || 'N/A'}`);
          }
          return { success: true, public: true, count: json.length };
        } else if (typeof json === 'object') {
          console.log(`  ✓ Success! Got object (PUBLIC)`);
          console.log(`  Keys:`, Object.keys(json).slice(0, 10).join(', '));
          return { success: true, public: true, data: json };
        }
      } catch (e) {
        console.log(`  ⚠ Not JSON`);
      }
    } else {
      try {
        const error = JSON.parse(text);
        if (error.code === 'rest_no_route') {
          console.log(`  ✗ Endpoint not found`);
        } else {
          console.log(`  ✗ Error: ${error.message || JSON.stringify(error)}`);
        }
      } catch (e) {
        console.log(`  ✗ Error: ${text.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.log(`  ✗ Exception: ${error.message}`);
  }
  
  return { success: false };
}

async function main() {
  const baseUrl = 'https://parisamerican.org';
  
  console.log('Testing Paris American International University - PUBLIC Endpoints');
  console.log('='.repeat(60));
  console.log(`URL: ${baseUrl}\n`);
  
  const endpoints = [
    'wp/v2/posts?per_page=5',
    'wp/v2/posts?per_page=5&status=publish',
    'wp/v2/academic-staff?per_page=5',
    'wp/v2/academic-staff?per_page=5&status=publish',
    'wp/v2/team-members?per_page=5',
    'wp/v2/instructors?per_page=5',
    'wp/v2/programs?per_page=5',
    'wp/v2/programs?per_page=5&status=publish',
    'wp/v2/categories',
    'wp/v2/tags',
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testPublicEndpoint(baseUrl, endpoint);
    results.push({ endpoint, ...result });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const publicEndpoints = results.filter(r => r.public);
  
  console.log(`\n${'─'.repeat(60)}`);
  if (publicEndpoints.length > 0) {
    console.log(`\n✓ Found ${publicEndpoints.length} publicly accessible endpoints:`);
    publicEndpoints.forEach(r => {
      const count = r.count || 'object';
      console.log(`  - ${r.endpoint}: ${count} items`);
    });
  } else {
    console.log(`\n✗ No publicly accessible endpoints found`);
    console.log(`  All endpoints require authentication`);
  }
}

main().catch(console.error);

