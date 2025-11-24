import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware } from '../../lib/api/hono-public-middleware';
import { successResponse } from '../../lib/api/hono-response';

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * GET /api/public/v1/mcp
 * 
 * Model Context Protocol endpoint for LLMs to understand the API structure.
 * Returns comprehensive information about available endpoints, schemas, and usage.
 */
app.get(
  '/mcp',
  publicMiddleware(),
  async (c) => {
    const apiInfo = {
      name: 'Omni-CMS API',
      version: '1.0.0',
      description: 'Headless CMS API built with Hono on Cloudflare Workers',
      baseUrl: c.req.url.split('/api')[0] + '/api',
      
      authentication: {
        admin: {
          method: 'Cloudflare Access OR API Key',
          description: 'Admin endpoints support both Cloudflare Access (CF-Access-JWT header) and API key authentication (Bearer token). API keys are checked first, then falls back to Cloudflare Access.',
          headers: {
            'CF-Access-JWT': 'JWT token from Cloudflare Access (optional if API key provided)',
            'Authorization': 'Bearer <api-key> (optional if Cloudflare Access provided)',
          },
          apiKeyScopes: 'API keys must have appropriate scopes (e.g., "posts:create", "posts:read", etc.) matching the required permission for each endpoint',
        },
        public: {
          method: 'API Key (Optional)',
          description: 'Public endpoints support optional API key authentication',
          headers: {
            'Authorization': 'Bearer <api-key>',
          },
        },
      },

      endpoints: {
        admin: {
          basePath: '/api/admin/v1',
          description: 'Administrative endpoints for content management',
          
          organizations: {
            list: {
              method: 'GET',
              path: '/organizations',
              description: 'List all organizations the authenticated user has access to',
              auth: 'required',
              response: 'Array of organization objects',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId',
              description: 'Get organization details',
              auth: 'required',
              params: ['orgId'],
            },
          },

          posts: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/posts',
              description: 'List posts with pagination and filtering',
              auth: 'required',
              queryParams: ['page', 'per_page', 'status', 'postTypeId', 'search'],
              response: 'Paginated array of post objects',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/posts/:postId',
              description: 'Get a single post by ID',
              auth: 'required',
              params: ['orgId', 'postId'],
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/posts',
              description: 'Create a new post',
              auth: 'required',
              body: {
                postTypeId: 'string (required)',
                title: 'string (required)',
                slug: 'string (required)',
                content: 'string (optional)',
                excerpt: 'string (optional)',
                status: 'draft | published | archived (default: draft)',
                featuredImageId: 'string (optional)',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/posts/:postId',
              description: 'Update an existing post',
              auth: 'required',
              body: 'Partial post object',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/posts/:postId',
              description: 'Delete a post',
              auth: 'required',
            },
            publish: {
              method: 'POST',
              path: '/organizations/:orgId/posts/:postId/publish',
              description: 'Publish a post',
              auth: 'required',
            },
            unpublish: {
              method: 'DELETE',
              path: '/organizations/:orgId/posts/:postId/publish',
              description: 'Unpublish a post (set to draft)',
              auth: 'required',
            },
            versions: {
              list: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/versions',
                description: 'List all versions of a post',
                auth: 'required',
              },
              get: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/versions/:versionId',
                description: 'Get a specific version',
                auth: 'required',
              },
              restore: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/versions/:versionId/restore',
                description: 'Restore a post to a previous version',
                auth: 'required',
              },
            },
            lock: {
              get: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/lock',
                description: 'Check post edit lock status',
                auth: 'required',
              },
              acquire: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/lock',
                description: 'Acquire or refresh edit lock',
                auth: 'required',
              },
              release: {
                method: 'DELETE',
                path: '/organizations/:orgId/posts/:postId/lock',
                description: 'Release edit lock',
                auth: 'required',
              },
            },
            presence: {
              update: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/presence',
                description: 'Update user presence (heartbeat)',
                auth: 'required',
              },
              get: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/presence',
                description: 'Get active users viewing the post',
                auth: 'required',
              },
            },
            workflow: {
              submit: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/workflow?action=submit',
                description: 'Submit post for review',
                auth: 'required',
              },
              approve: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/workflow?action=approve',
                description: 'Approve a post',
                auth: 'required',
              },
              reject: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/workflow?action=reject',
                description: 'Reject a post',
                auth: 'required',
                body: { comment: 'string (required)' },
              },
            },
            fromTemplate: {
              method: 'POST',
              path: '/organizations/:orgId/posts/from-template',
              description: 'Create a post from a template',
              auth: 'required',
              body: {
                templateId: 'string (required)',
                title: 'string (required)',
                slug: 'string (required)',
              },
            },
            pendingReview: {
              method: 'GET',
              path: '/organizations/:orgId/posts/pending-review',
              description: 'List posts pending review',
              auth: 'required',
            },
          },

          media: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/media',
              description: 'List media files',
              auth: 'required',
              queryParams: ['page', 'per_page', 'search'],
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/media/:mediaId',
              description: 'Get media file details',
              auth: 'required',
            },
            requestUpload: {
              method: 'POST',
              path: '/organizations/:orgId/media',
              description: 'Request presigned upload URL',
              auth: 'required',
              body: {
                filename: 'string (required)',
                mimeType: 'string (required)',
                fileSize: 'number (required)',
                width: 'number (optional)',
                height: 'number (optional)',
              },
              response: {
                uploadUrl: 'Presigned URL for PUT upload',
                fileKey: 'File key for storage',
                publicUrl: 'Public URL of the file',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/media/:mediaId',
              description: 'Update media metadata',
              auth: 'required',
              body: {
                altText: 'string (optional)',
                caption: 'string (optional)',
              },
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/media/:mediaId',
              description: 'Delete a media file',
              auth: 'required',
            },
          },

          postTypes: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/post-types',
              description: 'List post types',
              auth: 'required',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/post-types/:typeId',
              description: 'Get post type details',
              auth: 'required',
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/post-types',
              description: 'Create a post type',
              auth: 'required',
              body: {
                name: 'string (required)',
                slug: 'string (required)',
                description: 'string (optional)',
                icon: 'string (optional)',
                isHierarchical: 'boolean (default: false)',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/post-types/:typeId',
              description: 'Update a post type',
              auth: 'required',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/post-types/:typeId',
              description: 'Delete a post type',
              auth: 'required',
            },
          },

          taxonomies: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/taxonomies',
              description: 'List taxonomies',
              auth: 'required',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/taxonomies/:taxonomyId',
              description: 'Get taxonomy details',
              auth: 'required',
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/taxonomies',
              description: 'Create a taxonomy',
              auth: 'required',
              body: {
                name: 'string (required)',
                slug: 'string (required)',
                isHierarchical: 'boolean (default: false)',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/taxonomies/:taxonomyId',
              description: 'Update a taxonomy',
              auth: 'required',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:taxonomies/:taxonomyId',
              description: 'Delete a taxonomy',
              auth: 'required',
            },
            terms: {
              list: {
                method: 'GET',
                path: '/organizations/:orgId/taxonomies/:taxonomyId/terms',
                description: 'List taxonomy terms',
                auth: 'required',
              },
              create: {
                method: 'POST',
                path: '/organizations/:orgId/taxonomies/:taxonomyId/terms',
                description: 'Create a taxonomy term',
                auth: 'required',
                body: {
                  name: 'string (required)',
                  slug: 'string (required)',
                  description: 'string (optional)',
                  parentId: 'string (optional)',
                },
              },
              update: {
                method: 'PATCH',
                path: '/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId',
                description: 'Update a taxonomy term',
                auth: 'required',
              },
              delete: {
                method: 'DELETE',
                path: '/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId',
                description: 'Delete a taxonomy term',
                auth: 'required',
              },
            },
          },

          customFields: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/custom-fields',
              description: 'List custom fields',
              auth: 'required',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/custom-fields/:fieldId',
              description: 'Get custom field details',
              auth: 'required',
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/custom-fields',
              description: 'Create a custom field',
              auth: 'required',
              body: {
                name: 'string (required)',
                slug: 'string (required)',
                fieldType: 'text | textarea | rich_text | number | boolean | date | datetime | media | relation | select | multi_select | json',
                settings: 'object (optional)',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/custom-fields/:fieldId',
              description: 'Update a custom field',
              auth: 'required',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/custom-fields/:fieldId',
              description: 'Delete a custom field',
              auth: 'required',
            },
          },

          users: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/users',
              description: 'List users in organization',
              auth: 'required',
              queryParams: ['search', 'roleId'],
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/users/:userId',
              description: 'Get user details',
              auth: 'required',
            },
            add: {
              method: 'POST',
              path: '/organizations/:orgId/users',
              description: 'Add user to organization',
              auth: 'required',
              body: {
                email: 'string (required)',
                roleId: 'string (required)',
              },
            },
            updateRole: {
              method: 'PATCH',
              path: '/organizations/:orgId/users/:userId',
              description: 'Update user role',
              auth: 'required',
              body: { roleId: 'string (required)' },
            },
            remove: {
              method: 'DELETE',
              path: '/organizations/:orgId/users/:userId',
              description: 'Remove user from organization',
              auth: 'required',
            },
          },

          roles: {
            list: {
              method: 'GET',
              path: '/roles',
              description: 'List all available roles',
              auth: 'required',
            },
          },

          apiKeys: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/api-keys',
              description: 'List API keys',
              auth: 'required',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/api-keys/:keyId',
              description: 'Get API key details',
              auth: 'required',
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/api-keys',
              description: 'Create an API key',
              auth: 'required',
              body: {
                name: 'string (required)',
                scopes: 'string[] (optional)',
                rateLimit: 'number (optional)',
                expiresAt: 'string (optional, ISO date)',
              },
              response: {
                key: 'Full API key (only shown once)',
                keyPrefix: 'Key prefix for identification',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/api-keys/:keyId',
              description: 'Update API key',
              auth: 'required',
            },
            rotate: {
              method: 'POST',
              path: '/organizations/:orgId/api-keys/:keyId/rotate',
              description: 'Rotate API key (generates new key)',
              auth: 'required',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/api-keys/:keyId',
              description: 'Revoke API key',
              auth: 'required',
            },
          },

          webhooks: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/webhooks',
              description: 'List webhooks',
              auth: 'required',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/webhooks/:webhookId',
              description: 'Get webhook details',
              auth: 'required',
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/webhooks',
              description: 'Create a webhook',
              auth: 'required',
              body: {
                url: 'string (required)',
                events: 'string[] (required)',
                secret: 'string (optional, auto-generated if not provided)',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/webhooks/:webhookId',
              description: 'Update webhook',
              auth: 'required',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/webhooks/:webhookId',
              description: 'Delete webhook',
              auth: 'required',
            },
            test: {
              method: 'POST',
              path: '/organizations/:orgId/webhooks/:webhookId/test',
              description: 'Test webhook delivery',
              auth: 'required',
            },
            logs: {
              method: 'GET',
              path: '/organizations/:orgId/webhooks/:webhookId/logs',
              description: 'Get webhook delivery logs',
              auth: 'required',
              queryParams: ['page', 'per_page'],
            },
          },

          templates: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/templates',
              description: 'List post templates',
              auth: 'required',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/templates/:templateId',
              description: 'Get template details',
              auth: 'required',
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/templates',
              description: 'Create a template',
              auth: 'required',
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/templates/:templateId',
              description: 'Update template',
              auth: 'required',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/templates/:templateId',
              description: 'Delete template',
              auth: 'required',
            },
          },

          contentBlocks: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/content-blocks',
              description: 'List reusable content blocks',
              auth: 'required',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/content-blocks/:blockId',
              description: 'Get content block details',
              auth: 'required',
            },
            create: {
              method: 'POST',
              path: '/organizations/:orgId/content-blocks',
              description: 'Create a content block',
              auth: 'required',
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/content-blocks/:blockId',
              description: 'Update content block',
              auth: 'required',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId/content-blocks/:blockId',
              description: 'Delete content block',
              auth: 'required',
            },
          },

          search: {
            simple: {
              method: 'GET',
              path: '/organizations/:orgId/search',
              description: 'Simple search',
              auth: 'required',
              queryParams: ['q', 'entityType', 'limit'],
            },
            advanced: {
              method: 'POST',
              path: '/organizations/:orgId/search',
              description: 'Advanced search with filters',
              auth: 'required',
              body: {
                entityType: 'posts | media | users | taxonomies | all',
                properties: 'string[] (optional)',
                filterGroups: 'array (optional)',
                sorts: 'array (optional)',
                limit: 'number (optional)',
                after: 'string (optional, cursor)',
                search: 'string (optional)',
              },
            },
          },

          schema: {
            overview: {
              method: 'GET',
              path: '/organizations/:orgId/schema',
              description: 'Get comprehensive schema for organization',
              auth: 'required',
            },
            objectType: {
              method: 'GET',
              path: '/organizations/:orgId/schema/:objectType',
              description: 'Get schema for specific object type',
              auth: 'required',
              objectTypes: ['posts', 'media', 'users', 'taxonomies'],
            },
            postType: {
              method: 'GET',
              path: '/organizations/:orgId/schema/post-types/:postTypeId',
              description: 'Get schema for specific post type',
              auth: 'required',
            },
          },

          analytics: {
            overview: {
              method: 'GET',
              path: '/organizations/:orgId/analytics/overview',
              description: 'Get analytics overview',
              auth: 'required',
              queryParams: ['from', 'to', 'post_id'],
            },
            posts: {
              method: 'GET',
              path: '/organizations/:orgId/analytics/posts',
              description: 'Get analytics for all posts',
              auth: 'required',
              queryParams: ['page', 'per_page'],
            },
          },

          ai: {
            suggest: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=suggest',
              description: 'Get AI content suggestions',
              auth: 'required',
            },
            optimize: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=optimize',
              description: 'Optimize content with AI',
              auth: 'required',
            },
            generateMeta: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=generate-meta',
              description: 'Generate meta description',
              auth: 'required',
            },
            generateAltText: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=generate-alt',
              description: 'Generate alt text for image',
              auth: 'required',
            },
            translate: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=translate',
              description: 'Translate content',
              auth: 'required',
            },
          },

          import: {
            method: 'POST',
            path: '/organizations/:orgId/import',
            description: 'Import organization data',
            auth: 'required',
            body: {
              data: 'object (required)',
              options: {
                skipExisting: 'boolean (optional)',
                importMedia: 'boolean (optional)',
                dryRun: 'boolean (optional)',
              },
            },
          },

          export: {
            method: 'POST',
            path: '/organizations/:orgId/export',
            description: 'Export organization data as JSON',
            auth: 'required',
            body: {
              includePosts: 'boolean (optional)',
              includeMedia: 'boolean (optional)',
              includeTaxonomies: 'boolean (optional)',
              includeCustomFields: 'boolean (optional)',
              postTypeIds: 'string[] (optional)',
            },
            response: 'JSON file download',
          },

          graphql: {
            method: 'POST',
            path: '/graphql',
            description: 'GraphQL endpoint',
            auth: 'required',
            body: {
              query: 'string (required)',
              variables: 'object (optional)',
              operationName: 'string (optional)',
            },
          },
        },

        public: {
          basePath: '/api/public/v1',
          description: 'Public endpoints for accessing published content',
          
          posts: {
            list: {
              method: 'GET',
              path: '/:orgSlug/posts',
              description: 'List published posts',
              auth: 'optional',
              queryParams: ['page', 'per_page', 'post_type', 'search'],
            },
            get: {
              method: 'GET',
              path: '/:orgSlug/posts/:slug',
              description: 'Get a published post by slug',
              auth: 'optional',
              includes: ['author', 'postType', 'taxonomies', 'customFields', 'featuredImage', 'relatedPosts'],
            },
          },

          taxonomies: {
            get: {
              method: 'GET',
              path: '/:orgSlug/taxonomies/:taxonomySlug',
              description: 'Get taxonomy with terms',
              auth: 'optional',
            },
            termPosts: {
              method: 'GET',
              path: '/:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts',
              description: 'List posts by taxonomy term',
              auth: 'optional',
              queryParams: ['page', 'per_page', 'post_type', 'search', 'published_from', 'published_to', 'sort'],
            },
          },

          search: {
            method: 'POST',
            path: '/:orgSlug/search',
            description: 'Public search endpoint',
            auth: 'optional',
            body: {
              entityType: 'posts | media | users | taxonomies | all',
              limit: 'number',
              properties: 'string[] (optional)',
              filterGroups: 'array (optional)',
            },
          },

          sitemap: {
            method: 'GET',
            path: '/:orgSlug/sitemap.xml',
            description: 'Generate sitemap XML',
            auth: 'none',
            response: 'XML sitemap',
          },

          postShare: {
            method: 'POST',
            path: '/:orgSlug/posts/:slug/share',
            description: 'Track post share',
            auth: 'none',
            body: {
              shareType: 'link | email | facebook | twitter | linkedin | other',
              metadata: 'object (optional)',
            },
          },

          postSEO: {
            method: 'GET',
            path: '/:orgSlug/posts/:slug/seo',
            description: 'Get SEO metadata for post',
            auth: 'none',
            response: {
              title: 'string',
              description: 'string',
              keywords: 'string',
              canonicalUrl: 'string',
              ogImage: 'string',
              structuredData: 'object',
            },
          },

          analyticsTrack: {
            method: 'POST',
            path: '/:orgSlug/analytics/track',
            description: 'Track analytics event',
            auth: 'none',
            body: {
              eventType: 'view | click | scroll | time',
              postId: 'string (optional)',
              timeOnPage: 'number (optional)',
              referrer: 'string (optional)',
            },
          },
        },
      },

      dataModels: {
        post: {
          id: 'string',
          organizationId: 'string',
          postTypeId: 'string',
          authorId: 'string',
          title: 'string',
          slug: 'string',
          content: 'string | null',
          excerpt: 'string | null',
          status: 'draft | published | archived',
          workflowStatus: 'draft | pending_review | approved | rejected',
          publishedAt: 'datetime | null',
          scheduledPublishAt: 'datetime | null',
          featuredImageId: 'string | null',
          ogImageId: 'string | null',
          parentId: 'string | null',
          metaTitle: 'string | null',
          metaDescription: 'string | null',
          metaKeywords: 'string | null',
          canonicalUrl: 'string | null',
          viewCount: 'number',
          shareCount: 'number',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        postType: {
          id: 'string',
          organizationId: 'string',
          name: 'string',
          slug: 'string',
          description: 'string | null',
          icon: 'string | null',
          isHierarchical: 'boolean',
          settings: 'json | null',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        taxonomy: {
          id: 'string',
          organizationId: 'string',
          name: 'string',
          slug: 'string',
          isHierarchical: 'boolean',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        taxonomyTerm: {
          id: 'string',
          taxonomyId: 'string',
          name: 'string',
          slug: 'string',
          description: 'string | null',
          parentId: 'string | null',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        media: {
          id: 'string',
          organizationId: 'string',
          uploaderId: 'string',
          filename: 'string',
          mimeType: 'string',
          fileSize: 'number',
          width: 'number | null',
          height: 'number | null',
          altText: 'string | null',
          caption: 'string | null',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        customField: {
          id: 'string',
          organizationId: 'string',
          name: 'string',
          slug: 'string',
          fieldType: 'text | textarea | rich_text | number | boolean | date | datetime | media | relation | select | multi_select | json',
          settings: 'json | null',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        user: {
          id: 'string',
          email: 'string',
          name: 'string | null',
          avatarUrl: 'string | null',
          isSuperAdmin: 'boolean',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
        organization: {
          id: 'string',
          name: 'string',
          slug: 'string',
          createdAt: 'datetime',
          updatedAt: 'datetime',
        },
      },

      responseFormat: {
        success: {
          success: true,
          data: 'T',
        },
        error: {
          success: false,
          error: {
            code: 'string',
            message: 'string',
            details: 'unknown (optional)',
          },
        },
        paginated: {
          success: true,
          data: 'T[]',
          meta: {
            page: 'number',
            perPage: 'number',
            total: 'number',
            totalPages: 'number',
          },
        },
      },

      permissions: {
        description: 'Role-based permissions control access to endpoints',
        common: [
          'posts:read',
          'posts:create',
          'posts:update',
          'posts:delete',
          'posts:publish',
          'post-types:read',
          'post-types:create',
          'post-types:update',
          'post-types:delete',
          'media:read',
          'media:create',
          'media:update',
          'media:delete',
          'taxonomies:read',
          'taxonomies:create',
          'taxonomies:update',
          'taxonomies:delete',
          'users:read',
          'users:create',
          'users:update',
          'users:delete',
          'organizations:read',
          'organizations:update',
        ],
      },

      examples: {
        createPost: {
          method: 'POST',
          url: '/api/admin/v1/organizations/{orgId}/posts',
          headers: {
            'Content-Type': 'application/json',
            'CF-Access-JWT': '{jwt-token',
          },
          body: {
            postTypeId: 'pt_123',
            title: 'My First Post',
            slug: 'my-first-post',
            content: '<p>Post content here</p>',
            excerpt: 'Short excerpt',
            status: 'draft',
          },
        },
        listPosts: {
          method: 'GET',
          url: '/api/admin/v1/organizations/{orgId}/posts?status=published&page=1&per_page=20',
          headers: {
            'CF-Access-JWT': '{jwt_token}',
          },
        },
        getPublicPost: {
          method: 'GET',
          url: '/api/public/v1/{orgSlug}/posts/{slug}',
          headers: {
            'Authorization': 'Bearer {api_key}',
          },
        },
      },
    };

    return c.json(successResponse(apiInfo));
  }
);

export default app;

