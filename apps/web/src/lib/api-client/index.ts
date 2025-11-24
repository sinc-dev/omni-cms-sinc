// API client for making requests to the Admin API
// Automatically includes authentication headers from Cloudflare Access

import { ApiError } from './errors';
import type { ErrorResponse } from '@/lib/api/response';

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use the new Hono API backend URL, fallback to same origin for development
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
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
        throw new ApiError(
          apiError.error.code,
          apiError.error.message,
          response.status,
          apiError.error.details
        );
      }

      // Fallback for non-standard error formats
      const errorMessage =
        errorData && typeof errorData === 'object' && 'message' in errorData
          ? String(errorData.message)
          : `HTTP ${response.status}: ${response.statusText}`;
      
      throw new ApiError(
        `HTTP_${response.status}`,
        errorMessage,
        response.status
      );
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
}

export const apiClient = new ApiClient();
export { ApiError } from './errors';
