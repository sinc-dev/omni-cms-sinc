'use client';

import { useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { useOrganization } from '@/lib/context/organization-context';

/**
 * Hook that provides an API client with the current organization ID bound
 */
export function useApiClient() {
  const { organization } = useOrganization();

  return useMemo(() => {
    if (!organization) {
      throw new Error('No organization selected');
    }

    const orgId = organization.id;

    return {
      getPosts: (params?: Record<string, string>) =>
        apiClient.getPosts(orgId, params),
      searchPosts: (query: string, params?: Record<string, string>) =>
        apiClient.searchPosts(orgId, query, params),
      advancedSearch: (searchRequest: {
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
      }) => apiClient.advancedSearch(orgId, searchRequest),
      getPost: (postId: string) => apiClient.getPost(orgId, postId),
      createPost: (data: unknown) => apiClient.createPost(orgId, data),
      updatePost: (postId: string, data: unknown) =>
        apiClient.updatePost(orgId, postId, data),
      deletePost: (postId: string) => apiClient.deletePost(orgId, postId),
      publishPost: (postId: string) => apiClient.publishPost(orgId, postId),
      getMedia: (params?: Record<string, string>) =>
        apiClient.getMedia(orgId, params),
      getMediaById: (mediaId: string) =>
        apiClient.getMediaById(orgId, mediaId),
      requestUploadUrl: (data: {
        filename: string;
        mimeType: string;
        fileSize: number;
        width?: number;
        height?: number;
      }) => apiClient.requestUploadUrl(orgId, data),
      deleteMedia: (mediaId: string) => apiClient.deleteMedia(orgId, mediaId),
      getTaxonomies: (params?: Record<string, string>) =>
        apiClient.getTaxonomies(orgId, params),
      getTaxonomy: (taxonomyId: string) =>
        apiClient.getTaxonomy(orgId, taxonomyId),
      createTaxonomy: (data: unknown) =>
        apiClient.createTaxonomy(orgId, data),
      updateTaxonomy: (taxonomyId: string, data: unknown) =>
        apiClient.updateTaxonomy(orgId, taxonomyId, data),
      deleteTaxonomy: (taxonomyId: string) =>
        apiClient.deleteTaxonomy(orgId, taxonomyId),
      getTaxonomyTerms: (taxonomyId: string) =>
        apiClient.getTaxonomyTerms(orgId, taxonomyId),
      createTaxonomyTerm: (taxonomyId: string, data: unknown) =>
        apiClient.createTaxonomyTerm(orgId, taxonomyId, data),
      updateTaxonomyTerm: (
        taxonomyId: string,
        termId: string,
        data: unknown
      ) =>
        apiClient.updateTaxonomyTerm(orgId, taxonomyId, termId, data),
      deleteTaxonomyTerm: (taxonomyId: string, termId: string) =>
        apiClient.deleteTaxonomyTerm(orgId, taxonomyId, termId),
      getPostTypes: (params?: Record<string, string>) =>
        apiClient.getPostTypes(orgId, params),
      getPostType: (typeId: string) => apiClient.getPostType(orgId, typeId),
      createPostType: (data: unknown) => apiClient.createPostType(orgId, data),
      updatePostType: (typeId: string, data: unknown) =>
        apiClient.updatePostType(orgId, typeId, data),
      deletePostType: (typeId: string) => apiClient.deletePostType(orgId, typeId),
      getCustomFields: (params?: Record<string, string>) =>
        apiClient.getCustomFields(orgId, params),
      getCustomField: (fieldId: string) => apiClient.getCustomField(orgId, fieldId),
      createCustomField: (data: unknown) =>
        apiClient.createCustomField(orgId, data),
      updateCustomField: (fieldId: string, data: unknown) =>
        apiClient.updateCustomField(orgId, fieldId, data),
      deleteCustomField: (fieldId: string) =>
        apiClient.deleteCustomField(orgId, fieldId),
      getUsers: (params?: Record<string, string>) => apiClient.getUsers(orgId, params),
      addUser: (data: { email: string; roleId: string }) =>
        apiClient.addUser(orgId, data),
      updateUserRole: (userId: string, roleId: string) =>
        apiClient.updateUserRole(orgId, userId, roleId),
      removeUser: (userId: string) => apiClient.removeUser(orgId, userId),
      getRoles: () => apiClient.getRoles(),
      // Post Edit Locks
      getPostLock: (postId: string) => apiClient.getPostLock(orgId, postId),
      acquirePostLock: (postId: string) => apiClient.acquirePostLock(orgId, postId),
      releasePostLock: (postId: string) => apiClient.releasePostLock(orgId, postId),
      takeOverPostLock: (postId: string) => apiClient.takeOverPostLock(orgId, postId),
      refreshPostLock: (postId: string) => apiClient.refreshPostLock(orgId, postId),
      // Presence
      updatePostPresence: (postId: string) => apiClient.updatePostPresence(orgId, postId),
      getPostPresence: (postId: string) => apiClient.getPostPresence(orgId, postId),
      // Content Blocks
      getContentBlocks: (params?: Record<string, string>) => apiClient.getContentBlocks(orgId, params),
      getContentBlock: (blockId: string) => apiClient.getContentBlock(orgId, blockId),
      createContentBlock: (data: unknown) => apiClient.createContentBlock(orgId, data),
      updateContentBlock: (blockId: string, data: unknown) => apiClient.updateContentBlock(orgId, blockId, data),
      deleteContentBlock: (blockId: string) => apiClient.deleteContentBlock(orgId, blockId),
      // Templates
      getTemplates: (params?: Record<string, string>) => apiClient.getTemplates(orgId, params),
      getTemplate: (templateId: string) => apiClient.getTemplate(orgId, templateId),
      createTemplate: (data: unknown) => apiClient.createTemplate(orgId, data),
      updateTemplate: (templateId: string, data: unknown) => apiClient.updateTemplate(orgId, templateId, data),
      deleteTemplate: (templateId: string) => apiClient.deleteTemplate(orgId, templateId),
      createPostFromTemplate: (data: unknown) => apiClient.createPostFromTemplate(orgId, data),
      // Webhooks
      getWebhooks: (params?: Record<string, string>) => apiClient.getWebhooks(orgId, params),
      getWebhook: (webhookId: string) => apiClient.getWebhook(orgId, webhookId),
      createWebhook: (data: unknown) => apiClient.createWebhook(orgId, data),
      updateWebhook: (webhookId: string, data: unknown) => apiClient.updateWebhook(orgId, webhookId, data),
      deleteWebhook: (webhookId: string) => apiClient.deleteWebhook(orgId, webhookId),
      testWebhook: (webhookId: string) => apiClient.testWebhook(orgId, webhookId),
      getWebhookLogs: (webhookId: string, params?: Record<string, string>) => apiClient.getWebhookLogs(orgId, webhookId, params),
      // Analytics
      getAnalytics: (params?: Record<string, string>) => apiClient.getAnalytics(orgId, params),
      getPostAnalytics: (params?: Record<string, string>) => apiClient.getPostAnalytics(orgId, params),
      // AI
      getAISuggestions: (data: unknown) => apiClient.getAISuggestions(orgId, data),
      optimizeContent: (data: unknown) => apiClient.optimizeContent(orgId, data),
      generateMeta: (data: unknown) => apiClient.generateMeta(orgId, data),
      generateAltText: (data: unknown) => apiClient.generateAltText(orgId, data),
      translateContent: (data: unknown) => apiClient.translateContent(orgId, data),
      // Export/Import
      exportOrganization: (options?: Record<string, unknown>) => apiClient.exportOrganization(orgId, options),
      importOrganization: (data: unknown, options?: Record<string, unknown>) => apiClient.importOrganization(orgId, data, options),
      // Post Versions
      getPostVersions: (postId: string) => apiClient.getPostVersions(orgId, postId),
      getPostVersion: (postId: string, versionId: string) => apiClient.getPostVersion(orgId, postId, versionId),
      restorePostVersion: (postId: string, versionId: string) => apiClient.restorePostVersion(orgId, postId, versionId),
      // Workflow
      submitForReview: (postId: string, data?: unknown) => apiClient.submitForReview(orgId, postId, data),
      approvePost: (postId: string, data?: unknown) => apiClient.approvePost(orgId, postId, data),
      rejectPost: (postId: string, data: unknown) => apiClient.rejectPost(orgId, postId, data),
      getPendingReviews: () => apiClient.getPendingReviews(orgId),
      // API Keys
      getApiKeys: (params?: Record<string, string>) => apiClient.getApiKeys(orgId, params),
      createApiKey: (data: { name: string; scopes?: string[]; rateLimit?: number; expiresAt?: string | null }) => apiClient.createApiKey(orgId, data),
      rotateApiKey: (keyId: string) => apiClient.rotateApiKey(orgId, keyId),
      // Schema endpoints
      getSchema: (objectType: string) => apiClient.getSchema(orgId, objectType),
      getPostTypeSchema: (postTypeId: string) => apiClient.getPostTypeSchema(orgId, postTypeId),
      getPostTypesSchema: () => apiClient.getPostTypesSchema(orgId),
    };
  }, [organization]);
}

