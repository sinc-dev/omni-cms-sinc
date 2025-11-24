/**
 * Create Organizations in Omni-CMS
 * 
 * Creates the organizations needed for the migration project
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://omni-cms-api.joseph-9a2.workers.dev';
const API_KEY = process.env.API_KEY; // Cloudflare Access token or API key

const ORGANIZATIONS = [
  {
    name: 'Study In Kazakhstan',
    slug: 'study-in-kazakhstan',
    description: 'Study In Kazakhstan - Your guide to studying in Kazakhstan',
  },
  {
    name: 'Study in North Cyprus',
    slug: 'study-in-north-cyprus',
    description: 'Study in North Cyprus - Your guide to studying in North Cyprus',
  },
  {
    name: 'Paris American International University',
    slug: 'paris-american-international-university',
    description: 'Paris American International University - Academic programs and information',
  },
];

async function createOrganization(org: typeof ORGANIZATIONS[0]) {
  try {
    const response = await fetch(`${API_URL}/api/admin/v1/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        name: org.name,
        slug: org.slug,
        description: org.description,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create organization: ${error}`);
    }

    const data = await response.json();
    console.log(`✓ Created organization: ${org.name} (${org.slug})`);
    return data.data;
  } catch (error) {
    console.error(`✗ Failed to create ${org.name}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('Creating organizations in Omni-CMS...\n');

  if (!API_KEY) {
    console.error('Error: API_KEY environment variable is required');
    console.error('Set it to your Cloudflare Access token or API key');
    process.exit(1);
  }

  const results = [];

  for (const org of ORGANIZATIONS) {
    try {
      const result = await createOrganization(org);
      results.push({ ...org, id: result.id });
    } catch (error) {
      console.error(`Skipping ${org.name} due to error`);
    }
  }

  console.log('\n✓ Organization creation complete!');
  console.log('\nCreated organizations:');
  results.forEach(org => {
    console.log(`  - ${org.name} (ID: ${org.id}, Slug: ${org.slug})`);
  });

  // Save results to file
  const fs = await import('fs/promises');
  await fs.writeFile(
    'data-migration/organizations.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\n✓ Saved organization IDs to data-migration/organizations.json');
}

main().catch(console.error);

