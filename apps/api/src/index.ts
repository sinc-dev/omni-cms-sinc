import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { CloudflareBindings, HonoVariables } from './types';

// Import route modules
import adminOrganizations from './routes/admin/organizations';
import adminPosts from './routes/admin/posts';
import adminPostDetail from './routes/admin/post-detail';
import adminMedia from './routes/admin/media';
import adminMediaDetail from './routes/admin/media-detail';
import adminPostTypes from './routes/admin/post-types';
import adminPostTypeDetail from './routes/admin/post-type-detail';
import adminTaxonomies from './routes/admin/taxonomies';
import adminTaxonomyDetail from './routes/admin/taxonomy-detail';
import adminTaxonomyTerms from './routes/admin/taxonomy-terms';
import adminTaxonomyTermDetail from './routes/admin/taxonomy-term-detail';
import adminCustomFields from './routes/admin/custom-fields';
import adminCustomFieldDetail from './routes/admin/custom-field-detail';
import adminApiKeys from './routes/admin/api-keys';
import adminApiKeyDetail from './routes/admin/api-key-detail';
import adminUsers from './routes/admin/users';
import adminUserDetail from './routes/admin/user-detail';
import adminWebhooks from './routes/admin/webhooks';
import adminWebhookDetail from './routes/admin/webhook-detail';
import adminTemplates from './routes/admin/templates';
import adminTemplateDetail from './routes/admin/template-detail';
import adminContentBlocks from './routes/admin/content-blocks';
import adminContentBlockDetail from './routes/admin/content-block-detail';
import adminSearch from './routes/admin/search';
import adminPostVersions from './routes/admin/post-versions';
import adminPostVersionRestore from './routes/admin/post-version-restore';
import adminPostPublish from './routes/admin/post-publish';
import adminPostLock from './routes/admin/post-lock';
import adminPostPresence from './routes/admin/post-presence';
import adminPostWorkflow from './routes/admin/post-workflow';
import adminPostFromTemplate from './routes/admin/post-from-template';
import adminPostsPendingReview from './routes/admin/posts-pending-review';
import adminApiKeyRotate from './routes/admin/api-key-rotate';
import adminWebhookTest from './routes/admin/webhook-test';
import adminWebhookLogs from './routes/admin/webhook-logs';
import adminAnalyticsPosts from './routes/admin/analytics-posts';
import adminAi from './routes/admin/ai';
import adminRoles from './routes/admin/roles';
import adminImport from './routes/admin/import';
import adminExport from './routes/admin/export';
import adminSchema from './routes/admin/schema';
import adminSchemaObjectType from './routes/admin/schema-object-type';
import adminSchemaPostTypes from './routes/admin/schema-post-types';
import adminAnalytics from './routes/admin/analytics';
import adminGraphQL from './routes/admin/graphql';
import adminPostRelationships from './routes/admin/post-relationships';
import adminPostTypeFields from './routes/admin/post-type-fields';
import adminSchemaDatabase from './routes/admin/schema-database';
import adminProfile from './routes/admin/profile';
import publicPosts from './routes/public/posts';
import publicPostDetail from './routes/public/post-detail';
import publicPostShare from './routes/public/post-share';
import publicPostSeo from './routes/public/post-seo';
import publicAnalyticsTrack from './routes/public/analytics-track';
import publicTaxonomies from './routes/public/taxonomies';
import publicTaxonomyTermPosts from './routes/public/taxonomy-term-posts';
import publicSearch from './routes/public/search';
import publicSitemap from './routes/public/sitemap';
import publicMcp from './routes/public/mcp';
// More routes will be added as they're migrated

const app = new Hono<{ Bindings: CloudflareBindings; Variables: HonoVariables }>();

// CORS middleware
app.use('*', cors({
  origin: '*', // Configure appropriately for production
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'omni-cms-api' });
});

// Mount route modules
app.route('/api/admin/v1/organizations', adminOrganizations);
app.route('/api/admin/v1/organizations', adminPosts);
app.route('/api/admin/v1/organizations', adminPostDetail);
app.route('/api/admin/v1/organizations', adminMedia);
app.route('/api/admin/v1/organizations', adminMediaDetail);
app.route('/api/admin/v1/organizations', adminPostTypes);
app.route('/api/admin/v1/organizations', adminPostTypeDetail);
app.route('/api/admin/v1/organizations', adminTaxonomies);
app.route('/api/admin/v1/organizations', adminTaxonomyDetail);
app.route('/api/admin/v1/organizations', adminTaxonomyTerms);
app.route('/api/admin/v1/organizations', adminTaxonomyTermDetail);
app.route('/api/admin/v1/organizations', adminCustomFields);
app.route('/api/admin/v1/organizations', adminCustomFieldDetail);
app.route('/api/admin/v1/organizations', adminApiKeys);
app.route('/api/admin/v1/organizations', adminApiKeyDetail);
app.route('/api/admin/v1/organizations', adminUsers);
app.route('/api/admin/v1/organizations', adminUserDetail);
app.route('/api/admin/v1/organizations', adminWebhooks);
app.route('/api/admin/v1/organizations', adminWebhookDetail);
app.route('/api/admin/v1/organizations', adminTemplates);
app.route('/api/admin/v1/organizations', adminTemplateDetail);
app.route('/api/admin/v1/organizations', adminContentBlocks);
app.route('/api/admin/v1/organizations', adminContentBlockDetail);
app.route('/api/admin/v1/organizations', adminSearch);
app.route('/api/admin/v1/organizations', adminPostVersions);
app.route('/api/admin/v1/organizations', adminPostVersionRestore);
app.route('/api/admin/v1/organizations', adminPostPublish);
app.route('/api/admin/v1/organizations', adminPostLock);
app.route('/api/admin/v1/organizations', adminPostPresence);
app.route('/api/admin/v1/organizations', adminPostWorkflow);
app.route('/api/admin/v1/organizations', adminPostFromTemplate);
app.route('/api/admin/v1/organizations', adminPostsPendingReview);
app.route('/api/admin/v1/organizations', adminApiKeyRotate);
app.route('/api/admin/v1/organizations', adminWebhookTest);
app.route('/api/admin/v1/organizations', adminWebhookLogs);
app.route('/api/admin/v1/organizations', adminAnalyticsPosts);
app.route('/api/admin/v1/organizations', adminAi);
app.route('/api/admin/v1/organizations', adminImport);
app.route('/api/admin/v1/organizations', adminExport);
app.route('/api/admin/v1/organizations', adminSchema);
app.route('/api/admin/v1/organizations', adminSchemaObjectType);
app.route('/api/admin/v1/organizations', adminSchemaPostTypes);
app.route('/api/admin/v1/organizations', adminAnalytics);
app.route('/api/admin/v1/organizations', adminPostRelationships);
app.route('/api/admin/v1/organizations', adminPostTypeFields);
app.route('/api/admin/v1/organizations', adminSchemaDatabase);
app.route('/api/admin/v1', adminGraphQL);
app.route('/api/admin/v1', adminRoles);
app.route('/api/admin/v1', adminProfile);
app.route('/api/public/v1', publicPosts);
app.route('/api/public/v1', publicPostDetail);
app.route('/api/public/v1', publicPostShare);
app.route('/api/public/v1', publicPostSeo);
app.route('/api/public/v1', publicAnalyticsTrack);
app.route('/api/public/v1', publicTaxonomies);
app.route('/api/public/v1', publicTaxonomyTermPosts);
app.route('/api/public/v1', publicSearch);
app.route('/api/public/v1', publicSitemap);
app.route('/api/public/v1', publicMcp);
// More routes will be mounted here as they're migrated

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default app;
