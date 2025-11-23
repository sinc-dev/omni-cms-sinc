import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { postTypes, customFields, taxonomies, taxonomyTerms } from '@/db/schema';
import {
export const runtime = 'edge';

  PostStatus,
  CustomFieldType,
  FilterOperator,
  FilterGroupOperator,
  SortDirection,
  EntityType,
} from '@/lib/types/enums';

/**
 * GET /api/admin/v1/organizations/:orgId/schema
 * 
 * Returns comprehensive schema/metadata for the organization's content structure.
 * Similar to HubSpot's schema endpoint for API discovery.
 */
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    try {
      // Fetch all post types
      const allPostTypes = await db.query.postTypes.findMany({
        where: eq(postTypes.organizationId, organizationId!),
      });

      // Fetch all custom fields
      const allCustomFields = await db.query.customFields.findMany({
        where: eq(customFields.organizationId, organizationId!),
      });

      // Fetch all taxonomies with their terms
      const allTaxonomies = await db.query.taxonomies.findMany({
        where: eq(taxonomies.organizationId, organizationId!),
        with: {
          terms: true,
        },
      });

      // Build post types with their associated custom fields
      // Note: In the current schema, custom fields are organization-wide,
      // not directly linked to post types. This could be enhanced with a junction table.
      const postTypesWithFields = allPostTypes.map((postType) => ({
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
        // All custom fields are available to all post types in current schema
        availableFields: allCustomFields.map((field) => ({
          id: field.id,
          name: field.name,
          slug: field.slug,
          fieldType: field.fieldType,
          settings: (() => {
            try {
              return field.settings ? JSON.parse(field.settings) : null;
            } catch (error) {
              console.error(`Failed to parse settings for custom field ${field.id}:`, error);
              return null;
            }
          })(),
        })),
      }));

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
      };

      return successResponse(schema);
    } catch (error) {
      console.error('Error fetching schema:', error);
      return Errors.serverError('Failed to fetch schema');
    }
  },
  {
    requiredPermission: 'post-types:read',
    requireOrgAccess: true,
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

