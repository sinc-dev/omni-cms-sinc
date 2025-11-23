import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { postTypes, customFields } from '@/db/schema';

/**
 * GET /api/admin/v1/organizations/:orgId/schema/post-types
 * 
 * Returns schemas for all post types in the organization.
 * Each post type includes its available custom fields.
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

      // Build schemas for each post type
      const postTypeSchemas = allPostTypes.map((postType) => ({
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
        schemaUrl: `/api/admin/v1/organizations/${organizationId}/schema/post-types/${postType.id}`,
      }));

      return successResponse({
        postTypes: postTypeSchemas,
        count: postTypeSchemas.length,
      });
    } catch (error) {
      console.error('Error fetching post types schema:', error);
      return Errors.serverError('Failed to fetch post types schema');
    }
  },
  {
    requiredPermission: 'post-types:read',
    requireOrgAccess: true,
  }
);

