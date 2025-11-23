import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { postTypes, customFields } from '@/db/schema';
import { PostStatus, CustomFieldType } from '@/lib/types/enums';

/**
 * GET /api/admin/v1/organizations/:orgId/schema/post-types/:postTypeId
 * 
 * Returns schema for a specific custom post type, including:
 * - Standard post properties
 * - Available custom fields for this post type
 * - Validation rules
 * - Enum values
 */
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const postTypeId = params?.postTypeId;

    if (!postTypeId) {
      return Errors.badRequest('Post Type ID is required');
    }

    try {
      // Fetch the post type
      const postType = await db.query.postTypes.findFirst({
        where: and(
          eq(postTypes.id, postTypeId),
          eq(postTypes.organizationId, organizationId!)
        ),
      });

      if (!postType) {
        return Errors.notFound('Post Type');
      }

      // Fetch all custom fields for this organization
      // Note: In current schema, custom fields are organization-wide
      const allCustomFields = await db.query.customFields.findMany({
        where: eq(customFields.organizationId, organizationId!),
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

      // Build custom field properties
      const customFieldProperties = allCustomFields.map((field) => {
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
          required: false,
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

      return successResponse(schema);
    } catch (error) {
      console.error('Error fetching post type schema:', error);
      return Errors.serverError('Failed to fetch post type schema');
    }
  },
  {
    requiredPermission: 'post-types:read',
    requireOrgAccess: true,
  }
);

