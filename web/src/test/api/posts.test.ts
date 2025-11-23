import { describe, it, expect, beforeEach } from 'vitest';
import { testDb } from '../setup';
import { createTestSetup } from '../helpers/auth';
import { createMockAuthRequest } from '../helpers/mock-auth';
import { nanoid } from 'nanoid';
import { posts, postTypes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { POST, GET } from '@/app/api/admin/v1/organizations/[orgId]/posts/route';
import { PATCH as PATCH_POST, DELETE as DELETE_POST } from '@/app/api/admin/v1/organizations/[orgId]/posts/[postId]/route';

describe('Posts API', () => {
  let userId: string;
  let orgId: string;
  let postTypeId: string;
  let postId: string;

  beforeEach(async () => {
    // Create test setup
    const setup = await createTestSetup(testDb);
    userId = setup.userId;
    orgId = setup.orgId;

    // Create a post type
    postTypeId = nanoid();
    await testDb.insert(postTypes).values({
      id: postTypeId,
      organizationId: orgId,
      name: 'Test Post Type',
      slug: 'test-post-type',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/posts', () => {
    it('should create a new post', async () => {
      const user = await testDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      
      if (!user) throw new Error('User not found');

      const request = createMockAuthRequest(
        `/api/admin/v1/organizations/${orgId}/posts`,
        testDb,
        user,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postTypeId,
            title: 'Test Post',
            slug: 'test-post',
            content: 'Test content',
            status: 'draft',
          }),
        }
      );
      
      const response = await POST(request, { params: { orgId } });
      const data = await response.json() as { success: boolean; data: { id: string; title: string; slug: string } };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Test Post');
      expect(data.data.slug).toBe('test-post');
      
      postId = data.data.id;
    });

    it('should reject duplicate slugs for same post type', async () => {
      // Create first post
      await testDb.insert(posts).values({
        id: nanoid(),
        organizationId: orgId,
        postTypeId,
        authorId: userId,
        title: 'First Post',
        slug: 'duplicate-slug',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = await testDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      
      if (!user) throw new Error('User not found');

      const request = createMockAuthRequest(
        `/api/admin/v1/organizations/${orgId}/posts`,
        testDb,
        user,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postTypeId,
            title: 'Second Post',
            slug: 'duplicate-slug',
            status: 'draft',
          }),
        }
      );
      
      const response = await POST(request, { params: { orgId } });
      const data = await response.json() as { success: boolean };

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/admin/v1/organizations/:orgId/posts', () => {
    beforeEach(async () => {
      // Create test posts
      for (let i = 0; i < 5; i++) {
        await testDb.insert(posts).values({
          id: nanoid(),
          organizationId: orgId,
          postTypeId,
          authorId: userId,
          title: `Post ${i + 1}`,
          slug: `post-${i + 1}`,
          status: i % 2 === 0 ? 'published' : 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });

    it('should list all posts', async () => {
      const user = await testDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      
      if (!user) throw new Error('User not found');

      const request = createMockAuthRequest(
        `/api/admin/v1/organizations/${orgId}/posts`,
        testDb,
        user
      );
      
      const response = await GET(request, { params: { orgId } });
      const data = await response.json() as { success: boolean; data: Array<{ status: string }> };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const user = await testDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      
      if (!user) throw new Error('User not found');

      const request = createMockAuthRequest(
        `/api/admin/v1/organizations/${orgId}/posts?status=published`,
        testDb,
        user
      );
      
      const response = await GET(request, { params: { orgId } });
      const data = await response.json() as { success: boolean; data: Array<{ status: string }> };

      expect(response.status).toBe(200);
      expect(data.data.every((p) => p.status === 'published')).toBe(true);
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/posts/:postId', () => {
    beforeEach(async () => {
      // Create a test post
      postId = nanoid();
      await testDb.insert(posts).values({
        id: postId,
        organizationId: orgId,
        postTypeId,
        authorId: userId,
        title: 'Original Title',
        slug: 'original-slug',
        content: 'Original content',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should update a post', async () => {
      const user = await testDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      
      if (!user) throw new Error('User not found');

      const request = createMockAuthRequest(
        `/api/admin/v1/organizations/${orgId}/posts/${postId}`,
        testDb,
        user,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Updated Title',
            content: 'Updated content',
          }),
        }
      );
      
      const response = await PATCH_POST(request, { params: { orgId, postId } });
      const data = await response.json() as { success: boolean; data: { title: string; content: string } };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe('Updated Title');
      expect(data.data.content).toBe('Updated content');
    });

    it('should handle auto-save correctly', async () => {
      // First, publish the post
      await testDb.update(posts)
        .set({ status: 'published' })
        .where(eq(posts.id, postId));

      const user = await testDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      
      if (!user) throw new Error('User not found');

      const request = createMockAuthRequest(
        `/api/admin/v1/organizations/${orgId}/posts/${postId}`,
        testDb,
        user,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Auto-saved Title',
            autoSave: true,
          }),
        }
      );
      
      const response = await PATCH_POST(request, { params: { orgId, postId } });
      const data = await response.json() as { success: boolean; data: { status: string } };

      expect(response.status).toBe(200);
      // Status should remain published on auto-save
      expect(data.data.status).toBe('published');
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId/posts/:postId', () => {
    beforeEach(async () => {
      postId = nanoid();
      await testDb.insert(posts).values({
        id: postId,
        organizationId: orgId,
        postTypeId,
        authorId: userId,
        title: 'Post to Delete',
        slug: 'post-to-delete',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should delete a post', async () => {
      const user = await testDb.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });
      
      if (!user) throw new Error('User not found');

      const request = createMockAuthRequest(
        `/api/admin/v1/organizations/${orgId}/posts/${postId}`,
        testDb,
        user,
        { method: 'DELETE' }
      );
      
      const response = await DELETE_POST(request, { params: { orgId, postId } });
      const data = await response.json() as { success: boolean; data: { deleted: boolean } };

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);

      // Verify post is deleted
      const deletedPost = await testDb.select().from(posts).where(eq(posts.id, postId)).limit(1);
      expect(deletedPost.length).toBe(0);
    });
  });
});
