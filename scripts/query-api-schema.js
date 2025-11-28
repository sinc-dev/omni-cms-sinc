/**
 * Script to query the study-in-kazakhstan API and analyze schema
 * API Key: omni_099c139e8f5dce0edfc59cc9926d0cd7
 */

const API_BASE = 'https://omni-cms-api.joseph-9a2.workers.dev';
const API_KEY = 'omni_099c139e8f5dce0edfc59cc9926d0cd7';
const ORG_SLUG = 'study-in-kazakhstan';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log('🔍 Querying API Schema...\n');

  // 1. Get organizations to find org ID
  console.log('1. Getting organizations...');
  const orgsResult = await fetchAPI('/api/admin/v1/organizations');
  console.log('Organizations:', JSON.stringify(orgsResult, null, 2));
  
  // Find study-in-kazakhstan org
  let orgId = null;
  if (orgsResult.data?.success && orgsResult.data?.data) {
    const org = orgsResult.data.data.find(o => o.slug === ORG_SLUG);
    if (org) {
      orgId = org.id;
      console.log(`\n✅ Found organization: ${org.name} (ID: ${orgId})\n`);
    }
  }

  if (!orgId) {
    console.log('❌ Could not find organization ID. Trying public endpoints...\n');
  }

  // 2. Get full schema
  if (orgId) {
    console.log('2. Getting full schema...');
    const schemaResult = await fetchAPI(`/api/admin/v1/organizations/${orgId}/schema`);
    console.log('Schema keys:', Object.keys(schemaResult.data?.data || {}));
    
    if (schemaResult.data?.success && schemaResult.data?.data) {
      const schema = schemaResult.data.data;
      console.log(`\nPost Types: ${schema.postTypes?.length || 0}`);
      console.log(`Taxonomies: ${schema.taxonomies?.length || 0}`);
      
      // Find universities and programs post types
      const universitiesType = schema.postTypes?.find(pt => 
        pt.slug === 'universities' || pt.slug === 'university' || pt.name?.toLowerCase().includes('university')
      );
      const programsType = schema.postTypes?.find(pt => 
        pt.slug === 'programs' || pt.slug === 'program' || pt.name?.toLowerCase().includes('program')
      );
      
      console.log('\n📋 Post Types Found:');
      schema.postTypes?.forEach(pt => {
        console.log(`  - ${pt.name} (${pt.slug}) - ${pt.availableFields?.length || 0} custom fields`);
      });
      
      if (universitiesType) {
        console.log(`\n✅ Universities Post Type: ${universitiesType.name} (${universitiesType.slug})`);
        console.log(`   Custom Fields: ${universitiesType.availableFields?.length || 0}`);
      }
      
      if (programsType) {
        console.log(`\n✅ Programs Post Type: ${programsType.name} (${programsType.slug})`);
        console.log(`   Custom Fields: ${programsType.availableFields?.length || 0}`);
      }
    }
  }

  // 3. Get universities (public endpoint)
  console.log('\n3. Getting universities from public API...');
  const universitiesResult = await fetchAPI(`/api/public/v1/${ORG_SLUG}/posts?post_type=universities&per_page=5`);
  if (universitiesResult.data?.success) {
    console.log(`Found ${universitiesResult.data.meta?.total || 0} universities`);
    if (universitiesResult.data.data?.length > 0) {
      const firstUni = universitiesResult.data.data[0];
      console.log(`\nExample University: ${firstUni.title} (${firstUni.slug})`);
      console.log('Custom Fields:', Object.keys(firstUni.customFields || {}));
    }
  }

  // 4. Try to find Coventry University
  console.log('\n4. Searching for Coventry University...');
  const coventryResult = await fetchAPI(`/api/public/v1/${ORG_SLUG}/posts?post_type=universities&search=coventry&per_page=10`);
  if (coventryResult.data?.success && coventryResult.data.data?.length > 0) {
    const coventry = coventryResult.data.data.find(u => 
      u.slug?.includes('coventry') || u.title?.toLowerCase().includes('coventry')
    );
    if (coventry) {
      console.log(`\n✅ Found: ${coventry.title} (${coventry.slug})`);
      console.log('All fields:', Object.keys(coventry));
      console.log('Custom Fields:', JSON.stringify(coventry.customFields, null, 2));
    }
  }

  // 5. Get programs for Coventry
  if (coventryResult.data?.success && coventryResult.data.data?.length > 0) {
    const coventry = coventryResult.data.data.find(u => 
      u.slug?.includes('coventry') || u.title?.toLowerCase().includes('coventry')
    );
    if (coventry) {
      console.log(`\n5. Getting programs for ${coventry.title}...`);
      const programsResult = await fetchAPI(
        `/api/public/v1/${ORG_SLUG}/posts?post_type=programs&related_to_slug=${coventry.slug}&relationship_type=university&per_page=5`
      );
      if (programsResult.data?.success) {
        console.log(`Found ${programsResult.data.meta?.total || 0} programs`);
        if (programsResult.data.data?.length > 0) {
          const firstProgram = programsResult.data.data[0];
          console.log(`\nExample Program: ${firstProgram.title}`);
          console.log('Custom Fields:', Object.keys(firstProgram.customFields || {}));
        }
      }
    }
  }

  // 6. Get taxonomies
  console.log('\n6. Getting taxonomies...');
  const taxonomiesResult = await fetchAPI(`/api/public/v1/${ORG_SLUG}/taxonomies`);
  // This endpoint might not exist, try getting a specific taxonomy
  // We'll need to know the taxonomy slug first

  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);

