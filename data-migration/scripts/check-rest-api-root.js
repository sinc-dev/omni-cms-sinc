/**
 * Check WordPress REST API Root
 * See what's actually available
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

async function checkRoot(baseUrl, auth) {
  console.log(`\nChecking: ${baseUrl}/wp-json/`);
  
  // Try without auth first
  try {
    const response = await fetch(`${baseUrl}/wp-json/`);
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    try {
      const json = JSON.parse(text);
      console.log('\nResponse:', JSON.stringify(json, null, 2));
      
      if (json.routes) {
        console.log('\n=== Available Routes ===');
        const routes = Object.keys(json.routes);
        console.log(`Total routes: ${routes.length}`);
        console.log('\nFirst 50 routes:');
        routes.slice(0, 50).forEach(route => {
          console.log(`  ${route}`);
        });
        
        // Filter for post-type related routes
        const postTypeRoutes = routes.filter(r => 
          r.includes('program') || 
          r.includes('university') || 
          r.includes('team') ||
          r.includes('/v2/') ||
          r.includes('jet') ||
          r.includes('post')
        );
        
        if (postTypeRoutes.length > 0) {
          console.log('\n=== Post Type Related Routes ===');
          postTypeRoutes.forEach(route => {
            console.log(`  ${route}`);
          });
        }
      }
    } catch (e) {
      console.log('\nResponse (not JSON):');
      console.log(text.substring(0, 500));
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  // Try with auth
  if (auth) {
    console.log(`\n\nChecking with auth: ${baseUrl}/wp-json/`);
    try {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      const response = await fetch(`${baseUrl}/wp-json/`, {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      const text = await response.text();
      console.log(`Status: ${response.status}`);
      
      try {
        const json = JSON.parse(text);
        console.log('\nResponse:', JSON.stringify(json, null, 2));
        
        if (json.routes) {
          console.log('\n=== Available Routes (with auth) ===');
          const routes = Object.keys(json.routes);
          console.log(`Total routes: ${routes.length}`);
          
          const postTypeRoutes = routes.filter(r => 
            r.includes('program') || 
            r.includes('university') || 
            r.includes('team') ||
            r.includes('/v2/') ||
            r.includes('jet') ||
            r.includes('post')
          );
          
          if (postTypeRoutes.length > 0) {
            console.log('\n=== Post Type Related Routes ===');
            postTypeRoutes.forEach(route => {
              console.log(`  ${route}`);
            });
          }
        }
      } catch (e) {
        console.log('\nResponse (not JSON):');
        console.log(text.substring(0, 500));
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

async function main() {
  const sites = [
    { name: 'Study In Kazakhstan', baseUrl: 'https://studyinkzk.com' },
    { name: 'Study in North Cyprus', baseUrl: 'https://studyinnc.com' },
  ];
  
  const auth = await loadWordPressAuth();
  
  for (const site of sites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Site: ${site.name}`);
    console.log('='.repeat(60));
    await checkRoot(site.baseUrl, auth);
  }
}

main().catch(console.error);

