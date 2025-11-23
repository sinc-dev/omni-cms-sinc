import { nanoid } from 'nanoid';
import { getDb } from '@/db/client';
import { roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed script to populate default roles with their permissions
 * 
 * Usage:
 * - Local: wrangler d1 execute omni-cms --local --file=./seed.sql
 * - Production: wrangler d1 execute omni-cms --file=./seed.sql
 * 
 * Or run with miniflare for local development:
 * - pnpm db:seed (uses miniflare if available)
 */

const defaultRoles = [
  {
    id: nanoid(),
    name: 'super_admin',
    description: 'Full system access across all organizations',
    permissions: JSON.stringify([
      'organizations:*',
      'posts:*',
      'users:*',
      'media:*',
      'settings:*',
      'taxonomies:*',
      'post-types:*',
      'custom-fields:*',
    ]),
  },
  {
    id: nanoid(),
    name: 'org_admin',
    description: 'Full access within assigned organization(s)',
    permissions: JSON.stringify([
      'organizations:read',
      'organizations:update',
      'posts:*',
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'media:*',
      'settings:read',
      'settings:update',
      'taxonomies:*',
      'post-types:*',
      'custom-fields:*',
    ]),
  },
  {
    id: nanoid(),
    name: 'editor',
    description: 'Create, edit, and publish content',
    permissions: JSON.stringify([
      'posts:create',
      'posts:read',
      'posts:update',
      'posts:publish',
      'posts:delete',
      'media:upload',
      'media:read',
      'media:delete',
      'taxonomies:read',
      'taxonomies:create',
      'taxonomies:update',
    ]),
  },
  {
    id: nanoid(),
    name: 'author',
    description: 'Create and edit own content',
    permissions: JSON.stringify([
      'posts:create',
      'posts:read',
      'posts:update',
      'media:upload',
      'media:read',
      'taxonomies:read',
    ]),
  },
  {
    id: nanoid(),
    name: 'viewer',
    description: 'Read-only access to content',
    permissions: JSON.stringify(['posts:read', 'media:read', 'taxonomies:read']),
  },
];

async function seed() {
  console.log('🌱 Seeding database with default roles...');

  try {
    // Try to use miniflare for local development
    let db: ReturnType<typeof getDb> | null = null;
    
    try {
      const { Miniflare } = await import('miniflare');
      const mf = new Miniflare({
        script: '',
        d1Databases: ['DB'],
        d1Persist: '.wrangler/state/v3/d1',
      });
      
      const d1 = await mf.getD1Database('DB');
      db = getDb(d1);
      console.log('✅ Using miniflare for local database access');
    } catch (miniflareError) {
      console.log('⚠️  Miniflare not available, generating SQL statements instead');
      console.log('💡 Install miniflare or use wrangler d1 execute for production\n');
    }

    if (db) {
      // Use Drizzle to insert roles
      for (const role of defaultRoles) {
        // Check if role already exists
        const existing = await db.query.roles.findFirst({
          where: eq(roles.name, role.name),
        });

        if (existing) {
          console.log(`⏭️  Role "${role.name}" already exists, skipping...`);
          continue;
        }

        await db.insert(roles).values({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          createdAt: new Date(),
        });

        console.log(`✅ Inserted role: ${role.name}`);
      }

      console.log('\n✅ Seed completed successfully!');
    } else {
      // Generate SQL for manual execution
      console.log('\n📝 SQL statements to insert default roles:\n');
      
      const timestamp = Date.now();
      defaultRoles.forEach((role) => {
        const sql = `INSERT OR IGNORE INTO roles (id, name, description, permissions, created_at) VALUES ('${role.id}', '${role.name}', '${role.description}', '${role.permissions}', ${timestamp});`;
        console.log(sql);
      });

      console.log('\n✅ Seed data generated successfully!');
      console.log('\n💡 To apply these changes:');
      console.log('   Local: wrangler d1 execute omni-cms --local --command="<paste SQL above>"');
      console.log('   Production: wrangler d1 execute omni-cms --command="<paste SQL above>"');
      console.log('   Or use Drizzle Studio to insert the data manually.');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
