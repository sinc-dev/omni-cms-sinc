// API client for making requests to the Admin API
// Automatically includes authentication headers from Cloudflare Access

import { ApiError } from './errors';
import type { ErrorResponse } from '@/lib/api/response';

// Guard to prevent multiple simultaneous redirects (persists across page navigations)
const REDIRECT_KEY = 'omni-cms:redirecting';

function isRedirecting(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(REDIRECT_KEY) === 'true';
}

function setRedirecting(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    sessionStorage.setItem(REDIRECT_KEY, 'true');
  } else {
    sessionStorage.removeItem(REDIRECT_KEY);
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use the new Hono API backend URL
    // In development, default to localhost:8787 if not set
    // In production, NEXT_PUBLIC_API_URL should be set
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envApiUrl) {
      this.baseUrl = envApiUrl;
    } else {
      // Fallback: check if we're in browser and on localhost for development
      if (typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          // Development fallback: assume API runs on localhost:8787
          this.baseUrl = 'http://localhost:8787';
        } else {
          // Production: use same origin as fallback (if API is on same domain)
          this.baseUrl = window.location.origin;
        }
      } else {
        // SSR fallback: use empty string (will be set properly in browser)
        this.baseUrl = '';
      }
    }
  }

  private getBaseUrl(): string {
    // Return baseUrl, but if it's empty and we're in browser, use fallback
    if (!this.baseUrl && typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8787';
      }
      return window.location.origin;
    }
    return this.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    // Get session token from localStorage if available
    let sessionToken: string | null = null;
    if (typeof window !== 'undefined') {
      sessionToken = localStorage.getItem('omni-cms:session-token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add session token if available (for OTP authentication)
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      // Handle network errors (failed to fetch, CORS, etc.)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        let errorMessage: string;
        if (isLocalhost) {
          errorMessage = `Unable to connect to the API server. Please ensure the API is running on ${baseUrl}. ` +
            `Check that both the API and web servers are started.`;
        } else {
          errorMessage = `Unable to connect to the server. Please check your internet connection and try again. ` +
            `If the problem persists, the server may be temporarily unavailable.`;
        }
        
        throw new ApiError(
          'NETWORK_ERROR',
          errorMessage,
          0,
          { originalError: error.message, url, baseUrl }
        );
      }
      throw error;
    }

    if (!response.ok) {
      // Handle authentication/authorization errors with redirects
      if (response.status === 401) {
        // Clear expired session tokens immediately
        if (typeof window !== 'undefined') {
          localStorage.removeItem('omni-cms:session-token');
          // Clear any redirect flags to allow fresh redirect
          sessionStorage.removeItem('omni-cms:redirecting');
        }

        // Redirect to sign-in page (only once, and not if already there)
        if (typeof window !== 'undefined' && !isRedirecting()) {
          const currentPath = window.location.pathname;
          // Don't redirect if already on auth pages
          if (currentPath !== '/sign-in' && currentPath !== '/sign-up' && currentPath !== '/unauthorized' && currentPath !== '/forbidden' && currentPath !== '/select-organization') {
            setRedirecting(true);
            const redirectUrl = encodeURIComponent(currentPath);
            // Redirect will happen, but we still need to throw error for caller
            window.location.href = `/sign-in?redirect=${redirectUrl}`;
          }
        }
      } else if (response.status === 403) {
        // Redirect to forbidden page (only once, and not if already there)
        if (typeof window !== 'undefined' && !isRedirecting()) {
          const currentPath = window.location.pathname;
          // Don't redirect if already on error pages
          if (currentPath !== '/sign-in' && currentPath !== '/sign-up' && currentPath !== '/unauthorized' && currentPath !== '/forbidden') {
            setRedirecting(true);
            window.location.href = '/forbidden';
          }
        }
      }

      let errorData: ErrorResponse | { message?: string } = {};
      
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, create a generic error
        errorData = { message: 'An error occurred' };
      }

      // Check if it's our standard error response format
      if (
        errorData &&
        typeof errorData === 'object' &&
        'success' in errorData &&
        errorData.success === false &&
        'error' in errorData &&
        typeof errorData.error === 'object' &&
        errorData.error !== null &&
        'code' in errorData.error &&
        'message' in errorData.error
      ) {
        const apiError = errorData as ErrorResponse;
        
        // Provide user-friendly error messages with actionable guidance
        let userMessage = apiError.error.message;
        if (response.status === 401) {
          userMessage = 'Your session has expired. Please sign in again to continue.';
        } else if (response.status === 403) {
          userMessage = 'You don\'t have permission to perform this action. Contact your administrator if you need access.';
        } else if (response.status === 404) {
          userMessage = 'The requested resource was not found. It may have been deleted or moved.';
        } else if (response.status === 429) {
          userMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (response.status >= 500) {
          userMessage = 'A server error occurred. Please try again in a few moments. If the problem persists, contact support.';
        } else if (response.status === 422) {
          userMessage = apiError.error.message || 'The request contains invalid data. Please check your input and try again.';
        }
        
        throw new ApiError(
          apiError.error.code,
          userMessage,
          response.status,
          apiError.error.details
        );
      }

      // Fallback for non-standard error formats
      let errorMessage =
        errorData && typeof errorData === 'object' && 'message' in errorData
          ? String(errorData.message)
          : `HTTP ${response.status}: ${response.statusText}`;
      
      // Provide user-friendly messages for common status codes
      if (response.status === 401) {
        errorMessage = 'Your session has expired. Please sign in again to continue.';
      } else if (response.status === 403) {
        errorMessage = 'You don\'t have permission to perform this action. Contact your administrator if you need access.';
      } else if (response.status === 404) {
        errorMessage = 'The requested resource was not found. It may have been deleted or moved.';
      } else if (response.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (response.status >= 500) {
        errorMessage = 'A server error occurred. Please try again in a few moments. If the problem persists, contact support.';
      }
      
      throw new ApiError(
        `HTTP_${response.status}`,
        errorMessage,
        response.status
      );
    }

    // Clear redirect flag on successful requests (user is authenticated)
    if (response.ok && typeof window !== 'undefined') {
      setRedirecting(false);
    }

    return response.json();
  }

  // Organizations
  async getOrganizations() {
    return this.request('/api/admin/v1/organizations');
  }

  async getOrganization(orgId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}`);
  }

  async createOrganization(data: unknown) {
    return this.request('/api/admin/v1/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(orgId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}`, {
      method: 'DELETE',
    });
  }

  // Posts
  async getPosts(orgId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/posts${query}`);
  }

  // Advanced Search (HubSpot-style)
  async advancedSearch(orgId: string, searchRequest: {
    entityType?: 'posts' | 'media' | 'users' | 'taxonomies' | 'all';
    properties?: string[];
    filterGroups?: Array<{
      filters: Array<{
        property: string;
        operator: string;
        value?: string | number | boolean | string[] | null;
      }>;
      operator: 'AND' | 'OR';
    }>;
    sorts?: Array<{
      property: string;
      direction: 'asc' | 'desc';
    }>;
    limit?: number;
    after?: string;
    search?: string;
  }) {
    return this.request(`/api/admin/v1/organizations/${orgId}/search`, {
      method: 'POST',
      body: JSON.stringify(searchRequest),
    });
  }

  async searchPosts(orgId: string, query: string, params?: Record<string, string>) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return this.request(`/api/admin/v1/organizations/${orgId}/search?${searchParams}`);
  }

  async getPost(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}`);
  }

  async createPost(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(orgId: string, postId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePost(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  async publishPost(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/publish`, {
      method: 'POST',
    });
  }

  // Media
  async getMedia(orgId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/media${query}`);
  }

  async getMediaById(orgId: string, mediaId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/media/${mediaId}`);
  }

  /**
   * Request a presigned upload URL for a media file.
   * Returns the URL to upload to, the public URL of the file, and the generated file key.
   */
  async requestUploadUrl(orgId: string, data: {
    filename: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
  }) {
    return this.request<{
      uploadUrl: string;
      fileKey: string;
      publicUrl: string;
    }>(`/api/admin/v1/organizations/${orgId}/media`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadFile(uploadUrl: string, file: File) {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }
  }

  async deleteMedia(orgId: string, mediaId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  // Taxonomies
  async getTaxonomies(orgId: string, params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/taxonomies${queryString}`);
  }

  async getTaxonomy(orgId: string, taxonomyId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}`);
  }

  async createTaxonomy(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/taxonomies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTaxonomy(orgId: string, taxonomyId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTaxonomy(orgId: string, taxonomyId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}`, {
      method: 'DELETE',
    });
  }

  // Taxonomy Terms
  async getTaxonomyTerms(orgId: string, taxonomyId: string) {
    return this.request(
      `/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}/terms`
    );
  }

  async createTaxonomyTerm(orgId: string, taxonomyId: string, data: unknown) {
    return this.request(
      `/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}/terms`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateTaxonomyTerm(
    orgId: string,
    taxonomyId: string,
    termId: string,
    data: unknown
  ) {
    return this.request(
      `/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}/terms/${termId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteTaxonomyTerm(orgId: string, taxonomyId: string, termId: string) {
    return this.request(
      `/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}/terms/${termId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Post Types
  async getPostTypes(orgId: string, params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/post-types${queryString}`);
  }

  async getPostType(orgId: string, typeId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/post-types/${typeId}`);
  }

  async createPostType(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/post-types`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePostType(orgId: string, typeId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/post-types/${typeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePostType(orgId: string, typeId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/post-types/${typeId}`, {
      method: 'DELETE',
    });
  }

  // Custom Fields
  async getCustomFields(orgId: string, params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/custom-fields${queryString}`);
  }

  async getCustomField(orgId: string, fieldId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/custom-fields/${fieldId}`);
  }

  async createCustomField(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/custom-fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomField(orgId: string, fieldId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/custom-fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomField(orgId: string, fieldId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/custom-fields/${fieldId}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(orgId: string, params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/users${queryString}`);
  }

  async addUser(orgId: string, data: { email: string; roleId: string }) {
    return this.request(`/api/admin/v1/organizations/${orgId}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUserRole(orgId: string, userId: string, roleId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ roleId }),
    });
  }

  async removeUser(orgId: string, userId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Roles
  async getRoles() {
    return this.request('/api/admin/v1/roles');
  }

  // Post Edit Locks
  async getPostLock(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/lock`);
  }

  async acquirePostLock(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/lock`, {
      method: 'POST',
    });
  }

  async releasePostLock(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/lock`, {
      method: 'DELETE',
    });
  }

  async takeOverPostLock(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/lock/takeover`, {
      method: 'POST',
    });
  }

  async refreshPostLock(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/lock`, {
      method: 'POST',
    });
  }

  // Presence
  async updatePostPresence(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/presence`, {
      method: 'POST',
    });
  }

  async getPostPresence(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/presence`);
  }

  // Content Blocks
  async getContentBlocks(orgId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/content-blocks${query}`);
  }

  async getContentBlock(orgId: string, blockId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/content-blocks/${blockId}`);
  }

  async createContentBlock(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/content-blocks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContentBlock(orgId: string, blockId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/content-blocks/${blockId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContentBlock(orgId: string, blockId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/content-blocks/${blockId}`, {
      method: 'DELETE',
    });
  }

  // Templates
  async getTemplates(orgId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/templates${query}`);
  }

  async getTemplate(orgId: string, templateId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/templates/${templateId}`);
  }

  async createTemplate(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(orgId: string, templateId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(orgId: string, templateId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async createPostFromTemplate(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/from-template`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Webhooks
  async getWebhooks(orgId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/webhooks${query}`);
  }

  async getWebhook(orgId: string, webhookId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/webhooks/${webhookId}`);
  }

  async createWebhook(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebhook(orgId: string, webhookId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(orgId: string, webhookId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async testWebhook(orgId: string, webhookId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/webhooks/${webhookId}/test`, {
      method: 'POST',
    });
  }

  async getWebhookLogs(orgId: string, webhookId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/webhooks/${webhookId}/logs${query}`);
  }

  // Analytics
  async getAnalytics(orgId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/analytics${query}`);
  }

  async getPostAnalytics(orgId: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/analytics/posts${query}`);
  }

  // AI
  async getAISuggestions(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/ai?action=suggest`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async optimizeContent(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/ai?action=optimize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateMeta(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/ai?action=generate-meta`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateAltText(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/ai?action=generate-alt`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async translateContent(orgId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/ai?action=translate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Export/Import
  async exportOrganization(orgId: string, options?: Record<string, unknown>) {
    return this.request(`/api/admin/v1/organizations/${orgId}/export`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async importOrganization(orgId: string, data: unknown, options?: Record<string, unknown>) {
    return this.request(`/api/admin/v1/organizations/${orgId}/import`, {
      method: 'POST',
      body: JSON.stringify({ data, options }),
    });
  }

  // Post Versions
  async getPostVersions(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/versions`);
  }

  async getPostVersion(orgId: string, postId: string, versionId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/versions/${versionId}`);
  }

  async restorePostVersion(orgId: string, postId: string, versionId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/versions/${versionId}/restore`, {
      method: 'POST',
    });
  }

  // Workflow
  async submitForReview(orgId: string, postId: string, data?: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/workflow?action=submit`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async approvePost(orgId: string, postId: string, data?: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/workflow?action=approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async rejectPost(orgId: string, postId: string, data: unknown) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/workflow?action=reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPendingReviews(orgId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/pending-review`);
  }

  // API Keys
  async getApiKeys(orgId: string, params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/api/admin/v1/organizations/${orgId}/api-keys${queryString}`);
  }

  async createApiKey(orgId: string, data: { name: string; scopes?: string[]; rateLimit?: number; expiresAt?: string | null }) {
    return this.request(`/api/admin/v1/organizations/${orgId}/api-keys`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rotateApiKey(orgId: string, keyId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/api-keys/${keyId}/rotate`, {
      method: 'POST',
    });
  }

  // Schema endpoints
  async getSchema(orgId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/schema`);
  }

  async getSchemaByObjectType(orgId: string, objectType: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/schema/${objectType}`);
  }

  async getPostTypeSchema(orgId: string, postTypeId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/schema/post-types/${postTypeId}`);
  }

  async getPostTypesSchema(orgId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/schema/post-types`);
  }

  // Post Type Fields
  async getPostTypeFields(orgId: string, postTypeId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}/fields`);
  }

  async attachFieldToPostType(
    orgId: string,
    postTypeId: string,
    data: {
      customFieldId: string;
      isRequired?: boolean;
      order?: number;
      defaultValue?: string;
    }
  ) {
    return this.request(`/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}/fields`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async detachFieldFromPostType(orgId: string, postTypeId: string, fieldId: string) {
    return this.request(
      `/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}/fields/${fieldId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async updateFieldOrder(
    orgId: string,
    postTypeId: string,
    fieldOrders: Array<{ fieldId: string; order: number }>
  ) {
    return this.request(
      `/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}/fields/reorder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ fieldOrders }),
      }
    );
  }

  // Post Relationships
  async getPostRelationships(orgId: string, postId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${postId}/relationships`);
  }

  async createPostRelationship(
    orgId: string,
    fromPostId: string,
    data: { toPostId: string; relationshipType: string }
  ) {
    return this.request(`/api/admin/v1/organizations/${orgId}/posts/${fromPostId}/relationships`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePostRelationship(orgId: string, relationshipId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/relationships/${relationshipId}`, {
      method: 'DELETE',
    });
  }

  // Database Schema
  async getDatabaseSchema(orgId: string) {
    return this.request(`/api/admin/v1/organizations/${orgId}/schema/database`);
  }

  // Profile
  async getCurrentUser() {
    return this.request('/api/admin/v1/profile');
  }

  async updateProfile(data: { name?: string; avatarUrl?: string | null }) {
    return this.request('/api/admin/v1/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // OTP Authentication
  async requestOTP(email: string) {
    return this.request<{ success: true; data: { message: string } }>('/api/public/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTP(email: string, code: string) {
    return this.request<{
      success: true;
      data: {
        token: string;
        user: {
          id: string;
          email: string;
          name: string;
          isSuperAdmin: boolean;
        };
      };
    }>('/api/public/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }
}

export const apiClient = new ApiClient();
export { ApiError } from './errors';
