import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, postTemplates, postFieldValues } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const createFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
});

// POST /api/admin/v1/organizations/:orgId/posts/from-template
// Create a new post from a template
app.post(
  '/:orgId/posts/from-template',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:create'),
  async (c) => {
    const { db, user, organizationId } = getAuthContext(c);
    
    const body = await c.req.json().catch(() => ({}));
    const validation = createFromTemplateSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(Errors.validationError(validation.error.issues), 400);
    }

    // Get template
    const template = await db.query.postTemplates.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, validation.data.templateId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!template) {
      return c.json(Errors.notFound('Template'), 404);
    }

    // Parse template content
    const templateContent = template.content ? JSON.parse(template.content) : {};
    const templateCustomFields = template.customFields
      ? JSON.parse(template.customFields)
      : {};

    // Check if slug already exists
    const existing = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, organizationId!),
        eq(p.postTypeId, template.postTypeId),
        eq(p.slug, validation.data.slug)
      ),
    });

    if (existing) {
      return c.json(Errors.badRequest('Post with this slug already exists for this post type'), 400);
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
      return c.json(Errors.serverError('Failed to create post from template'), 500);
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

    return c.json(successResponse(postResult));
  }
);

export default app;

