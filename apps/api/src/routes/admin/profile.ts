import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { users } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// GET /api/admin/v1/profile - Get current authenticated user's profile
app.get(
  '/profile',
  authMiddleware,
  async (c) => {
    const { user } = getAuthContext(c);

    return c.json(successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }
);

// PATCH /api/admin/v1/profile - Update current user's profile
app.patch(
  '/profile',
  authMiddleware,
  async (c) => {
    const { db, user } = getAuthContext(c);

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateProfileSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
    }

    if (updateData.avatarUrl !== undefined) {
      updateFields.avatarUrl = updateData.avatarUrl;
    }

    // Update user profile
    const updated = await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, user.id))
      .returning();

    if (!updated.length) {
      return c.json(Errors.notFound('User not found'), 404);
    }

    return c.json(successResponse({
      id: updated[0].id,
      name: updated[0].name,
      email: updated[0].email,
      avatarUrl: updated[0].avatarUrl,
      isSuperAdmin: updated[0].isSuperAdmin,
      createdAt: updated[0].createdAt,
      updatedAt: updated[0].updatedAt,
    }));
  }
);

export default app;

