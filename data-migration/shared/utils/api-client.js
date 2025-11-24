/**
 * Omni-CMS API Client
 * 
 * Utility functions for making API calls to Omni-CMS
 */

/**
 * Get API key from environment or config
 */
function getApiKey() {
  return process.env.OMNI_CMS_API_KEY || null;
}

/**
 * Make API request to Omni-CMS
 */
export async function apiRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
  } = options;

  const apiKey = getApiKey();
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
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message.startsWith('API Error')) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * Get organization ID by slug
 */
export async function getOrganizationId(baseUrl, orgSlug) {
  const url = `${baseUrl}/api/admin/v1/organizations`;
  const data = await apiRequest(url);
  
  if (!data.success || !data.data) {
    throw new Error('Failed to fetch organizations');
  }

  const org = data.data.find(o => o.slug === orgSlug);
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
 * Create post
 */
export async function createPost(baseUrl, orgId, postData) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/posts`;
  const data = await apiRequest(url, {
    method: 'POST',
    body: postData,
  });
  
  if (!data.success) {
    throw new Error(`Failed to create post: ${data.message || 'Unknown error'}`);
  }

  return data.data;
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
 */
export async function uploadMedia(baseUrl, orgId, file, metadata = {}) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/media`;
  
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.alt_text) formData.append('alt_text', metadata.alt_text);
  if (metadata.caption) formData.append('caption', metadata.caption);

  const apiKey = getApiKey();
  const headers = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload media: ${errorText}`);
  }

  const data = await response.json();
  return data.data;
}

