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
      
      recommendedForLLMs: {
        primaryEndpoint: 'search',
        description: 'The search endpoint (POST /api/public/v1/:orgSlug/search) is the RECOMMENDED PRIMARY ENDPOINT for LLMs and AI agents. It provides the most powerful filtering capabilities, supports complex queries, and offers cursor-based pagination ideal for large datasets.',
        whyUseSearch: [
          'Supports all filtering types: relationships, taxonomies, custom fields, and standard post properties',
          'Advanced operators: eq, ne, gt, gte, lt, lte, in, not_in, contains, not_contains, starts_with, ends_with, between, is_null, is_not_null',
          'Filter groups with AND/OR logic for complex multi-condition queries',
          'Cursor-based pagination for efficient large dataset handling (no page limits)',
          'Property selection to reduce payload size and improve performance',
          'Multi-entity search (posts, media, users, taxonomies, or all)',
          'Full-text search across title, content, and excerpt',
          'Date operators: date_eq, date_gt, date_gte, date_lt, date_lte, date_between',
        ],
        whenToUsePosts: [
          'Simple queries with basic filters (post_type, search, date range)',
          'Public access without API key required',
          'Page-based pagination preferred',
          'Simple taxonomy or relationship filtering via query parameters',
        ],
        quickStart: {
          endpoint: 'POST /api/public/v1/:orgSlug/search',
          auth: 'Requires API key with posts:search scope (Header: Authorization: Bearer <api-key>)',
          example: {
            entityType: 'posts',
            filterGroups: [{
              filters: [{
                property: 'relationships.university.slug',
                operator: 'eq',
                value: 'coventry-university-kazakhstan'
              }, {
                property: 'taxonomies.program-degree-level',
                operator: 'in',
                value: ['bachelor', 'master']
              }, {
                property: 'customFields.tuition_fee',
                operator: 'lt',
                value: 5000
              }],
              operator: 'AND'
            }],
            limit: 100,
            properties: ['id', 'title', 'slug', 'excerpt']
          },
          note: 'For LLMs, always prefer the search endpoint unless you specifically need public access without authentication or simple page-based pagination.',
        },
      },
      
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
          method: 'API Key (Optional) OR Session Token (OTP)',
          description: 'Public endpoints support optional API key authentication. OTP authentication endpoints use session tokens returned from /auth/otp/verify. Session tokens are used in Authorization header as "Bearer {token}".',
          headers: {
            'Authorization': 'Bearer <api-key> OR Bearer <session-token>',
          },
          otpAuth: {
            description: 'OTP authentication flow: 1) Request OTP via /auth/otp/request, 2) Verify OTP via /auth/otp/verify to get session token, 3) Use session token in Authorization header for authenticated requests',
            sessionToken: 'Session tokens expire after 7 days and can be used for all authenticated endpoints',
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
            create: {
              method: 'POST',
              path: '/organizations',
              description: 'Create a new organization (Super Admin only)',
              auth: 'required',
              note: 'Only super admins can create organizations',
              body: {
                name: 'string (required) - Organization display name',
                slug: 'string (required) - URL-friendly identifier (lowercase, numbers, hyphens only)',
                domain: 'string (optional) - Custom domain for the organization',
                settings: 'object (optional) - JSON settings object',
              },
              response: 'Created organization object',
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId',
              description: 'Update organization details',
              auth: 'required',
              note: 'Requires organizations:update permission or super admin',
              params: ['orgId'],
              body: {
                name: 'string (optional) - Organization display name',
                slug: 'string (optional) - URL-friendly identifier (must be unique)',
                domain: 'string (optional) - Custom domain for the organization',
                settings: 'object (optional) - JSON settings object',
              },
              response: 'Updated organization object',
            },
            delete: {
              method: 'DELETE',
              path: '/organizations/:orgId',
              description: 'Delete an organization (Super Admin only)',
              auth: 'required',
              note: 'Only super admins can delete organizations. This will cascade delete all related data.',
              params: ['orgId'],
              response: 'Object with deleted: true',
            },
          },

          posts: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/posts',
              description: 'List posts with pagination and filtering',
              auth: 'required',
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                status: 'Filter by status: draft | published | archived',
                postTypeId: 'Filter by post type ID',
                search: 'Search in title, content, and excerpt',
                author_id: 'Filter by author ID',
                created_from: 'Filter posts created after date (ISO 8601, e.g., "2024-01-01T00:00:00Z")',
                created_to: 'Filter posts created before date (ISO 8601, e.g., "2024-12-31T23:59:59Z")',
                published_from: 'Filter posts published after date (ISO 8601, e.g., "2024-01-01T00:00:00Z")',
                published_to: 'Filter posts published before date (ISO 8601, e.g., "2024-12-31T23:59:59Z")',
                sort: 'Sort order: "field_asc" or "field_desc" (e.g., "createdAt_desc", "title_asc"). Supported fields: createdAt, updatedAt, publishedAt, title, slug (default: createdAt_desc)',
              },
              response: 'Paginated array of post objects with author and postType relations',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/posts/:postId',
              description: 'Get a single post by ID',
              auth: 'required',
              params: ['orgId', 'postId'],
              includes: 'Relations included in response: author, postType, taxonomies, customFields, featuredImage, relatedPosts',
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
              body: {
                title: 'string (optional)',
                slug: 'string (optional)',
                content: 'string (optional)',
                excerpt: 'string (optional)',
                status: 'draft | published | archived (optional)',
                featuredImageId: 'string | null (optional)',
                scheduledPublishAt: 'string | null (optional, ISO 8601 datetime)',
                structuredData: 'object | null (optional, JSON object)',
                customFields: 'object (optional, key-value pairs where key is customFieldId)',
                taxonomies: 'array | object (optional, array of termIds or object { taxonomyId: [termIds] })',
                relationships: 'array (optional, array of relationship objects)',
                autoSave: 'boolean (optional, if true, does not create version)',
              },
              note: 'Version is automatically created before update unless autoSave is true',
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
                response: 'Array of version objects with creator relation',
              },
              get: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/versions/:versionId',
                description: 'Get a specific version',
                auth: 'required',
                response: 'Version object with creator relation',
              },
              restore: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/versions/:versionId/restore',
                description: 'Restore a post to a previous version (creates backup version before restore)',
                auth: 'required',
                params: ['orgId', 'postId', 'versionId'],
                response: {
                  success: true,
                  data: {
                    message: 'Version restored',
                    restoredVersion: 'Version object that was restored',
                    backupVersion: 'New version object created from current state before restore',
                  },
                },
              },
            },
            lock: {
              get: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/lock',
                description: 'Check post edit lock status',
                auth: 'required',
                response: {
                  success: true,
                  data: {
                    locked: 'boolean',
                    lock: 'Lock object with user info (null if not locked)',
                    lockFields: {
                      id: 'string',
                      userId: 'string',
                      userName: 'string',
                      userAvatar: 'string | null',
                      lockedAt: 'datetime',
                      expiresAt: 'datetime',
                      isOwner: 'boolean',
                    },
                  },
                },
              },
              acquire: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/lock',
                description: 'Acquire or refresh edit lock (30 minute expiration)',
                auth: 'required',
                response: {
                  success: true,
                  data: {
                    lock: 'Lock object',
                    message: 'Lock acquired | Lock refreshed',
                  },
                  error: '409 Conflict if another user has the lock',
                },
              },
              release: {
                method: 'DELETE',
                path: '/organizations/:orgId/posts/:postId/lock',
                description: 'Release edit lock (only lock owner can release)',
                auth: 'required',
                response: { message: 'Lock released' },
              },
              takeover: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/lock/takeover',
                description: 'Force takeover of lock (requires posts:update permission)',
                auth: 'required',
                response: {
                  success: true,
                  data: {
                    lock: 'Lock object',
                    message: 'Lock taken over',
                  },
                },
              },
            },
            presence: {
              update: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/presence',
                description: 'Update user presence (heartbeat)',
                auth: 'required',
                response: { message: 'Presence updated' },
              },
              get: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/presence',
                description: 'Get active users viewing the post (users seen in last 2 minutes)',
                auth: 'required',
                response: {
                  success: true,
                  data: {
                    activeUsers: 'Array of user objects',
                    userFields: {
                      id: 'string',
                      name: 'string | null',
                      email: 'string',
                      avatarUrl: 'string | null',
                      lastSeenAt: 'datetime',
                    },
                  },
                },
              },
            },
            workflow: {
              submit: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/workflow?action=submit',
                description: 'Submit post for review',
                auth: 'required',
                body: {
                  reviewerId: 'string (optional, assign specific reviewer)',
                },
                response: { message: 'Post submitted for review' },
              },
              approve: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/workflow?action=approve',
                description: 'Approve a post',
                auth: 'required',
                body: {
                  comment: 'string (optional, approval comment)',
                },
                response: { message: 'Post approved' },
              },
              reject: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:postId/workflow?action=reject',
                description: 'Reject a post',
                auth: 'required',
                body: {
                  comment: 'string (required, rejection comment)',
                },
                response: { message: 'Post rejected' },
              },
            },
            fromTemplate: {
              method: 'POST',
              path: '/organizations/:orgId/posts/from-template',
              description: 'Create a post from a template (always creates as draft)',
              auth: 'required',
              body: {
                templateId: 'string (required)',
                title: 'string (required)',
                slug: 'string (required)',
              },
              response: 'Created post object with content and customFields from template',
            },
            pendingReview: {
              method: 'GET',
              path: '/organizations/:orgId/posts/pending-review',
              description: 'List posts pending review',
              auth: 'required',
              response: 'Array of post objects with author and postType relations, ordered by updatedAt descending',
            },
            relationships: {
              list: {
                method: 'GET',
                path: '/organizations/:orgId/posts/:postId/relationships',
                description: 'List all relationships for a post (both incoming and outgoing)',
                auth: 'required',
                params: ['orgId', 'postId'],
                response: {
                  success: true,
                  data: 'Array of relationship objects with direction field (outgoing/incoming)',
                  relationshipFields: {
                    id: 'string',
                    fromPostId: 'string',
                    toPostId: 'string',
                    relationshipType: 'string',
                    relatedPost: 'Post object (null if post not found)',
                    direction: 'outgoing | incoming',
                    createdAt: 'datetime',
                  },
                },
              },
              create: {
                method: 'POST',
                path: '/organizations/:orgId/posts/:fromPostId/relationships',
                description: 'Create a relationship between posts',
                auth: 'required',
                params: ['orgId', 'fromPostId'],
                body: {
                  toPostId: 'string (required)',
                  relationshipType: 'string (required)',
                },
                response: 'Relationship object',
              },
              delete: {
                method: 'DELETE',
                path: '/organizations/:orgId/relationships/:relationshipId',
                description: 'Delete a relationship',
                auth: 'required',
                params: ['orgId', 'relationshipId'],
                response: { deleted: true },
              },
            },
          },

          media: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/media',
              description: 'List media files',
              auth: 'required',
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                search: 'Search in filename',
                type: 'Filter by media type: image | video | other',
                created_from: 'Filter media created after date (ISO 8601, e.g., "2024-01-01T00:00:00Z")',
                created_to: 'Filter media created before date (ISO 8601, e.g., "2024-12-31T23:59:59Z")',
                sort: 'Sort order: filename_asc | filename_desc | createdAt_asc | createdAt_desc (default: createdAt_desc)',
              },
              response: 'Paginated array of media objects with uploader relation and URLs',
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
                metadata: 'object (optional, key-value pairs stored as JSON)',
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
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                search: 'Search in post type name',
              },
              response: 'Paginated array of post type objects',
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
                settings: 'object (optional, JSON object)',
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
            fields: {
              list: {
                method: 'GET',
                path: '/organizations/:orgId/post-types/:postTypeId/fields',
                description: 'List fields attached to a post type',
                auth: 'required',
                params: ['orgId', 'postTypeId'],
                response: {
                  success: true,
                  data: 'Array of post type field attachments with customField relation',
                  fieldAttachmentFields: {
                    id: 'string',
                    postTypeId: 'string',
                    customFieldId: 'string',
                    isRequired: 'boolean',
                    defaultValue: 'string | null',
                    order: 'number',
                    createdAt: 'datetime',
                    customField: 'CustomField object',
                  },
                },
              },
              attach: {
                method: 'POST',
                path: '/organizations/:orgId/post-types/:postTypeId/fields',
                description: 'Attach a custom field to a post type',
                auth: 'required',
                params: ['orgId', 'postTypeId'],
                body: {
                  customFieldId: 'string (required)',
                  isRequired: 'boolean (default: false)',
                  order: 'number (default: 0)',
                  defaultValue: 'string (optional)',
                },
                response: 'Post type field attachment object with customField relation',
              },
              remove: {
                method: 'DELETE',
                path: '/organizations/:orgId/post-types/:postTypeId/fields/:fieldId',
                description: 'Remove a field from a post type',
                auth: 'required',
                params: ['orgId', 'postTypeId', 'fieldId'],
                response: { deleted: true },
              },
              reorder: {
                method: 'PATCH',
                path: '/organizations/:orgId/post-types/:postTypeId/fields/reorder',
                description: 'Reorder fields attached to a post type',
                auth: 'required',
                params: ['orgId', 'postTypeId'],
                body: {
                  fieldOrders: 'array of { fieldId: string, order: number }',
                },
                response: { updated: 'number (count of updated fields)' },
              },
            },
          },

          taxonomies: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/taxonomies',
              description: 'List taxonomies',
              auth: 'required',
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                search: 'Search in taxonomy name',
              },
              response: 'Paginated array of taxonomy objects',
            },
            get: {
              method: 'GET',
              path: '/organizations/:orgId/taxonomies/:taxonomyId',
              description: 'Get taxonomy details',
              auth: 'required',
              response: 'Taxonomy object with terms relation included',
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
              path: '/organizations/:orgId/taxonomies/:taxonomyId',
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
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                search: 'Search in field name',
                field_type: 'Filter by field type',
                sort: 'Sort order: createdAt_asc | createdAt_desc | updatedAt_asc | updatedAt_desc | name_asc | name_desc | slug_asc | slug_desc (default: createdAt_desc)',
              },
              response: 'Paginated array of custom field objects',
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
                settings: 'object (optional, JSON object with field-specific configuration)',
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
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                search: 'Search in user name or email',
                roleId: 'Filter by role ID',
                sort: 'Sort order: name_asc | name_desc | email_asc | email_desc | createdAt_asc | createdAt_desc (default: createdAt_desc)',
              },
              response: 'Paginated array of user objects with role relation',
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

          profile: {
            get: {
              method: 'GET',
              path: '/profile',
              description: 'Get current authenticated user\'s profile',
              auth: 'required',
              response: {
                success: true,
                data: {
                  id: 'string',
                  name: 'string | null',
                  email: 'string',
                  avatarUrl: 'string | null',
                  isSuperAdmin: 'boolean',
                  createdAt: 'datetime',
                  updatedAt: 'datetime',
                },
              },
            },
            update: {
              method: 'PATCH',
              path: '/profile',
              description: 'Update current user\'s profile',
              auth: 'required',
              body: {
                name: 'string (optional)',
                avatarUrl: 'string | null (optional)',
              },
              response: 'Updated user profile object',
            },
          },

          apiKeys: {
            list: {
              method: 'GET',
              path: '/organizations/:orgId/api-keys',
              description: 'List API keys',
              auth: 'required',
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
              },
              response: 'Paginated array of API key objects (without hashed key, only keyPrefix)',
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
                scopes: 'string[] (optional, default: [])',
                rateLimit: 'number (optional, default: 10000, positive integer)',
                expiresAt: 'string | null (optional, ISO 8601 datetime)',
              },
              response: {
                key: 'Full API key (only shown once, store securely)',
                keyPrefix: 'Key prefix for identification',
                warning: 'Store this key securely. It will not be shown again.',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/api-keys/:keyId',
              description: 'Update API key',
              auth: 'required',
              body: {
                name: 'string (optional)',
                rateLimit: 'number (optional, positive integer)',
                expiresAt: 'string | null (optional, ISO 8601 datetime)',
              },
              note: 'Scopes cannot be updated via this endpoint. Use rotate to create new key with different scopes.',
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
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
              },
              response: 'Paginated array of webhook objects (without secret)',
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
                name: 'string (required)',
                url: 'string (required, valid URL)',
                events: 'string[] (required, at least one event)',
                active: 'boolean (optional, default: true)',
              },
              response: {
                webhook: 'Webhook object with secret (only shown once)',
                warning: 'Save this secret securely. It will not be shown again.',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/webhooks/:webhookId',
              description: 'Update webhook',
              auth: 'required',
              body: {
                name: 'string (optional)',
                url: 'string (optional, must be valid URL)',
                events: 'string[] (optional)',
                active: 'boolean (optional)',
              },
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
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                post_type: 'Filter by post type ID',
              },
              response: 'Paginated array of template objects',
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
              body: {
                postTypeId: 'string (required)',
                name: 'string (required)',
                slug: 'string (required)',
                content: 'object (required, JSON object with post data like { content, excerpt, featuredImageId })',
                customFields: 'object (optional, key-value pairs where key is customFieldId)',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/templates/:templateId',
              description: 'Update template',
              auth: 'required',
              body: {
                name: 'string (optional)',
                slug: 'string (optional)',
                postTypeId: 'string (optional)',
                content: 'object (optional, JSON object with post data)',
                customFields: 'object | null (optional, key-value pairs)',
              },
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
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
              },
              response: 'Paginated array of content block objects',
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
              body: {
                name: 'string (required)',
                slug: 'string (required)',
                blockType: 'text | image | video | gallery | cta | code | embed (required)',
                content: 'object (required, JSON object)',
              },
            },
            update: {
              method: 'PATCH',
              path: '/organizations/:orgId/content-blocks/:blockId',
              description: 'Update content block',
              auth: 'required',
              body: {
                name: 'string (optional)',
                slug: 'string (optional)',
                blockType: 'text | image | video | gallery | cta | code | embed (optional)',
                content: 'object (optional, JSON object)',
              },
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
              description: 'Simple search (backward compatibility endpoint)',
              auth: 'required',
              queryParams: {
                q: 'Search query (required)',
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
                post_type: 'Filter by post type ID (optional)',
                status: 'Filter by status (optional)',
                author_id: 'Filter by author ID (optional)',
              },
              response: 'Paginated search results (converted from cursor-based)',
            },
            advanced: {
              method: 'POST',
              path: '/organizations/:orgId/search',
              description: 'Advanced search with filters (HubSpot-style)',
              auth: 'required',
              body: {
                entityType: 'posts | media | users | taxonomies | all',
                properties: 'string[] (optional, properties to include in response)',
                filterGroups: 'array (optional, filter groups with AND/OR operators)',
                sorts: 'array (optional, sort configurations)',
                limit: 'number (optional)',
                after: 'string (optional, cursor for pagination)',
                search: 'string (optional, text search query)',
              },
              response: 'Cursor-based search results with results array and pagination cursor',
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
            database: {
              method: 'GET',
              path: '/organizations/:orgId/schema/database',
              description: 'Get raw database schema (tables, columns, indexes, foreign keys)',
              auth: 'required',
              params: ['orgId'],
              response: {
                success: true,
                data: {
                  tables: 'Array of table schema objects',
                  tableSchemaFields: {
                    name: 'string',
                    columns: 'Array of column objects',
                    indexes: 'Array of index objects',
                  },
                  columnFields: {
                    name: 'string',
                    type: 'string',
                    primaryKey: 'boolean',
                    nullable: 'boolean',
                    unique: 'boolean (optional)',
                    foreignKey: 'string (optional, format: "table.column")',
                    defaultValue: 'string | null (optional)',
                  },
                  indexFields: {
                    name: 'string',
                    columns: 'string[]',
                    unique: 'boolean',
                  },
                },
              },
            },
          },

          analytics: {
            overview: {
              method: 'GET',
              path: '/organizations/:orgId/analytics/overview',
              description: 'Get analytics overview (default: last 30 days)',
              auth: 'required',
              queryParams: {
                from: 'Start date (ISO 8601, optional, default: 30 days ago)',
                to: 'End date (ISO 8601, optional, default: now)',
                post_id: 'Filter by specific post ID (optional)',
              },
              response: {
                postId: 'string (if post_id provided)',
                period: '{ from: datetime, to: datetime }',
                analytics: 'Array of daily analytics (if post_id provided)',
                daily: 'Array of daily aggregated analytics (if no post_id)',
                totals: '{ views: number, uniqueViews: number, avgTimeOnPage?: number }',
              },
            },
            posts: {
              method: 'GET',
              path: '/organizations/:orgId/analytics/posts',
              description: 'Get analytics for all posts (sorted by total views descending)',
              auth: 'required',
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20)',
              },
              response: {
                success: true,
                data: 'Paginated array of post objects with analytics',
                postFields: {
                  id: 'string',
                  title: 'string',
                  slug: 'string',
                  status: 'string',
                  publishedAt: 'datetime | null',
                  totalViews: 'number',
                  totalUniqueViews: 'number',
                },
              },
            },
          },

          ai: {
            note: '⚠️ AI endpoints are still in development. DO NOT USE IN PRODUCTION until full AI integration is completed.',
            suggest: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=suggest',
              description: 'Get AI content suggestions',
              auth: 'required',
              body: {
                content: 'string (optional)',
                title: 'string (optional)',
                excerpt: 'string (optional)',
                language: 'string (optional)',
              },
              response: { suggestions: 'array of suggestion objects' },
            },
            optimize: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=optimize',
              description: 'Optimize content with AI',
              auth: 'required',
              body: {
                content: 'string (required)',
              },
              response: 'Optimized content object',
            },
            generateMeta: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=generate-meta',
              description: 'Generate meta description',
              auth: 'required',
              body: {
                content: 'string (required)',
              },
              response: { metaDescription: 'string' },
            },
            generateAltText: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=generate-alt',
              description: 'Generate alt text for image',
              auth: 'required',
              body: {
                imageUrl: 'string (required, valid image URL)',
              },
              response: { altText: 'string' },
            },
            translate: {
              method: 'POST',
              path: '/organizations/:orgId/ai?action=translate',
              description: 'Translate content',
              auth: 'required',
              body: {
                content: 'string (required)',
                targetLanguage: 'string (required)',
              },
              response: { translated: 'string' },
            },
          },

          import: {
            method: 'POST',
            path: '/organizations/:orgId/import',
            description: 'Import organization data',
            auth: 'required',
            body: {
              data: 'object (required, JSON import data)',
              options: {
                skipExisting: 'boolean (optional, default: false)',
                importMedia: 'boolean (optional, default: false)',
                dryRun: 'boolean (optional, default: false)',
              },
            },
            response: 'Import result object with statistics',
          },

          export: {
            method: 'POST',
            path: '/organizations/:orgId/export',
            description: 'Export organization data as JSON file',
            auth: 'required',
            body: {
              includePosts: 'boolean (optional, default: true)',
              includeMedia: 'boolean (optional, default: true)',
              includeTaxonomies: 'boolean (optional, default: true)',
              includeCustomFields: 'boolean (optional, default: true)',
              postTypeIds: 'string[] (optional, filter posts by post type IDs)',
            },
            response: {
              type: 'File download (application/json)',
              headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="export-{orgId}-{timestamp}.json"',
              },
            },
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
          description: 'Public endpoints for accessing published content. NOTE: For LLMs and AI agents, the search endpoint is strongly recommended as the primary endpoint due to its advanced filtering capabilities.',
          primaryEndpoint: 'search',
          note: 'The search endpoint (POST /:orgSlug/search) is the recommended primary endpoint for LLMs. It supports all filtering types, advanced operators, and cursor-based pagination.',
          organizationSlugs: [
            'study-in-kazakhstan',
            'study-in-north-cyprus',
            'paris-american-international-university',
          ],
          
          auth: {
            otp: {
              request: {
                method: 'POST',
                path: '/auth/otp/request',
                description: 'Request a one-time password (OTP) code to be sent to an email address',
                auth: 'none',
                body: {
                  email: 'string (required) - Email address to send OTP code to',
                },
                response: {
                  success: true,
                  data: {
                    message: 'OTP code sent to your email',
                  },
                },
                rateLimit: 'Maximum 3 requests per email per 15 minutes',
                note: 'OTP codes expire after 10 minutes. Rate limiting is enforced to prevent abuse.',
              },
              verify: {
                method: 'POST',
                path: '/auth/otp/verify',
                description: 'Verify OTP code and authenticate user. Creates a session token if successful.',
                auth: 'none',
                body: {
                  email: 'string (required) - Email address used to request OTP',
                  code: 'string (required) - 6-digit OTP code',
                },
                response: {
                  success: true,
                  data: {
                    token: 'string - Session token (store securely, use in Authorization header)',
                    user: {
                      id: 'string',
                      email: 'string',
                      name: 'string | null',
                      isSuperAdmin: 'boolean',
                    },
                  },
                },
                note: 'If user does not exist, they will be auto-provisioned. Session token expires after 7 days. Use token in Authorization header as "Bearer {token}" for authenticated requests.',
                maxAttempts: 'Maximum 3 verification attempts per OTP code',
              },
            },
          },
          
          posts: {
            list: {
              method: 'GET',
              path: '/:orgSlug/posts',
              description: 'List published posts with pagination, filtering, and rich data',
              auth: 'optional',
              queryParams: {
                page: 'Page number (default: 1)',
                per_page: 'Items per page (default: 20, max: 100)',
                post_type: 'Filter by post type slug(s). Supports single type (e.g., "programs") or comma-separated multiple types (e.g., "programs,blogs")',
                search: 'Search in title, content, and excerpt',
                published_from: 'Filter posts published after this date (ISO 8601, e.g., "2024-01-01T00:00:00Z")',
                published_to: 'Filter posts published before this date (ISO 8601, e.g., "2024-12-31T23:59:59Z")',
                related_to_slug: 'Filter posts that have a relationship to a post with this slug (e.g., "coventry-university-kazakhstan" to get all programs related to Coventry University)',
                relationship_type: 'Optional. Filter by relationship type when using related_to_slug (e.g., "university")',
                taxonomy: 'Filter by taxonomy term. Format: "taxonomy-slug:term-slug" (e.g., "program-degree-level:bachelor"). Can be repeated for multiple taxonomy filters (AND logic). Example: "?taxonomy=program-degree-level:bachelor&taxonomy=program-languages:english"',
                author_id: 'Filter posts by author ID',
                fields: 'Comma-separated list of fields to return. Reduces payload size. Supports: standard fields (id, title, slug, content, excerpt, status, publishedAt, createdAt, updatedAt), nested fields (author.id, author.name, postType.slug), custom fields (customFields.{field-slug}), and special fields (taxonomies, featuredImage). Example: "?fields=id,title,slug,excerpt,featuredImage,customFields.tuition_fee". If not specified, returns all fields.',
                sort: 'Sort order: "field_asc" or "field_desc" (e.g., "publishedAt_desc", "title_asc"). Supported fields: publishedAt, createdAt, updatedAt, title',
              },
              response: {
                success: true,
                data: 'Array of post objects with author, postType, featuredImage, taxonomies, and customFields. Note: relatedPosts are NOT included in list responses (only in single post responses)',
                meta: {
                  page: 'Current page number',
                  perPage: 'Items per page',
                  total: 'Total number of posts matching filters',
                  totalPages: 'Total number of pages',
                },
              },
              example: '/api/public/v1/study-in-kazakhstan/posts?page=1&per_page=20&post_type=programs&search=engineering&sort=publishedAt_desc',
              exampleWithRelationship: '/api/public/v1/study-in-kazakhstan/posts?post_type=programs&related_to_slug=coventry-university-kazakhstan&relationship_type=university&per_page=100',
              exampleWithTaxonomy: '/api/public/v1/study-in-kazakhstan/posts?post_type=programs&taxonomy=program-degree-level:bachelor&taxonomy=program-languages:english',
              exampleMultipleTypes: '/api/public/v1/study-in-kazakhstan/posts?post_type=programs,blogs&per_page=20',
              exampleListView: '/api/public/v1/study-in-kazakhstan/posts?post_type=programs&fields=id,title,slug,excerpt,featuredImage&per_page=20',
              exampleCustomFields: '/api/public/v1/study-in-kazakhstan/posts?post_type=programs&fields=id,title,slug,customFields.tuition_fee,customFields.duration',
              exampleMobileApp: '/api/public/v1/study-in-kazakhstan/posts?post_type=programs&fields=id,title,slug,excerpt,publishedAt&per_page=20',
              exampleSEOMetadata: '/api/public/v1/study-in-kazakhstan/posts?fields=id,title,slug,excerpt,customFields.meta_title,customFields.meta_description',
            },
            get: {
              method: 'GET',
              path: '/:orgSlug/posts/:slug',
              description: 'Get a published post by slug',
              auth: 'optional',
              includes: ['author', 'postType', 'taxonomies', 'customFields', 'featuredImage', 'relatedPosts'],
              example: '/api/public/v1/study-in-kazakhstan/posts/my-post-slug',
            },
          },

          taxonomies: {
            get: {
              method: 'GET',
              path: '/:orgSlug/taxonomies/:taxonomySlug',
              description: 'Get taxonomy with terms',
              auth: 'optional',
              response: {
                success: true,
                data: {
                  taxonomy: 'Taxonomy object',
                  terms: 'Array of term objects (hierarchical structure if isHierarchical is true)',
                  hierarchicalStructure: 'If isHierarchical is true, terms include children array',
                },
              },
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
            description: 'Public search endpoint (requires API key with posts:search scope). Supports advanced filtering including relationships, taxonomies, and custom fields.',
            auth: 'required (API key with posts:search scope)',
            body: {
              entityType: 'posts | media | users | taxonomies | all',
              limit: 'number (optional)',
              properties: 'string[] (optional, properties to include)',
              filterGroups: 'array (optional, filter groups)',
              sorts: 'array (optional, sort configurations)',
              after: 'string (optional, cursor for pagination)',
              search: 'string (optional, text search query)',
            },
            response: 'Cursor-based search results',
            note: 'API key is required. Search analytics are tracked automatically.',
            filterProperties: {
              standard: 'Standard post properties: id, title, slug, content, excerpt, status, createdAt, updatedAt, publishedAt, authorId, postTypeId, organizationId',
              customFields: 'Custom field properties: customFields.{field-slug} (e.g., customFields.tuition_fee). Supports all operators: eq, ne, gt, gte, lt, lte, in, not_in, contains, not_contains, is_null, is_not_null',
              relationships: 'Relationship properties: relationships.{type}.{field} (e.g., relationships.university.slug, relationships.university.id). Supported types: any relationship type. Supported fields: slug, id. Supports operators: eq, ne, in, not_in',
              taxonomies: 'Taxonomy properties: taxonomies.{taxonomy-slug} or taxonomies.{taxonomy-slug}.{term-slug} (e.g., taxonomies.program-degree-level, taxonomies.program-degree-level.bachelor). Supports operators: eq, ne, in, not_in. Use "in" operator for multiple terms',
            },
            exampleWithRelationship: {
              entityType: 'posts',
              filterGroups: [{
                filters: [{
                  property: 'relationships.university.slug',
                  operator: 'eq',
                  value: 'coventry-university-kazakhstan'
                }],
                operator: 'AND'
              }],
              limit: 100
            },
            exampleWithTaxonomy: {
              entityType: 'posts',
              filterGroups: [{
                filters: [{
                  property: 'taxonomies.program-degree-level',
                  operator: 'in',
                  value: ['bachelor', 'master']
                }],
                operator: 'AND'
              }],
              limit: 100
            },
            exampleCombined: {
              entityType: 'posts',
              filterGroups: [{
                filters: [{
                  property: 'relationships.university.slug',
                  operator: 'eq',
                  value: 'coventry-university-kazakhstan'
                }, {
                  property: 'taxonomies.program-degree-level',
                  operator: 'eq',
                  value: 'bachelor'
                }, {
                  property: 'customFields.tuition_fee',
                  operator: 'lt',
                  value: 5000
                }],
                operator: 'AND'
              }],
              limit: 100
            },
          },

          sitemap: {
            method: 'GET',
            path: '/:orgSlug/sitemap.xml',
            description: 'Generate sitemap XML for published posts',
            auth: 'none',
            queryParams: {
              domain: 'Optional. Override the base URL domain for sitemap URLs. Can be a full URL (https://example.com) or domain only (example.com). Priority: query param > organization.domain > APP_URL env var > request origin',
            },
            response: {
              type: 'XML file (application/xml)',
              content: 'XML sitemap with all published posts. URLs use the domain determined by priority: query parameter > organization.domain > APP_URL env var > request origin',
              headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
              },
            },
            example: '/api/public/v1/study-in-kazakhstan/sitemap.xml?domain=https://example.com',
            note: 'Domain resolution priority: 1) domain query parameter, 2) organization.domain field, 3) APP_URL environment variable, 4) request origin (fallback)',
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

          media: {
            method: 'GET',
            path: '/media/:fileKey',
            description: 'Serve media files from R2 via Workers route. Supports image variants via query parameter.',
            auth: 'none',
            params: {
              fileKey: 'R2 storage key (URL-encoded file path)',
            },
            queryParams: {
              variant: 'Optional image variant: "thumbnail" or "large". Falls back to original if variant not available.',
            },
            response: {
              type: 'File stream',
              headers: {
                'Content-Type': 'Inferred from file extension or R2 metadata',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'ETag': 'File ETag for cache validation',
                'Last-Modified': 'File upload timestamp',
              },
            },
            example: '/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg?variant=thumbnail',
            notes: [
              'Media files are served from private R2 bucket via Workers route',
              'Long-term caching (1 year) with ETag support for efficient delivery',
              'Variants are pre-generated files stored in R2 with suffix (e.g., "_thumbnail", "_large")',
              'If variant not found, original file is served (for images)',
              'Base URL comes from APP_URL environment variable',
            ],
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
          fileKey: 'string (R2 storage key, used in media URLs)',
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

      mediaUrls: {
        description: 'Media files are served via Workers route for security and caching',
        baseUrl: '{APP_URL}/api/public/v1/media/{fileKey}',
        generation: {
          method: 'Media URLs are generated using the fileKey field from the media object',
          baseUrlSource: 'APP_URL environment variable (e.g., "https://omni-cms-api.joseph-9a2.workers.dev")',
          fallback: 'If APP_URL not set, falls back to R2 public URL or direct R2 URL',
        },
        variants: {
          description: 'Image variants can be requested via query parameter',
          supported: ['thumbnail', 'large'],
          usage: '{baseUrl}?variant=thumbnail or {baseUrl}?variant=large',
          implementation: 'Variants are pre-generated files stored in R2 with suffix (e.g., "file_thumbnail.jpg")',
          fallback: 'If variant not found, original file is served (for images only)',
        },
        caching: {
          strategy: 'Long-term caching with immutable flag',
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': 'File ETag for cache validation',
            'Last-Modified': 'File upload timestamp',
          },
          benefits: [
            'Efficient edge caching via Cloudflare CDN',
            'Reduced R2 egress costs',
            'Faster content delivery',
            'Conditional requests supported (304 Not Modified)',
          ],
        },
        examples: {
          original: 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg',
          thumbnail: 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg?variant=thumbnail',
          large: 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg?variant=large',
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

      organizations: {
        slugs: [
          'study-in-kazakhstan',
          'study-in-north-cyprus',
          'paris-american-international-university',
        ],
        names: {
          'study-in-kazakhstan': 'Study In Kazakhstan',
          'study-in-north-cyprus': 'Study in North Cyprus',
          'paris-american-international-university': 'Paris American International University',
        },
      },

      examples: {
        createPost: {
          method: 'POST',
          url: '/api/admin/v1/organizations/{orgId}/posts',
          headers: {
            'Content-Type': 'application/json',
            'CF-Access-JWT': '{jwt-token}',
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
        getKazakhstanPosts: {
          method: 'GET',
          url: '/api/public/v1/study-in-kazakhstan/posts?page=1&per_page=20',
          description: 'Fetch published posts from Study In Kazakhstan',
          queryParams: {
            page: '1',
            per_page: '20',
            post_type: 'programs (optional)',
            search: 'engineering (optional)',
          },
        },
        getKazakhstanPostBySlug: {
          method: 'GET',
          url: '/api/public/v1/study-in-kazakhstan/posts/{slug}',
          description: 'Get a single published post by slug from Study In Kazakhstan',
        },
        getKazakhstanTaxonomy: {
          method: 'GET',
          url: '/api/public/v1/study-in-kazakhstan/taxonomies/program-types',
          description: 'Get program types taxonomy from Study In Kazakhstan',
        },
        getMediaFile: {
          method: 'GET',
          url: '/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg',
          description: 'Get original media file',
          response: 'File stream with Content-Type and Cache-Control headers',
        },
        getMediaThumbnail: {
          method: 'GET',
          url: '/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg?variant=thumbnail',
          description: 'Get thumbnail variant of media file',
          response: 'File stream (falls back to original if thumbnail not available)',
        },
        getMediaLarge: {
          method: 'GET',
          url: '/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg?variant=large',
          description: 'Get large variant of media file',
          response: 'File stream (falls back to original if large variant not available)',
        },
        postWithMedia: {
          description: 'Example post response showing featuredImage URL structure',
          example: {
            id: 'post_123',
            title: 'Example Post',
            slug: 'example-post',
            featuredImage: {
              id: 'media_456',
              fileKey: 'b443MNOxWMqWavh9CgMUI.jpg',
              filename: 'example-image.jpg',
              url: 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg',
              thumbnailUrl: 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg?variant=thumbnail',
              largeUrl: 'https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/b443MNOxWMqWavh9CgMUI.jpg?variant=large',
            },
          },
          note: 'Media URLs use Workers route format: {APP_URL}/api/public/v1/media/{fileKey}',
        },
      },
    };

    return c.json(successResponse(apiInfo));
  }
);

export default app;

