import { Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { postTypes, customFields, taxonomies, postRelationships, posts, postTypeFields } from '../../db/schema';
import { sql } from 'drizzle-orm';
import {
  PostStatus,
  CustomFieldType,
  FilterOperator,
  FilterGroupOperator,
  SortDirection,
  EntityType,
} from '../../lib/types/enums';

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * GET /api/admin/v1/organizations/:orgId/schema
 * 
 * Returns comprehensive schema/metadata for the organization's content structure.
 * Similar to HubSpot's schema endpoint for API discovery.
 */
app.get(
  '/:orgId/schema',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    try {

      // Fetch all post types
      const allPostTypes = await db.query.postTypes.findMany({
        where: (pt, { eq }) => eq(pt.organizationId, organizationId!),
      });

      // Fetch all custom fields
      const allCustomFields = await db.query.customFields.findMany({
        where: (cf, { eq }) => eq(cf.organizationId, organizationId!),
      });

      // Fetch all taxonomies with their terms
      const allTaxonomies = await db.query.taxonomies.findMany({
        where: (t, { eq }) => eq(t.organizationId, organizationId!),
        with: {
          terms: true,
        },
      });

      // Query distinct relationship types from post_relationships
      // Join with posts to ensure we only get relationships for this organization
      const relationshipTypesResult = await db
        .selectDistinct({ relationshipType: postRelationships.relationshipType })
        .from(postRelationships)
        .innerJoin(posts, eq(postRelationships.fromPostId, posts.id))
        .where(eq(posts.organizationId, organizationId!));

      const relationshipTypes = relationshipTypesResult
        .map((r) => r.relationshipType)
        .filter(Boolean)
        .sort();

      // Query distinct field types from custom_fields
      const fieldTypesResult = await db
        .selectDistinct({ fieldType: customFields.fieldType })
        .from(customFields)
        .where(eq(customFields.organizationId, organizationId!));

      const fieldTypes = fieldTypesResult
        .map((f) => f.fieldType)
        .filter(Boolean)
        .sort();

      // Generate color mappings for relationship types and field types
      const generateColorMapping = (types: string[]) => {
        const defaultColors = [
          '#3b82f6', // blue
          '#10b981', // green
          '#f59e0b', // orange
          '#ef4444', // red
          '#8b5cf6', // purple
          '#ec4899', // pink
          '#06b6d4', // cyan
          '#84cc16', // lime
          '#f97316', // orange-600
          '#6366f1', // indigo
        ];
        const mapping: Record<string, string> = {};
        types.forEach((type, index) => {
          mapping[type] = defaultColors[index % defaultColors.length];
        });
        return mapping;
      };

      // Fetch post type fields relationships
      const allPostTypeFields = allPostTypes.length > 0
        ? await db.query.postTypeFields.findMany({
            where: (ptf, { inArray }) => inArray(
              ptf.postTypeId,
              allPostTypes.map(pt => pt.id)
            ),
            with: {
              customField: true,
            },
            orderBy: (ptf, { asc }) => [asc(ptf.order)],
          })
        : [];

      // Build a map of post type ID to custom fields
      const postTypeFieldsMap = new Map<string, Array<{
        id: string;
        name: string;
        slug: string;
        fieldType: string;
        settings: any;
        isRequired: boolean;
        defaultValue: string | null;
        order: number;
      }>>();

      for (const ptf of allPostTypeFields) {
        if (!ptf.customField) continue;
        
        const fieldList = postTypeFieldsMap.get(ptf.postTypeId) || [];
        let settings: any = null;
        try {
          settings = ptf.customField.settings ? JSON.parse(ptf.customField.settings) : null;
        } catch (error) {
          console.error(`Failed to parse settings for custom field ${ptf.customField.id}:`, error);
        }

        fieldList.push({
          id: ptf.customField.id,
          name: ptf.customField.name,
          slug: ptf.customField.slug,
          fieldType: ptf.customField.fieldType,
          settings,
          isRequired: ptf.isRequired,
          defaultValue: ptf.defaultValue,
          order: ptf.order,
        });
        postTypeFieldsMap.set(ptf.postTypeId, fieldList);
      }

      // Build post types with their associated custom fields
      const postTypesWithFields = allPostTypes.map((postType) => {
        const fields = postTypeFieldsMap.get(postType.id) || [];
        // Sort fields by order
        fields.sort((a, b) => a.order - b.order);

        return {
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
          // Only return custom fields attached to this post type
          availableFields: fields.map((field) => ({
            id: field.id,
            name: field.name,
            slug: field.slug,
            fieldType: field.fieldType,
            settings: field.settings,
            isRequired: field.isRequired,
            defaultValue: field.defaultValue,
            order: field.order,
          })),
        };
      });

      // Build standard post properties
      const standardPostProperties = [
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
          maxLength: 500,
          description: 'Post title',
        },
        {
          name: 'slug',
          label: 'Slug',
          type: 'string',
          required: true,
          maxLength: 500,
          pattern: '^[a-z0-9-]+$',
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
          maxLength: 1000,
          description: 'Short description or excerpt',
        },
        {
          name: 'status',
          label: 'Status',
          type: 'enum',
          required: true,
          options: Object.values(PostStatus),
          default: PostStatus.DRAFT,
          description: 'Post publication status',
        },
        {
          name: 'publishedAt',
          label: 'Published At',
          type: 'datetime',
          required: false,
          description: 'Publication date and time',
        },
        {
          name: 'createdAt',
          label: 'Created At',
          type: 'datetime',
          required: true,
          readOnly: true,
          description: 'Creation date and time',
        },
        {
          name: 'updatedAt',
          label: 'Updated At',
          type: 'datetime',
          required: true,
          readOnly: true,
          description: 'Last update date and time',
        },
        {
          name: 'viewCount',
          label: 'View Count',
          type: 'number',
          required: false,
          readOnly: true,
          description: 'Number of times the post has been viewed',
        },
        {
          name: 'shareCount',
          label: 'Share Count',
          type: 'number',
          required: false,
          readOnly: true,
          description: 'Number of times the post has been shared',
        },
      ];

      // Build schema response
      const schema = {
        organizationId: organizationId!,
        postTypes: postTypesWithFields,
        taxonomies: allTaxonomies.map((taxonomy) => ({
          id: taxonomy.id,
          name: taxonomy.name,
          slug: taxonomy.slug,
          isHierarchical: taxonomy.isHierarchical,
          terms: taxonomy.terms?.map((term) => ({
            id: term.id,
            name: term.name,
            slug: term.slug,
            description: term.description,
            parentId: term.parentId,
          })) || [],
        })),
        standardProperties: {
          posts: standardPostProperties,
        },
        enums: {
          postStatus: {
            values: Object.values(PostStatus),
            description: 'Post publication status values',
          },
          customFieldType: {
            values: Object.values(CustomFieldType),
            description: 'Custom field type values',
          },
          filterOperator: {
            values: Object.values(FilterOperator),
            description: 'Available filter operators for search queries',
          },
          filterGroupOperator: {
            values: Object.values(FilterGroupOperator),
            description: 'Filter group logical operators',
          },
          sortDirection: {
            values: Object.values(SortDirection),
            description: 'Sort direction values',
          },
          entityType: {
            values: Object.values(EntityType),
            description: 'Entity types available for search',
          },
        },
        filterOperators: Object.values(FilterOperator).map((op) => ({
          value: op,
          label: op.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          description: getOperatorDescription(op),
          valueType: getOperatorValueType(op),
        })),
        validationRules: {
          slug: {
            pattern: '^[a-z0-9-]+$',
            message: 'Slug must contain only lowercase letters, numbers, and hyphens',
          },
          customFieldSlug: {
            pattern: '^[a-z0-9_]+$',
            message: 'Custom field slug must contain only lowercase letters, numbers, and underscores',
          },
        },
        metadata: {
          relationshipTypes: relationshipTypes,
          fieldTypes: fieldTypes,
          colorMappings: {
            relationshipTypes: generateColorMapping(relationshipTypes),
            fieldTypes: generateColorMapping(fieldTypes),
          },
        },
      };

      return c.json(successResponse(schema));
    } catch (error) {
      console.error('Error fetching schema:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        organizationId,
      });
      return c.json(Errors.serverError('Failed to fetch schema'), 500);
    }
  }
);

/**
 * Helper function to get operator description
 */
function getOperatorDescription(operator: FilterOperator): string {
  const descriptions: Record<FilterOperator, string> = {
    [FilterOperator.EQ]: 'Equals',
    [FilterOperator.NE]: 'Not equals',
    [FilterOperator.GT]: 'Greater than',
    [FilterOperator.GTE]: 'Greater than or equal',
    [FilterOperator.LT]: 'Less than',
    [FilterOperator.LTE]: 'Less than or equal',
    [FilterOperator.IN]: 'In array',
    [FilterOperator.NOT_IN]: 'Not in array',
    [FilterOperator.CONTAINS]: 'Contains substring',
    [FilterOperator.NOT_CONTAINS]: 'Does not contain substring',
    [FilterOperator.STARTS_WITH]: 'Starts with',
    [FilterOperator.ENDS_WITH]: 'Ends with',
    [FilterOperator.BETWEEN]: 'Between two values',
    [FilterOperator.IS_NULL]: 'Is null',
    [FilterOperator.IS_NOT_NULL]: 'Is not null',
    [FilterOperator.DATE_EQ]: 'Date equals',
    [FilterOperator.DATE_GT]: 'Date greater than',
    [FilterOperator.DATE_GTE]: 'Date greater than or equal',
    [FilterOperator.DATE_LT]: 'Date less than',
    [FilterOperator.DATE_LTE]: 'Date less than or equal',
    [FilterOperator.DATE_BETWEEN]: 'Date between',
  };
  return descriptions[operator] || operator;
}

/**
 * Helper function to get operator value type
 */
function getOperatorValueType(operator: FilterOperator): string | string[] {
  const valueTypes: Record<FilterOperator, string | string[]> = {
    [FilterOperator.EQ]: 'string | number | boolean',
    [FilterOperator.NE]: 'string | number | boolean',
    [FilterOperator.GT]: 'number',
    [FilterOperator.GTE]: 'number',
    [FilterOperator.LT]: 'number',
    [FilterOperator.LTE]: 'number',
    [FilterOperator.IN]: 'array',
    [FilterOperator.NOT_IN]: 'array',
    [FilterOperator.CONTAINS]: 'string',
    [FilterOperator.NOT_CONTAINS]: 'string',
    [FilterOperator.STARTS_WITH]: 'string',
    [FilterOperator.ENDS_WITH]: 'string',
    [FilterOperator.BETWEEN]: 'array[2]',
    [FilterOperator.IS_NULL]: 'null',
    [FilterOperator.IS_NOT_NULL]: 'null',
    [FilterOperator.DATE_EQ]: 'string (ISO date)',
    [FilterOperator.DATE_GT]: 'string (ISO date)',
    [FilterOperator.DATE_GTE]: 'string (ISO date)',
    [FilterOperator.DATE_LT]: 'string (ISO date)',
    [FilterOperator.DATE_LTE]: 'string (ISO date)',
    [FilterOperator.DATE_BETWEEN]: 'array[2] (ISO dates)',
  };
  return valueTypes[operator] || 'any';
}

export default app;

