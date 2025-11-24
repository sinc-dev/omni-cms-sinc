/**
 * Omni-CMS API Client
 * 
 * Utility functions for making API calls to Omni-CMS
 */

/**
 * Get API key from environment or config
 */
function getApiKey(providedKey = null) {
  return providedKey || process.env.OMNI_CMS_API_KEY || null;
}

/**
 * Make API request to Omni-CMS
 */
export async function apiRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    apiKey: providedApiKey = null,
  } = options;

  const apiKey = getApiKey(providedApiKey);
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add API key authentication if available
  if (apiKey) {
    defaultHeaders['Authorization'] = `Bearer ${apiKey}`;
  }

  const config = {
    method,
    headers: defaultHeaders,
  };

  if (body && method !== 'GET') {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    // Add timeout to prevent hanging requests (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      // Extract error message from nested error object if present
      const errorMessage = errorData.error?.message || errorData.message || response.statusText;
      throw new Error(`API Error ${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout: The API request took longer than 60 seconds`);
    }
    if (error.message.startsWith('API Error')) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Get organization ID by slug
 */
export async function getOrganizationId(baseUrl, orgSlug, apiKey = null) {
  const url = `${baseUrl}/api/admin/v1/organizations`;
  const data = await apiRequest(url, { apiKey });
  
  if (!data.success || !data.data) {
    throw new Error('Failed to fetch organizations');
  }

  // When using API key auth, data.data is an array with a single organization
  // When using user auth, data.data is an array of all user's organizations
  const orgs = Array.isArray(data.data) ? data.data : [data.data];
  
  // If using API key, return the organization directly (it's already scoped)
  if (apiKey && orgs.length === 1) {
    const org = orgs[0];
    // Verify slug matches (optional check)
    if (org.slug !== orgSlug) {
      console.warn(`⚠ API key organization slug (${org.slug}) doesn't match requested slug (${orgSlug}), using API key's organization`);
    }
    return org.id;
  }

  // Otherwise, search by slug
  const org = orgs.find(o => o.slug === orgSlug);
  if (!org) {
    throw new Error(`Organization not found: ${orgSlug}`);
  }

  return org.id;
}

/**
 * Create post type
 */
export async function createPostType(baseUrl, orgId, postTypeData) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types`;
  const data = await apiRequest(url, {
    method: 'POST',
    body: postTypeData,
  });
  
  if (!data.success) {
    throw new Error(`Failed to create post type: ${data.message || 'Unknown error'}`);
  }

  return data.data;
}

/**
 * Create taxonomy
 */
export async function createTaxonomy(baseUrl, orgId, taxonomyData) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies`;
  const data = await apiRequest(url, {
    method: 'POST',
    body: taxonomyData,
  });
  
  if (!data.success) {
    throw new Error(`Failed to create taxonomy: ${data.message || 'Unknown error'}`);
  }

  return data.data;
}

/**
 * Create taxonomy term
 */
export async function createTaxonomyTerm(baseUrl, orgId, taxonomyId, termData) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}/terms`;
  const data = await apiRequest(url, {
    method: 'POST',
    body: termData,
  });
  
  if (!data.success) {
    throw new Error(`Failed to create taxonomy term: ${data.message || 'Unknown error'}`);
  }

  return data.data;
}

/**
 * Create custom field
 */
export async function createCustomField(baseUrl, orgId, fieldData) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/custom-fields`;
  const data = await apiRequest(url, {
    method: 'POST',
    body: fieldData,
  });
  
  if (!data.success) {
    throw new Error(`Failed to create custom field: ${data.message || 'Unknown error'}`);
  }

  return data.data;
}

/**
 * Get existing posts for a post type
 */
export async function getExistingPosts(baseUrl, orgId, postTypeId, apiKey = null) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/posts?postTypeId=${postTypeId}`;
  const data = await apiRequest(url, { apiKey });
  
  if (!data.success || !data.data) {
    return [];
  }

  return Array.isArray(data.data) ? data.data : [data.data];
}

/**
 * Create post
 */
export async function createPost(baseUrl, orgId, postData, apiKey = null) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/posts`;
  
  try {
    const data = await apiRequest(url, {
      method: 'POST',
      body: postData,
      apiKey,
    });
    
    if (!data.success) {
      const errorMsg = data.error?.message || data.message || 'Unknown error';
      const errorDetails = data.error ? JSON.stringify(data.error) : '';
      throw new Error(`Failed to create post: ${errorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);
    }

    return data.data;
  } catch (error) {
    // If it's already our formatted error, re-throw it
    if (error.message && error.message.includes('Failed to create post')) {
      throw error;
    }
    // Otherwise, wrap it
    throw new Error(`API Error ${error.status || 500}: ${error.message || 'Internal Server Error'}`);
  }
}

/**
 * Create post relationship
 */
export async function createPostRelationship(baseUrl, orgId, postId, relationshipData) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/posts/${postId}/relationships`;
  const data = await apiRequest(url, {
    method: 'POST',
    body: relationshipData,
  });
  
  if (!data.success) {
    throw new Error(`Failed to create relationship: ${data.message || 'Unknown error'}`);
  }

  return data.data;
}

/**
 * Upload media file
 * Uses two-step process: request upload URL, then upload file
 */
export async function uploadMedia(baseUrl, orgId, file, metadata = {}) {
  // Step 1: Request upload URL with metadata
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/media`;
  
  const apiKey = getApiKey();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Request upload URL
  const requestBody = {
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
  };

  const requestResponse = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!requestResponse.ok) {
    const errorText = await requestResponse.text();
    throw new Error(`Failed to request upload URL: ${errorText}`);
  }

  const requestData = await requestResponse.json();
  if (!requestData.success) {
    throw new Error(`Failed to request upload URL: ${requestData.error?.message || 'Unknown error'}`);
  }

  const { uploadUrl, media: mediaRecord } = requestData.data;

  // Step 2: Upload file to presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
  }

  // Step 3: Update media record with metadata (alt_text, caption)
  if (metadata.alt_text || metadata.caption) {
    const updateUrl = `${baseUrl}/api/admin/v1/organizations/${orgId}/media/${mediaRecord.id}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        altText: metadata.alt_text || null,
        caption: metadata.caption || null,
      }),
    });

    if (!updateResponse.ok) {
      console.warn(`Failed to update media metadata: ${updateResponse.statusText}`);
    }
  }

  return mediaRecord;
}

