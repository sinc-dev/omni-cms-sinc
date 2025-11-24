/**
 * Test Cloudflare Worker API
 * 
 * Tests the deployed Omni-CMS API to verify it's working correctly
 */

const API_URL = process.env.API_URL || 'https://omni-cms-api.joseph-9a2.workers.dev';
const API_KEY = process.env.API_KEY; // Optional: Cloudflare Access token or API key

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n${'─'.repeat(60)}`, 'cyan');
  log(`Testing: ${name}`, 'cyan');
  log('─'.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Test health endpoint
 */
async function testHealth() {
  logTest('Health Check');
  
  const result = await apiRequest('/health');
  
  if (result.ok && result.data?.status === 'ok') {
    logSuccess(`Health check passed: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    logError(`Health check failed: ${result.status} ${result.statusText}`);
    if (result.data) {
      logInfo(`Response: ${JSON.stringify(result.data)}`);
    }
    return false;
  }
}

/**
 * Test MCP endpoint (public, no auth required)
 */
async function testMcp() {
  logTest('MCP Endpoint (Public)');
  
  const result = await apiRequest('/api/public/v1/mcp');
  
  if (result.ok && result.data) {
    logSuccess(`MCP endpoint accessible`);
    if (result.data.name) {
      logInfo(`API Name: ${result.data.name}`);
    }
    if (result.data.version) {
      logInfo(`API Version: ${result.data.version}`);
    }
    if (result.data.endpoints) {
      const endpointCount = Object.keys(result.data.endpoints || {}).length;
      logInfo(`Endpoints documented: ${endpointCount}`);
    }
    return true;
  } else {
    logError(`MCP endpoint failed: ${result.status} ${result.statusText}`);
    if (result.data) {
      logInfo(`Response: ${JSON.stringify(result.data).substring(0, 200)}...`);
    }
    return false;
  }
}

/**
 * Test organizations endpoint (requires auth)
 */
async function testOrganizations() {
  logTest('Organizations Endpoint (Requires Auth)');
  
  if (!API_KEY) {
    logWarning('Skipping - API_KEY not provided');
    logInfo('Set API_KEY environment variable to test authenticated endpoints');
    return null;
  }

  const result = await apiRequest('/api/admin/v1/organizations');
  
  if (result.ok) {
    logSuccess(`Organizations endpoint accessible`);
    if (Array.isArray(result.data?.data)) {
      logInfo(`Found ${result.data.data.length} organizations`);
      result.data.data.forEach(org => {
        logInfo(`  - ${org.name} (${org.slug})`);
      });
    } else {
      logInfo(`Response: ${JSON.stringify(result.data).substring(0, 200)}...`);
    }
    return true;
  } else {
    if (result.status === 401) {
      logError('Authentication failed - check your API_KEY');
    } else {
      logError(`Organizations endpoint failed: ${result.status} ${result.statusText}`);
    }
    if (result.data) {
      logInfo(`Response: ${JSON.stringify(result.data)}`);
    }
    return false;
  }
}

/**
 * Test CORS headers
 */
async function testCors() {
  logTest('CORS Headers');
  
  const result = await apiRequest('/health', {
    method: 'OPTIONS',
  });
  
  const corsHeaders = {
    'access-control-allow-origin': result.headers['access-control-allow-origin'],
    'access-control-allow-methods': result.headers['access-control-allow-methods'],
    'access-control-allow-headers': result.headers['access-control-allow-headers'],
  };

  if (corsHeaders['access-control-allow-origin']) {
    logSuccess('CORS headers present');
    logInfo(`Allow Origin: ${corsHeaders['access-control-allow-origin']}`);
    logInfo(`Allow Methods: ${corsHeaders['access-control-allow-methods'] || 'N/A'}`);
    logInfo(`Allow Headers: ${corsHeaders['access-control-allow-headers'] || 'N/A'}`);
    return true;
  } else {
    logWarning('CORS headers not found (may be normal for some endpoints)');
    return false;
  }
}

/**
 * Test 404 handling
 */
async function testNotFound() {
  logTest('404 Not Found Handling');
  
  const result = await apiRequest('/api/nonexistent-endpoint');
  
  if (result.status === 404) {
    logSuccess('404 handling works correctly');
    return true;
  } else {
    logWarning(`Expected 404, got ${result.status}`);
    return false;
  }
}

/**
 * Test response time
 */
async function testResponseTime() {
  logTest('Response Time');
  
  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await apiRequest('/health');
    const duration = Date.now() - start;
    times.push(duration);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  logSuccess(`Average response time: ${avg.toFixed(2)}ms`);
  logInfo(`Min: ${min}ms, Max: ${max}ms`);
  
  return true;
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  logTest('Error Handling');
  
  if (!API_KEY) {
    logWarning('Skipping - API_KEY required for error handling test');
    return null;
  }

  // Test with invalid JSON body
  const result = await apiRequest('/api/admin/v1/organizations', {
    method: 'POST',
    body: 'invalid json',
  });
  
  if (result.status === 400 || result.status === 422) {
    logSuccess('Error handling works correctly (invalid JSON rejected)');
    return true;
  } else if (result.status === 401) {
    logWarning('Got 401 (auth required) - cannot test error handling without valid auth');
    return null;
  } else {
    logWarning(`Expected 400/422 for invalid JSON, got ${result.status}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('Cloudflare Worker API Test Suite', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\nAPI URL: ${API_URL}`, 'blue');
  if (API_KEY) {
    log(`API Key: ${API_KEY.substring(0, 10)}...`, 'blue');
  } else {
    log('API Key: Not provided (some tests will be skipped)', 'yellow');
  }

  const results = {
    health: await testHealth(),
    mcp: await testMcp(),
    cors: await testCors(),
    notFound: await testNotFound(),
    responseTime: await testResponseTime(),
    errorHandling: await testErrorHandling(),
    organizations: await testOrganizations(),
  };

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;
  const skipped = Object.values(results).filter(r => r === null).length;

  Object.entries(results).forEach(([test, result]) => {
    if (result === true) {
      log(`✓ ${test}`, 'green');
    } else if (result === false) {
      log(`✗ ${test}`, 'red');
    } else {
      log(`⊘ ${test} (skipped)`, 'yellow');
    }
  });

  log('\n' + '─'.repeat(60), 'cyan');
  log(`Total: ${passed} passed, ${failed} failed, ${skipped} skipped`, 'cyan');
  log('─'.repeat(60), 'cyan');

  if (failed === 0) {
    log('\n✓ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed', 'red');
    process.exit(1);
  }
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

