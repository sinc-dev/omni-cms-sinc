import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { posts, postTemplates, postFieldValues, postTaxonomies } from '@/db/schema';
import { z } from 'zod';

export const runtime = 'edge';

const createFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
});

// POST /api/admin/v1/organizations/:orgId/posts/from-template
// Create a new post from a template
export const POST = withAuth(
  async (request, { db, user, organizationId }) => {
    const validation = await validateRequest(request, createFromTemplateSchema);
    if (!validation.success) return validation.response;

    // Get template
    const template = await db.select().from(postTemplates).where(
      and(
        eq(postTemplates.id, validation.data.templateId),
        eq(postTemplates.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!template) {
      return Errors.notFound('Template');
    }

    // Parse template content
    const templateContent = JSON.parse(template.content);
    const templateCustomFields = template.customFields
      ? JSON.parse(template.customFields)
      : {};

    // Check if slug already exists
    const existing = await db.select().from(posts).where(
      and(
        eq(posts.organizationId, organizationId!),
        eq(posts.postTypeId, template.postTypeId),
        eq(posts.slug, validation.data.slug)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (existing) {
      return Errors.badRequest('Post with this slug already exists for this post type');
    }

    // Create post from template
    const newPost = await db
      .insert(posts)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        postTypeId: template.postTypeId,
        authorId: user.id,
        title: validation.data.title,
        slug: validation.data.slug,
        content: templateContent.content || null,
        excerpt: templateContent.excerpt || null,
        status: 'draft', // Always create as draft
        featuredImageId: templateContent.featuredImageId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const postResult = Array.isArray(newPost) ? newPost[0] : newPost;
    if (!postResult) {
      return Errors.serverError('Failed to create post from template');
    }

    // Insert custom field values from template
    if (Object.keys(templateCustomFields).length > 0) {
      const fieldValues = Object.entries(templateCustomFields).map(([fieldId, value]) => ({
        id: nanoid(),
        postId: postResult.id,
        customFieldId: fieldId,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await db.insert(postFieldValues).values(fieldValues);
    }

    return successResponse(postResult);
  },
  {
    requiredPermission: 'posts:create',
    requireOrgAccess: true,
  }
);

