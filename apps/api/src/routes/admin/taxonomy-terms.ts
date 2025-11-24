import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { createTaxonomyTermSchema } from '../../lib/validations/taxonomy';
import { taxonomyTerms, taxonomies } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms
app.get(
  '/:orgId/taxonomies/:taxonomyId/terms',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const taxonomyId = c.req.param('taxonomyId');

    // Verify taxonomy belongs to organization
    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.id, taxonomyId),
        eq(t.organizationId, organizationId!)
      ),
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    // Fetch all terms for this taxonomy
    const terms = await db.query.taxonomyTerms.findMany({
      where: (tt, { eq }) => eq(tt.taxonomyId, taxonomyId),
      with: {
        parent: true,
        children: true,
      },
    });

    return c.json(successResponse(terms));
  }
);

// POST /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms
app.post(
  '/:orgId/taxonomies/:taxonomyId/terms',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const taxonomyId = c.req.param('taxonomyId');

    // Verify taxonomy belongs to organization
    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.id, taxonomyId),
        eq(t.organizationId, organizationId!)
      ),
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    let termData;
    try {
      const body = await c.req.json();
      termData = createTaxonomyTermSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const { name, slug, description, parentId } = termData;

    // Check if slug already exists in this taxonomy
    const existing = await db.query.taxonomyTerms.findFirst({
      where: (tt, { eq, and: andFn }) => andFn(
        eq(tt.taxonomyId, taxonomyId),
        eq(tt.slug, slug)
      ),
    });

    if (existing) {
      return c.json(Errors.badRequest('Term with this slug already exists in this taxonomy'), 400);
    }

    // If parentId provided, verify it exists in same taxonomy
    if (parentId) {
      const parent = await db.query.taxonomyTerms.findFirst({
        where: (tt, { eq, and: andFn }) => andFn(
          eq(tt.id, parentId),
          eq(tt.taxonomyId, taxonomyId)
        ),
      });
      
      if (!parent) {
        return c.json(Errors.badRequest('Parent term not found in this taxonomy'), 400);
      }
    }

    const newTerm = await db
      .insert(taxonomyTerms)
      .values({
        id: nanoid(),
        taxonomyId,
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const result = Array.isArray(newTerm) ? newTerm[0] : newTerm;
    return c.json(successResponse(result));
  }
);

export default app;

