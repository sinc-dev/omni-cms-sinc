# User Manual

## Overview

This manual provides step-by-step instructions for using Omni-CMS to manage content, users, and organizations.

## Getting Started

### First Login

1. Navigate to your Omni-CMS URL
2. You'll be redirected to Cloudflare Access login
3. Log in with your configured identity provider
4. On first login, you'll be auto-provisioned as a user
5. A super admin can assign you to organizations and roles

### Dashboard

The dashboard provides an overview of your content:
- Total posts count
- Total media files
- Total users
- Recent activity

## Organizations

Organizations represent separate websites or brands. Each organization has isolated content.

### Creating an Organization

**Super Admin Only:**

1. Go to Organizations (if available in menu)
2. Click "Create Organization"
3. Fill in:
   - **Name**: Display name
   - **Slug**: URL-friendly identifier (e.g., `my-website`)
   - **Domain**: Custom domain (optional)
   - **Settings**: JSON configuration (optional)
4. Click "Create"

### Switching Organizations

1. Click the organization name in the header
2. Select a different organization from the dropdown
3. All content is scoped to the selected organization

## Content Management

### Post Types

Post types define the structure of your content (e.g., Blog Post, Page, Product).

#### Creating a Post Type

1. Go to **Post Types** in the sidebar
2. Click **New Post Type**
3. Fill in:
   - **Name**: Display name (e.g., "Blog Post")
   - **Slug**: URL-friendly identifier (e.g., `blog-post`)
   - **Description**: Optional description
   - **Icon**: Icon identifier (optional)
   - **Hierarchical**: Check if posts can have parent/child relationships
4. Click **Create**

#### Adding Custom Fields to Post Types

1. First, create custom fields (see Custom Fields section)
2. Go to **Post Types** → Select a post type
3. Click **Add Field**
4. Select a custom field to attach
5. Configure:
   - **Required**: Make field mandatory
   - **Default Value**: Pre-filled value
   - **Order**: Display order
6. Click **Save**

### Posts

Posts are your actual content instances.

#### Creating a Post

1. Go to **Posts** in the sidebar
2. Click **New Post**
3. Select a **Post Type**
4. Fill in required fields:
   - **Title**: Post title
   - **Slug**: URL-friendly identifier (auto-generated from title)
   - **Content**: Rich text editor content
   - **Excerpt**: Short description (optional)
5. Set **Status**:
   - **Draft**: Not published
   - **Published**: Live and visible
   - **Archived**: Hidden from public
6. Add **Taxonomies** (categories, tags)
7. Fill in **Custom Fields** (if configured)
8. Select **Featured Image** (optional)
9. Click **Save** or **Publish**

#### Editing a Post

1. Go to **Posts** → Click on a post title
2. Make changes
3. Click **Save** or **Update**

#### Publishing/Unpublishing

1. Open a post
2. Change status to **Published** or **Draft**
3. Click **Save**

Or use the **Publish** button in the editor toolbar.

#### Deleting a Post

1. Go to **Posts**
2. Click the delete icon (trash) next to a post
3. Confirm deletion

**Warning**: Deletion is permanent and cannot be undone.

### Taxonomies

Taxonomies organize content (e.g., Categories, Tags).

#### Creating a Taxonomy

1. Go to **Taxonomies** in the sidebar
2. Click **New Taxonomy**
3. Fill in:
   - **Name**: Display name (e.g., "Categories")
   - **Slug**: URL-friendly identifier (e.g., `categories`)
   - **Hierarchical**: Check if terms can have parent/child relationships
4. Click **Create**

#### Adding Terms

1. Go to **Taxonomies** → Select a taxonomy
2. Click **Add Term**
3. Fill in:
   - **Name**: Term name (e.g., "Technology")
   - **Slug**: URL-friendly identifier
   - **Parent**: Parent term (if hierarchical)
4. Click **Create**

#### Assigning Terms to Posts

1. Open a post in the editor
2. Scroll to **Taxonomies** section
3. Select terms for each taxonomy
4. Click **Save**

### Media Library

Upload and manage images, videos, and files.

#### Uploading Media

1. Go to **Media** in the sidebar
2. Click **Upload** button
3. Drag and drop files or click to select
4. Wait for upload to complete
5. File appears in media library

**Supported Formats:**
- Images: PNG, JPG, JPEG, GIF, WebP
- Videos: MP4, WebM, OGG
- Documents: PDF, DOC, DOCX

**File Size Limits:**
- Default: 10MB per file
- Can be configured by organization

#### Editing Media Metadata

1. Click on a media item
2. Edit:
   - **Alt Text**: Accessibility description
   - **Caption**: Display caption
3. Click **Save**

#### Deleting Media

1. Click the delete icon (trash) on a media item
2. Confirm deletion

**Warning**: Deleting media will remove it from R2 storage and break any posts using it.

#### Using Media in Posts

1. Open a post editor
2. In **Featured Image** section, click **Select Image**
3. Choose from media library
4. Or upload new media directly

### Custom Fields

Define reusable fields for posts (e.g., Author Bio, Reading Time).

#### Creating a Custom Field

1. Go to **Custom Fields** in the sidebar
2. Click **New Field**
3. Select **Field Type**:
   - **Text**: Single-line text
   - **Textarea**: Multi-line text
   - **Rich Text**: HTML editor
   - **Number**: Numeric value
   - **Boolean**: Checkbox
   - **Date**: Date picker
   - **DateTime**: Date and time picker
   - **Media**: Media picker
   - **Relation**: Link to another post
   - **Select**: Dropdown selection
   - **Multi-Select**: Multiple selections
   - **JSON**: Structured data
4. Fill in:
   - **Name**: Display name
   - **Slug**: Field identifier
   - **Settings**: Field-specific configuration (JSON)
5. Click **Create**

#### Attaching Fields to Post Types

1. Go to **Post Types** → Select a post type
2. Click **Add Field**
3. Select custom field to attach
4. Configure field settings for this post type
5. Click **Save**

## User Management

### Inviting Users

**Org Admin Only:**

1. Go to **Users** in the sidebar
2. Click **Add User**
3. Enter user **Email**
4. Select **Role**:
   - **Org Admin**: Full access to organization
   - **Editor**: Create, edit, publish content
   - **Author**: Create and edit own content
   - **Viewer**: Read-only access
5. Click **Add**

User will be provisioned on first login.

### Managing User Roles

1. Go to **Users**
2. Click on a user
3. Change **Role**
4. Click **Update**

### Removing Users

1. Go to **Users**
2. Click the delete icon (trash) next to a user
3. Confirm removal

User is removed from the organization but remains in the system.

## API Keys

Generate API keys for external applications to access your content.

### Creating an API Key

1. Go to **Settings** → **API Keys** (or via Organization menu)
2. Click **Generate New Key**
3. Fill in:
   - **Name**: Descriptive name (e.g., "Production Website")
   - **Rate Limit**: Requests per hour (default: 10,000)
   - **Expires**: Expiration date (optional)
4. Click **Generate**
5. **Copy the key immediately** - it won't be shown again

### Using API Keys

Include the key in requests:

```bash
curl -H "X-API-Key: omni_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  https://your-cms.com/api/public/your-org/posts
```

### Managing API Keys

- View key details (prefix only, not full key)
- Update rate limits
- Revoke keys by deleting them
- Monitor last used date

## Settings

### Organization Settings

Configure organization-level settings:

1. Go to **Settings** → **Organization**
2. Update:
   - Organization name
   - Slug
   - Domain
   - Custom settings (JSON)
3. Click **Save**

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus search
- `Ctrl/Cmd + S`: Save (in editor)
- `Esc`: Close dialogs/modals

## Best Practices

### Content Organization

- Use consistent post types for similar content
- Create taxonomies before adding content
- Use hierarchical taxonomies for nested categories
- Add descriptive alt text to images

### Workflow

1. **Draft** content first
2. Review and edit
3. Add taxonomies and metadata
4. **Publish** when ready
5. Verify on frontend

### Performance

- Optimize images before uploading
- Use appropriate image sizes
- Keep post content focused
- Use taxonomies for filtering

### Security

- Don't share API keys
- Use appropriate roles for users
- Review user access regularly
- Monitor API key usage

## Troubleshooting

### Can't See Content

- Check you're in the correct organization
- Verify your role has appropriate permissions
- Refresh the page

### Upload Fails

- Check file size limits
- Verify file format is supported
- Check R2 storage configuration
- Try a different file

### Can't Publish

- Verify you have "Editor" or "Org Admin" role
- Check post has required fields filled
- Ensure post type is configured correctly

### API Not Working

- Verify API key is correct
- Check rate limits haven't been exceeded
- Ensure organization slug matches
- Verify endpoint URL is correct

## Support

For technical issues:
1. Check the troubleshooting section
2. Review deployment documentation
3. Contact your system administrator
4. Check application logs

For feature requests:
1. Contact your organization admin
2. Submit via your organization's process

