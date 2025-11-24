/**
 * Check detailed error messages from Paris American
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
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    return { username: 'scrape-assist2', password };
  } catch (error) {
    return null;
  }
}

async function checkEndpoint(baseUrl, endpoint, auth) {
  const url = `${baseUrl}/wp-json/${endpoint}`;
  const headers = {};
  
  if (auth) {
    const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }
  
  try {
    const response = await fetch(url, { headers });
    const text = await response.text();
    
    console.log(`\n${endpoint}`);
    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      try {
        const error = JSON.parse(text);
        console.log(`  Error Details:`, JSON.stringify(error, null, 2));
      } catch (e) {
        console.log(`  Error Body:`, text.substring(0, 500));
      }
    } else {
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          console.log(`  ✓ Success! ${data.length} items`);
        } else {
          console.log(`  ✓ Success! Object response`);
        }
      } catch (e) {
        console.log(`  Response:`, text.substring(0, 200));
      }
    }
  } catch (error) {
    console.log(`  Exception: ${error.message}`);
  }
}

async function main() {
  const baseUrl = 'https://parisamerican.org';
  const auth = await loadWordPressAuth();
  
  console.log('Checking Paris American Error Details');
  console.log('='.repeat(60));
  console.log(`URL: ${baseUrl}`);
  console.log(`Username: ${auth?.username || 'N/A'}\n`);
  
  const endpoints = [
    'wp/v2/posts?per_page=5',
    'wp/v2/academic-staff?per_page=5',
    'wp/v2/team-members?per_page=5',
    'wp/v2/instructors?per_page=5',
    'wp/v2/programs?per_page=5',
    'wp/v2/types',
  ];
  
  for (const endpoint of endpoints) {
    await checkEndpoint(baseUrl, endpoint, auth);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main().catch(console.error);

