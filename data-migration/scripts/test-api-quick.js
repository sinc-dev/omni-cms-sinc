/**
 * Quick API Test
 * 
 * Simple test to verify the API is working
 */

const API_URL = process.env.API_URL || 'https://omni-cms-api.joseph-9a2.workers.dev';

async function quickTest() {
  console.log(`Testing: ${API_URL}\n`);

  try {
    // Test health endpoint
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    
    console.log('✓ Health Check:', healthData);
    
    // Test MCP endpoint
    const mcpResponse = await fetch(`${API_URL}/api/public/v1/mcp`);
    const mcpData = await mcpResponse.json();
    
    console.log('✓ MCP Endpoint:', {
      name: mcpData.name,
      version: mcpData.version,
      endpoints: Object.keys(mcpData.endpoints || {}).length,
    });
    
    console.log('\n✅ API is working!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    process.exit(1);
  }
}

quickTest();

