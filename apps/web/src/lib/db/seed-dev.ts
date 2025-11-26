import { nanoid } from 'nanoid';
import { getDb } from '@/db/client';
import {
  users,
  organizations,
  usersOrganizations,
  postTypes,
  posts,
  roles,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Combined seed script for local development
 * 
 * Seeds all necessary data for local development:
 * - Default roles (super_admin, org_admin, editor, author, viewer)
 * - Demo user (demo@example.com) with super_admin privileges
 * - Demo organization
 * - User-organization link
 * - Post types (blog-post, page)
 * - Sample posts (published and draft)
 * 
 * Usage:
 * - Local: pnpm db:seed:dev
 * 
 * This script is idempotent - it can be run multiple times safely.
 * Existing data will be skipped.
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

const demoUser = {
  id: nanoid(),
  email: 'demo@example.com',
  name: 'Demo User',
  isSuperAdmin: true,
};

const demoOrg = {
  id: nanoid(),
  name: 'Demo Organization',
  slug: 'demo-org',
  domain: 'demo.example.com',
  settings: JSON.stringify({ theme: 'default' }),
};

async function seedDev() {
  console.log('🌱 Seeding local development database...\n');

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
      console.log('✅ Using miniflare for local database access\n');
    } catch (miniflareError) {
      console.log('⚠️  Miniflare not available, generating SQL statements instead');
      console.log('💡 Install miniflare or use wrangler d1 execute for production\n');
    }

    if (db) {
      // Step 1: Seed roles
      console.log('📋 Step 1: Seeding default roles...');
      const roleMap: Record<string, string> = {};

      for (const role of defaultRoles) {
        const existing = await db.query.roles.findFirst({
          where: eq(roles.name, role.name),
        });

        if (existing) {
          console.log(`   ⏭️  Role "${role.name}" already exists, skipping...`);
          roleMap[role.name] = existing.id;
        } else {
          await db.insert(roles).values({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            createdAt: new Date(),
          });
          roleMap[role.name] = role.id;
          console.log(`   ✅ Created role: ${role.name}`);
        }
      }

      // Step 2: Create demo user
      console.log('\n📋 Step 2: Creating demo user...');
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, demoUser.email),
      });

      if (existingUser) {
        console.log(`   ⏭️  User "${demoUser.email}" already exists, skipping...`);
        demoUser.id = existingUser.id;
      } else {
        await db.insert(users).values({
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          isSuperAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`   ✅ Created demo user: ${demoUser.email}`);
      }

      // Step 3: Create demo organization
      console.log('\n📋 Step 3: Creating demo organization...');
      const existingOrg = await db.query.organizations.findFirst({
        where: eq(organizations.slug, demoOrg.slug),
      });

      if (existingOrg) {
        console.log(`   ⏭️  Organization "${demoOrg.slug}" already exists, skipping...`);
        demoOrg.id = existingOrg.id;
      } else {
        await db.insert(organizations).values({
          id: demoOrg.id,
          name: demoOrg.name,
          slug: demoOrg.slug,
          domain: demoOrg.domain,
          settings: demoOrg.settings,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`   ✅ Created demo organization: ${demoOrg.name}`);
      }

      // Step 4: Link user to organization
      console.log('\n📋 Step 4: Linking user to organization...');
      const existingUserOrg = await db.query.usersOrganizations.findFirst({
        where: (uo, { and, eq }) => and(
          eq(uo.userId, demoUser.id),
          eq(uo.organizationId, demoOrg.id)
        ),
      });

      if (!existingUserOrg) {
        await db.insert(usersOrganizations).values({
          id: nanoid(),
          userId: demoUser.id,
          organizationId: demoOrg.id,
          roleId: roleMap['super_admin'],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`   ✅ Linked user to organization with super_admin role`);
      } else {
        console.log(`   ⏭️  User-organization link already exists, skipping...`);
      }

      // Step 5: Create post types
      console.log('\n📋 Step 5: Creating post types...');
      const postTypeMap: Record<string, string> = {};

      // Blog Post type
      const existingBlogPostType = await db.query.postTypes.findFirst({
        where: (pt, { and, eq }) => and(
          eq(pt.organizationId, demoOrg.id),
          eq(pt.slug, 'blog-post')
        ),
      });

      if (existingBlogPostType) {
        console.log(`   ⏭️  Post type "blog-post" already exists, skipping...`);
        postTypeMap['blog-post'] = existingBlogPostType.id;
      } else {
        const newPostType = await db.insert(postTypes).values({
          id: nanoid(),
          organizationId: demoOrg.id,
          name: 'Blog Post',
          slug: 'blog-post',
          description: 'Standard blog post content type',
          isHierarchical: false,
          settings: JSON.stringify({ supportsFeaturedImage: true }),
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        postTypeMap['blog-post'] = newPostType[0].id;
        console.log(`   ✅ Created post type: Blog Post`);
      }

      // Page type
      const existingPageType = await db.query.postTypes.findFirst({
        where: (pt, { and, eq }) => and(
          eq(pt.organizationId, demoOrg.id),
          eq(pt.slug, 'page')
        ),
      });

      if (existingPageType) {
        console.log(`   ⏭️  Post type "page" already exists, skipping...`);
        postTypeMap['page'] = existingPageType.id;
      } else {
        const newPageType = await db.insert(postTypes).values({
          id: nanoid(),
          organizationId: demoOrg.id,
          name: 'Page',
          slug: 'page',
          description: 'Static page content type',
          isHierarchical: true,
          settings: JSON.stringify({ supportsFeaturedImage: false }),
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        postTypeMap['page'] = newPageType[0].id;
        console.log(`   ✅ Created post type: Page`);
      }

      // Step 6: Create sample posts
      console.log('\n📋 Step 6: Creating sample posts...');
      const existingPosts = await db.query.posts.findMany({
        where: eq(posts.organizationId, demoOrg.id),
        limit: 1,
      });

      if (existingPosts.length === 0) {
        const samplePosts = [
          {
            id: nanoid(),
            organizationId: demoOrg.id,
            postTypeId: postTypeMap['blog-post'],
            authorId: demoUser.id,
            title: 'Welcome to Omni CMS',
            slug: 'welcome-to-omni-cms',
            content:
              '<p>This is a sample blog post to help you get started with Omni CMS. You can edit, delete, or create new posts from the admin panel.</p>',
            excerpt: 'A sample post to help you get started',
            status: 'published',
            workflowStatus: 'approved',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: nanoid(),
            organizationId: demoOrg.id,
            postTypeId: postTypeMap['blog-post'],
            authorId: demoUser.id,
            title: 'Getting Started Guide',
            slug: 'getting-started-guide',
            content:
              '<p>Learn how to create and manage content in Omni CMS. This guide covers the basics of content creation, organization, and publishing.</p>',
            excerpt: 'Learn the basics of content management',
            status: 'published',
            workflowStatus: 'approved',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: nanoid(),
            organizationId: demoOrg.id,
            postTypeId: postTypeMap['blog-post'],
            authorId: demoUser.id,
            title: 'Draft Post Example',
            slug: 'draft-post-example',
            content:
              '<p>This is a draft post that has not been published yet. You can see how drafts appear in the admin panel.</p>',
            excerpt: 'An example of a draft post',
            status: 'draft',
            workflowStatus: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: nanoid(),
            organizationId: demoOrg.id,
            postTypeId: postTypeMap['page'],
            authorId: demoUser.id,
            title: 'About Us',
            slug: 'about-us',
            content:
              '<p>This is a sample page. Pages are typically used for static content like About, Contact, or Terms of Service.</p>',
            excerpt: 'Learn more about our organization',
            status: 'published',
            workflowStatus: 'approved',
            publishedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        for (const post of samplePosts) {
          await db.insert(posts).values(post);
        }
        console.log(`   ✅ Created ${samplePosts.length} sample posts`);
      } else {
        console.log(`   ⏭️  Posts already exist, skipping...`);
      }

      console.log('\n✅ Local development database seeded successfully!');
      console.log('\n📋 Dev User Credentials:');
      console.log(`   Email: ${demoUser.email}`);
      console.log(`   Name: ${demoUser.name}`);
      console.log(`   Super Admin: Yes`);
      console.log(`   Organization: ${demoOrg.name} (${demoOrg.slug})`);
      console.log(`   Role: super_admin`);
      console.log('\n💡 To use local auth bypass, add to apps/api/.dev.vars:');
      console.log('   ENABLE_LOCAL_AUTH_BYPASS=true');
      console.log('\n💡 Then you can access the app without Cloudflare Access authentication.');
    } else {
      // Generate SQL for manual execution
      console.log('\n📝 SQL statements to insert seed data:\n');

      const timestamp = Date.now();
      // In SQL-only mode we don't know the actual super_admin role ID yet,
      // so we use a placeholder for manual replacement.
      const superAdminRoleId = 'system-user-api';

      console.log('-- Default Roles');
      defaultRoles.forEach((role) => {
        const sql = `INSERT OR IGNORE INTO roles (id, name, description, permissions, created_at) VALUES ('${role.id}', '${role.name}', '${role.description}', '${role.permissions}', ${timestamp});`;
        console.log(sql);
      });

      console.log('\n-- Demo User');
      console.log(
        `INSERT OR IGNORE INTO users (id, email, name, is_super_admin, created_at, updated_at) VALUES ('${demoUser.id}', '${demoUser.email}', '${demoUser.name}', 1, ${timestamp}, ${timestamp});`
      );

      console.log('\n-- Demo Organization');
      console.log(
        `INSERT OR IGNORE INTO organizations (id, name, slug, domain, settings, created_at, updated_at) VALUES ('${demoOrg.id}', '${demoOrg.name}', '${demoOrg.slug}', '${demoOrg.domain}', '${demoOrg.settings}', ${timestamp}, ${timestamp});`
      );

      console.log('\n-- User-Organization Link');
      console.log(
        `INSERT OR IGNORE INTO users_organizations (id, user_id, organization_id, role_id, created_at, updated_at) VALUES ('${nanoid()}', '${demoUser.id}', '${demoOrg.id}', '${superAdminRoleId}', ${timestamp}, ${timestamp});`
      );

      console.log('\n✅ Seed data SQL generated successfully!');
      console.log('\n💡 To apply these changes:');
      console.log('   1. Run: wrangler d1 execute omni-cms --local --command="<paste SQL above>"');
      console.log('   2. Or use Drizzle Studio to insert the data manually.');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDev();

