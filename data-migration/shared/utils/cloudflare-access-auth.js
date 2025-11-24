/**
 * Cloudflare Access Authentication Helper
 * 
 * Generates JWT tokens from Cloudflare Access Application Token credentials
 * (Client ID + Client Secret)
 */

/**
 * Generate a Cloudflare Access JWT token from Application Token credentials
 * 
 * @param {string} clientId - CF-Access-Client-Id
 * @param {string} clientSecret - CF-Access-Client-Secret
 * @param {string} accessDomain - Your Cloudflare Access domain (e.g., "your-team.cloudflareaccess.com")
 * @returns {Promise<string>} JWT token to use in Cf-Access-Jwt-Assertion header
 */
export async function generateAccessJWT(clientId, clientSecret, accessDomain) {
  try {
    // Cloudflare Access Application Token endpoint
    const tokenUrl = `https://${accessDomain}/cdn-cgi/access/service-token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate JWT: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // The response should contain a JWT token
    if (data.token || data.access_token || data.jwt) {
      return data.token || data.access_token || data.jwt;
    }
    
    throw new Error('JWT token not found in response');
  } catch (error) {
    throw new Error(`Error generating Cloudflare Access JWT: ${error.message}`);
  }
}

/**
 * Alternative: Use Cloudflare's service token API
 * This is the newer method for Application Tokens
 */
export async function getServiceTokenJWT(clientId, clientSecret) {
  try {
    // Cloudflare's service token endpoint
    const response = await fetch('https://api.cloudflare.com/client/v4/access/service_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Email': clientId, // Sometimes used as email
        'X-Auth-Key': clientSecret, // Sometimes used as API key
      },
      body: JSON.stringify({
        name: 'omni-cms-migration',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get service token: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.token || data.token;
  } catch (error) {
    throw new Error(`Error getting service token: ${error.message}`);
  }
}

/**
 * Make authenticated API request using Application Token credentials
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @param {string} clientId - CF-Access-Client-Id
 * @param {string} clientSecret - CF-Access-Client-Secret
 * @param {string} accessDomain - Cloudflare Access domain
 */
export async function authenticatedFetch(url, options = {}, clientId, clientSecret, accessDomain) {
  // Generate JWT token
  const jwt = await generateAccessJWT(clientId, clientSecret, accessDomain);
  
  // Add JWT to headers
  const headers = {
    ...options.headers,
    'Cf-Access-Jwt-Assertion': jwt,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

