import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { postTypes, customFields, postTypeFields } from '../../db/schema';
import { PostStatus, CustomFieldType } from '../../lib/types/enums';

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * GET /api/admin/v1/organizations/:orgId/schema/post-types/:postTypeId
 * 
 * Returns schema for a specific custom post type, including:
 * - Standard post properties
 * - Available custom fields for this post type
 * - Validation rules
 * - Enum values
 */
app.get(
  '/:orgId/schema/post-types/:postTypeId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postTypeId = c.req.param('postTypeId');

    if (!postTypeId) {
      return c.json(Errors.badRequest('Post Type ID is required'), 400);
    }

    try {
      // Fetch the post type
      const postType = await db.query.postTypes.findFirst({
        where: (pt, { eq, and: andFn }) => andFn(
          eq(pt.id, postTypeId),
          eq(pt.organizationId, organizationId!)
        ),
      });

      if (!postType) {
        return c.json(Errors.notFound('Post Type'), 404);
      }

      // Fetch custom fields attached to this post type via post_type_fields junction table
      const postTypeFieldsList = await db.query.postTypeFields.findMany({
        where: (ptf, { eq }) => eq(ptf.postTypeId, postTypeId),
        with: {
          customField: true,
        },
        orderBy: (ptf, { asc }) => [asc(ptf.order)],
      });

      // Build standard post properties
      const standardProperties = [
        {
          name: 'id',
          label: 'ID',
          type: 'string',
          required: true,
          readOnly: true,
          description: 'Unique identifier for the post',
        },
        {
          name: 'title',
          label: 'Title',
          type: 'string',
          required: true,
          validation: { maxLength: 500 },
          description: 'Post title',
        },
        {
          name: 'slug',
          label: 'Slug',
          type: 'string',
          required: true,
          validation: {
            pattern: '^[a-z0-9-]+$',
            maxLength: 500,
          },
          description: 'URL-friendly identifier',
        },
        {
          name: 'content',
          label: 'Content',
          type: 'string',
          required: false,
          description: 'Post content (HTML)',
        },
        {
          name: 'excerpt',
          label: 'Excerpt',
          type: 'string',
          required: false,
          validation: { maxLength: 1000 },
          description: 'Short description or excerpt',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'enum',
          required: true,
          enum: Object.values(PostStatus),
          default: PostStatus.DRAFT,
          options: [
            { value: PostStatus.DRAFT, label: 'Draft' },
            { value: PostStatus.PUBLISHED, label: 'Published' },
            { value: PostStatus.ARCHIVED, label: 'Archived' },
          ],
          description: 'Post publication status',
        },
        {
          name: 'workflowStatus',
          label: 'Workflow Status',
          type: 'enum',
          required: false,
          enum: ['draft', 'pending_review', 'approved', 'rejected'],
          default: 'draft',
          options: [
            { value: 'draft', label: 'Draft' },
            { value: 'pending_review', label: 'Pending Review' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ],
          description: 'Workflow approval status',
        },
        {
          name: 'publishedAt',
          label: 'Published At',
          type: 'datetime',
          required: false,
          description: 'Publication date and time',
        },
        {
          name: 'scheduledPublishAt',
          label: 'Scheduled Publish At',
          type: 'datetime',
          required: false,
          description: 'Scheduled publication date and time',
        },
        {
          name: 'metaTitle',
          label: 'Meta Title',
          type: 'string',
          required: false,
          validation: { maxLength: 60 },
          description: 'SEO meta title',
        },
        {
          name: 'metaDescription',
          label: 'Meta Description',
          type: 'string',
          required: false,
          validation: { maxLength: 160 },
          description: 'SEO meta description',
        },
        {
          name: 'metaKeywords',
          label: 'Meta Keywords',
          type: 'string',
          required: false,
          validation: { maxLength: 255 },
          description: 'SEO meta keywords',
        },
        {
          name: 'canonicalUrl',
          label: 'Canonical URL',
          type: 'string',
          required: false,
          validation: { pattern: '^https?://' },
          description: 'Canonical URL for SEO',
        },
      ];

      // Build custom field properties from post_type_fields relationships
      const customFieldProperties = postTypeFieldsList
        .filter(ptf => ptf.customField !== null)
        .map((ptf) => {
          const field = ptf.customField!;
          let settings: Record<string, unknown> | null = null;
          try {
            settings = field.settings ? JSON.parse(field.settings) : null;
          } catch (error) {
            console.error(`Failed to parse settings for custom field ${field.id}:`, error);
            settings = null;
          }
          
          const baseProperty = {
            name: field.slug,
            label: field.name,
            type: field.fieldType,
            required: ptf.isRequired,
            defaultValue: ptf.defaultValue,
            order: ptf.order,
            description: `Custom field: ${field.name}`,
          };

          // Add field-specific properties
          if (field.fieldType === 'select' || field.fieldType === 'multi_select') {
            const optionsRaw = settings?.options;
            const options = Array.isArray(optionsRaw) ? optionsRaw : [];
            return {
              ...baseProperty,
              enum: options.map((opt: string | { value: string; label: string }) => 
                typeof opt === 'string' ? opt : opt.value
              ),
              options: options.map((opt: string | { value: string; label: string }) => 
                typeof opt === 'string' 
                  ? { value: opt, label: opt }
                  : opt
              ),
            };
          }

          if (field.fieldType === 'number') {
            return {
              ...baseProperty,
              validation: {
                min: settings?.min,
                max: settings?.max,
              },
            };
          }

          if (field.fieldType === 'text' || field.fieldType === 'textarea') {
            return {
              ...baseProperty,
              validation: {
                maxLength: settings?.maxLength,
                pattern: settings?.pattern,
              },
            };
          }

          return baseProperty;
        });

      const schema = {
        objectType: 'post',
        postType: {
          id: postType.id,
          name: postType.name,
          slug: postType.slug,
          description: postType.description,
          icon: postType.icon,
          isHierarchical: postType.isHierarchical,
          settings: (() => {
            try {
              return postType.settings ? JSON.parse(postType.settings) : null;
            } catch (error) {
              console.error(`Failed to parse settings for post type ${postType.id}:`, error);
              return null;
            }
          })(),
        },
        properties: [...standardProperties, ...customFieldProperties],
        enums: {
          status: {
            values: Object.values(PostStatus),
            description: 'Post publication status values',
          },
          workflowStatus: {
            values: ['draft', 'pending_review', 'approved', 'rejected'],
            description: 'Workflow approval status values',
          },
          customFieldTypes: {
            values: Object.values(CustomFieldType),
            description: 'Available custom field types',
          },
        },
        relationships: [
          { type: 'belongsTo', target: 'postTypes', field: 'postTypeId' },
          { type: 'belongsTo', target: 'users', field: 'authorId' },
          { type: 'belongsTo', target: 'media', field: 'featuredImageId' },
          { type: 'belongsTo', target: 'media', field: 'ogImageId' },
          { type: 'belongsTo', target: 'posts', field: 'parentId' },
          { type: 'hasMany', target: 'taxonomies', through: 'postTaxonomies' },
          { type: 'hasMany', target: 'customFields', through: 'postFieldValues' },
        ],
      };

      return c.json(successResponse(schema));
    } catch (error) {
      console.error('Error fetching post type schema:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        organizationId,
        postTypeId,
      });
      return c.json(Errors.serverError('Failed to fetch post type schema'), 500);
    }
  }
);

export default app;

