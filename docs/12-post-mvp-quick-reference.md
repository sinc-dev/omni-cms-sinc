# Post-MVP Features Quick Reference

Quick reference guide for using the newly implemented post-MVP features.

## Auto-Save

**Usage in Components:**
```typescript
import { useAutoSave, useAutoSaveTrigger } from '@/lib/hooks/use-auto-save';
import { AutoSaveIndicator } from '@/components/admin/editor/auto-save-indicator';

const autoSave = useAutoSave({
  onSave: async () => {
    await api.updatePost(postId, { ...data, autoSave: true });
  },
  debounceMs: 2500,
});

useAutoSaveTrigger(autoSave, [title, content, excerpt]);

// In JSX:
<AutoSaveIndicator status={autoSave.status} lastSavedAt={autoSave.lastSavedAt} />
```

## Edit Locking

**Usage:**
```typescript
import { useEditLock } from '@/lib/hooks/use-edit-lock';
import { EditLockIndicator } from '@/components/admin/editor/edit-lock-indicator';

const { lockInfo, acquireLock, releaseLock } = useEditLock({
  postId: postId,
  enabled: true,
});

// In JSX:
<EditLockIndicator postId={postId} />
```

## Scheduled Publishing

**API Usage:**
```typescript
await api.createPost({
  ...postData,
  scheduledPublishAt: '2024-12-25T10:00:00Z', // ISO datetime string
});
```

**Background Worker:**
Configure Cloudflare Workers cron trigger to run `scheduled-publisher.ts` every minute.

## Advanced Search

**API Usage:**
```typescript
const results = await api.searchPosts('search query', {
  post_type: 'postTypeId',
  status: 'published',
  page: '1',
  per_page: '20',
});
```

## Content Versioning

**API Usage:**
```typescript
// List versions
const versions = await api.getPostVersions(postId);

// Get specific version
const version = await api.getPostVersion(postId, versionId);

// Restore version
await api.restorePostVersion(postId, versionId);
```

**Auto-versioning:** Automatically creates versions on every save (non-auto-save).

## SEO Tools

**API Usage:**
```typescript
await api.updatePost(postId, {
  metaTitle: 'SEO Title',
  metaDescription: 'SEO Description',
  metaKeywords: 'keyword1, keyword2',
  ogImageId: 'imageId',
  canonicalUrl: 'https://example.com/post',
  structuredData: { /* JSON-LD object */ },
});
```

**Public SEO Endpoint:**
```
GET /api/public/v1/:orgSlug/posts/:slug/seo
```

## Content Blocks

**API Usage:**
```typescript
// List blocks
const blocks = await api.getContentBlocks();

// Create block
await api.createContentBlock({
  name: 'Hero Block',
  slug: 'hero-block',
  blockType: 'cta',
  content: { /* block data */ },
});

// Attach to post (via post update with blocks array)
```

## Templates

**API Usage:**
```typescript
// List templates
const templates = await api.getTemplates();

// Create template
await api.createTemplate({
  postTypeId: 'typeId',
  name: 'Blog Template',
  slug: 'blog-template',
  content: { /* template data */ },
});

// Create post from template
await api.createPostFromTemplate({
  templateId: 'templateId',
  title: 'New Post',
  slug: 'new-post',
});
```

## Workflow

**API Usage:**
```typescript
// Submit for review
await api.submitForReview(postId, { reviewerId: 'userId' });

// Approve
await api.approvePost(postId, { comment: 'Looks good!' });

// Reject
await api.rejectPost(postId, { comment: 'Needs revision' });

// Get pending reviews
const pending = await api.getPendingReviews();
```

## Collaboration (Presence)

**Usage:**
```typescript
import { PresenceIndicator } from '@/components/admin/editor/presence-indicator';

// In JSX:
<PresenceIndicator postId={postId} />
```

The presence system automatically sends heartbeats and polls for active users.

## Webhooks

**API Usage:**
```typescript
// Create webhook
const webhook = await api.createWebhook({
  name: 'My Webhook',
  url: 'https://example.com/webhook',
  events: ['post.created', 'post.updated'],
  active: true,
});
// Save the returned secret!

// Test webhook
await api.testWebhook(webhookId);

// View logs
const logs = await api.getWebhookLogs(webhookId);
```

**Available Events:**
- `post.created`
- `post.updated`
- `post.published`
- `post.deleted`
- `post.unpublished`
- `media.uploaded`
- `user.created`
- `webhook.test`

## Export/Import

**API Usage:**
```typescript
// Export
const exportData = await api.exportOrganization({
  includePosts: true,
  includeMedia: true,
  includeTaxonomies: true,
  includeCustomFields: true,
});

// Import
const result = await api.importOrganization(importData, {
  skipExisting: false,
  importMedia: false,
  dryRun: false,
});
```

## Analytics

**Public Tracking:**
```typescript
// Track event (from frontend)
fetch(`/api/public/v1/${orgSlug}/analytics/track`, {
  method: 'POST',
  body: JSON.stringify({
    postId: 'postId',
    eventType: 'view',
    timeOnPage: 120, // seconds
  }),
});
```

**Admin Analytics:**
```typescript
// Get overview
const overview = await api.getAnalytics({
  from: '2024-01-01',
  to: '2024-12-31',
});

// Get post analytics
const postAnalytics = await api.getPostAnalytics({
  post_id: 'postId',
});
```

## AI Integration

**API Usage:**
```typescript
// Get suggestions
const suggestions = await api.getAISuggestions({
  content: 'Post content...',
  title: 'Post title',
});

// Optimize content
const optimization = await api.optimizeContent({
  content: 'Post content...',
});

// Generate meta description
const meta = await api.generateMeta({
  content: 'Post content...',
});

// Generate alt text
const altText = await api.generateAltText({
  imageUrl: 'https://example.com/image.jpg',
});

// Translate content
const translated = await api.translateContent({
  content: 'Post content...',
  targetLanguage: 'es',
});
```

**Environment Variable:**
```bash
OPENAI_API_KEY=your_api_key_here
```

## GraphQL API

**Usage:**
```graphql
query {
  posts(organizationId: "orgId", limit: 10) {
    id
    title
    slug
    author {
      name
      email
    }
  }
}
```

**Endpoint:**
```
POST /api/graphql
```

## Component Integration Examples

### Post Editor with All Features

```typescript
import { AutoSaveIndicator } from '@/components/admin/editor/auto-save-indicator';
import { EditLockIndicator } from '@/components/admin/editor/edit-lock-indicator';
import { PresenceIndicator } from '@/components/admin/editor/presence-indicator';
import { SEOPanel } from '@/components/admin/editor/seo-panel';

export default function PostEditor({ postId }) {
  // ... existing code ...
  
  return (
    <div>
      <div className="flex items-center gap-4">
        <AutoSaveIndicator status={autoSave.status} lastSavedAt={autoSave.lastSavedAt} />
        <EditLockIndicator postId={postId} />
        <PresenceIndicator postId={postId} />
      </div>
      
      {/* Post editor fields */}
      
      <SEOPanel
        metaTitle={metaTitle}
        metaDescription={metaDescription}
        // ... other SEO fields
        onMetaTitleChange={setMetaTitle}
        // ... other handlers
      />
    </div>
  );
}
```

## Migration Checklist

Before using these features:

1. ✅ Generate migrations: `pnpm db:generate`
2. ✅ Review migration SQL
3. ✅ Apply migrations: `pnpm db:migrate`
4. ✅ Test migrations on local database
5. ✅ Apply to production: `pnpm db:migrate:prod`
6. ✅ Configure environment variables
7. ✅ Set up Cloudflare Workers cron for scheduled publishing
8. ✅ Install GraphQL packages (if using GraphQL): `pnpm add graphql @graphql-tools/schema`

## Testing

Test each feature:
- Auto-save triggers correctly
- Edit locks prevent concurrent editing
- Scheduled posts publish at correct time
- Search returns relevant results
- Versions are created and can be restored
- SEO fields save and display correctly
- Webhooks fire on events
- Analytics track correctly
- Export/import works without data loss

