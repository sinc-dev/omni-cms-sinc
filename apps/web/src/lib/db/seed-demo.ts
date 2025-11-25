import { nanoid } from 'nanoid';
import { getDb } from '@/db/client';
import { users, organizations, usersOrganizations, postTypes, posts, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed script to populate demo data for local development
 * 
 * Usage:
 * - Local: pnpm db:seed:demo
 * - Or use wrangler d1 execute with generated SQL
 */

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

async function seedDemo() {
  console.log('🌱 Seeding database with demo data...\n');

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
      // 1. Create demo user
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, demoUser.email),
      });

      if (existingUser) {
        console.log(`⏭️  User "${demoUser.email}" already exists, skipping...`);
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
        console.log(`✅ Created demo user: ${demoUser.email}`);
      }

      // 2. Get super_admin role
      const superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.name, 'super_admin'),
      });

      if (!superAdminRole) {
        console.log('⚠️  super_admin role not found. Please run pnpm db:seed first to create roles.');
        return;
      }

      // 3. Create demo organization
      const existingOrg = await db.query.organizations.findFirst({
        where: eq(organizations.slug, demoOrg.slug),
      });

      if (existingOrg) {
        console.log(`⏭️  Organization "${demoOrg.slug}" already exists, skipping...`);
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
        console.log(`✅ Created demo organization: ${demoOrg.name}`);
      }

      // 4. Link user to organization
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
          roleId: superAdminRole.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Linked user to organization with super_admin role`);
      } else {
        console.log(`⏭️  User-organization link already exists, skipping...`);
      }

      // 5. Create a post type
      const existingPostType = await db.query.postTypes.findFirst({
        where: (pt, { and, eq }) => and(
          eq(pt.organizationId, demoOrg.id),
          eq(pt.slug, 'blog-post')
        ),
      });

      let postTypeId: string;
      if (existingPostType) {
        console.log(`⏭️  Post type "blog-post" already exists, skipping...`);
        postTypeId = existingPostType.id;
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
        postTypeId = newPostType[0].id;
        console.log(`✅ Created post type: Blog Post`);
      }

      // 6. Create sample posts
      const existingPosts = await db.query.posts.findMany({
        where: (p, { eq }) => eq(p.organizationId, demoOrg.id),
        limit: 1,
      });

      if (existingPosts.length === 0) {
        const samplePosts = [
          {
            id: nanoid(),
            organizationId: demoOrg.id,
            postTypeId: postTypeId,
            authorId: demoUser.id,
            title: 'Welcome to Omni CMS',
            slug: 'welcome-to-omni-cms',
            content: '<p>This is a sample blog post to help you get started with Omni CMS. You can edit, delete, or create new posts from the admin panel.</p>',
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
            postTypeId: postTypeId,
            authorId: demoUser.id,
            title: 'Getting Started Guide',
            slug: 'getting-started-guide',
            content: '<p>Learn how to create and manage content in Omni CMS. This guide covers the basics of content creation, organization, and publishing.</p>',
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
            postTypeId: postTypeId,
            authorId: demoUser.id,
            title: 'Draft Post Example',
            slug: 'draft-post-example',
            content: '<p>This is a draft post that has not been published yet. You can see how drafts appear in the admin panel.</p>',
            excerpt: 'An example of a draft post',
            status: 'draft',
            workflowStatus: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        for (const post of samplePosts) {
          await db.insert(posts).values(post);
        }
        console.log(`✅ Created ${samplePosts.length} sample posts`);
      } else {
        console.log(`⏭️  Posts already exist, skipping...`);
      }

      console.log('\n✅ Demo data seeding completed successfully!');
      console.log('\n📋 Demo credentials:');
      console.log(`   Email: ${demoUser.email}`);
      console.log(`   Organization: ${demoOrg.name} (${demoOrg.slug})`);
      console.log(`   Role: super_admin`);
      console.log('\n💡 To use local auth bypass, add to apps/api/.dev.vars:');
      console.log('   ENABLE_LOCAL_AUTH_BYPASS=true');
    } else {
      // Generate SQL for manual execution
      console.log('\n📝 SQL statements to insert demo data:\n');
      
      const timestamp = Date.now();
      const superAdminRoleId = 'REPLACE_WITH_SUPER_ADMIN_ROLE_ID';
      
      console.log(`-- Demo User`);
      console.log(`INSERT OR IGNORE INTO users (id, email, name, is_super_admin, created_at, updated_at) VALUES ('${demoUser.id}', '${demoUser.email}', '${demoUser.name}', 1, ${timestamp}, ${timestamp});`);
      
      console.log(`\n-- Demo Organization`);
      console.log(`INSERT OR IGNORE INTO organizations (id, name, slug, domain, settings, created_at, updated_at) VALUES ('${demoOrg.id}', '${demoOrg.name}', '${demoOrg.slug}', '${demoOrg.domain}', '${demoOrg.settings}', ${timestamp}, ${timestamp});`);
      
      console.log(`\n-- User-Organization Link (replace role_id with actual super_admin role ID)`);
      console.log(`INSERT OR IGNORE INTO users_organizations (id, user_id, organization_id, role_id, created_at, updated_at) VALUES ('${nanoid()}', '${demoUser.id}', '${demoOrg.id}', '${superAdminRoleId}', ${timestamp}, ${timestamp});`);
      
      console.log('\n✅ Demo data SQL generated successfully!');
      console.log('\n💡 To apply these changes:');
      console.log('   1. First run: pnpm db:seed (to create roles)');
      console.log('   2. Get the super_admin role ID from the roles table');
      console.log('   3. Replace REPLACE_WITH_SUPER_ADMIN_ROLE_ID in the SQL above');
      console.log('   4. Run: wrangler d1 execute omni-cms --local --command="<paste SQL above>"');
    }
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

seedDemo();

