/**
 * Scheduled Publisher Worker
 * 
 * This worker checks for posts with scheduledPublishAt in the past
 * and publishes them automatically.
 * 
 * Should be run as a Cloudflare Worker cron job (every minute)
 */

import { eq, and, lte, sql } from 'drizzle-orm';
import { posts } from '@/db/schema/posts';
import { organizations } from '@/db/schema/organizations';
import { invalidatePostCache } from '@/lib/cache/invalidation';
import type { DbClient } from '@/db/client';

interface ScheduledPublisherOptions {
  db: DbClient;
}

/**
 * Process scheduled posts that are ready to be published
 */
export async function processScheduledPosts({ db }: ScheduledPublisherOptions) {
  const now = new Date();

  // Find all posts that are scheduled to be published and are still in draft
  const scheduledPosts = await db
    .select()
    .from(posts)
    .where(
      and(
        lte(posts.scheduledPublishAt, now),
        eq(posts.status, 'draft'),
        sql`${posts.scheduledPublishAt} IS NOT NULL`
      )
    );

  const results = [];

  for (const post of scheduledPosts) {
    try {
      // Update post to published
      await db
        .update(posts)
        .set({
          status: 'published',
          publishedAt: now,
          scheduledPublishAt: null, // Clear scheduled time
          updatedAt: now,
        })
        .where(eq(posts.id, post.id));

      // Invalidate cache
      const org = await db.select().from(organizations).where(
        eq(organizations.id, post.organizationId)
      ).limit(1).then(rows => rows[0] || null);

      if (org && post.slug) {
        try {
          await invalidatePostCache(org.slug, post.slug);
        } catch (error) {
          console.error(`Failed to invalidate cache for post ${post.id}:`, error);
        }
      }

      results.push({
        postId: post.id,
        success: true,
      });
    } catch (error) {
      console.error(`Failed to publish scheduled post ${post.id}:`, error);
      results.push({
        postId: post.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    processed: scheduledPosts.length,
    results,
  };
}

/**
 * Cloudflare Worker handler for scheduled publishing
 * 
 * Example wrangler.toml configuration:
 * 
 * [triggers]
 * crons = ["* * * * *"]  # Every minute
 */
export async function scheduledPublisherHandler(
  event: ScheduledEvent,
  env: { DB: D1Database }
) {
  // Initialize database connection
  const { getDb } = await import('@/db/client');
  const db = getDb(env.DB);
  
  try {
    const result = await processScheduledPosts({ db });
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scheduled publisher error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

