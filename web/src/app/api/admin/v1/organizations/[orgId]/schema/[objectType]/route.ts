import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { PostStatus } from '@/lib/types/enums';

/**
 * GET /api/admin/v1/organizations/:orgId/schema/:objectType
 * 
 * Returns schema for a specific object type (posts, media, users, taxonomies).
 * Provides properties, enums, validation rules, and relationships.
 */
export const GET = withAuth(
  async (request, { organizationId }, params) => {
    const objectType = params?.objectType;
    
    if (!objectType) {
      return Errors.badRequest('objectType parameter is required');
    }

    try {
      switch (objectType) {
        case 'posts':
          return successResponse(getPostsSchema());
        case 'media':
          return successResponse(getMediaSchema());
        case 'users':
          return successResponse(getUsersSchema());
        case 'taxonomies':
          return successResponse(getTaxonomiesSchema());
        default:
          return Errors.notFound(`Schema for object type '${objectType}' not found`);
      }
    } catch (error) {
      console.error(`Error fetching schema for ${objectType}:`, error);
      return Errors.serverError(`Failed to fetch schema for ${objectType}`);
    }
  },
  {
    requiredPermission: 'schema:read',
    requireOrgAccess: true,
  }
);

/**
 * Schema for Posts object type
 */
function getPostsSchema() {
  return {
    objectType: 'posts',
    properties: [
      {
        name: 'id',
        label: 'ID',
        type: 'string',
        required: true,
        readOnly: true,
        description: 'Unique identifier for the post',
      },
      {
        name: 'title',
        label: 'Title',
        type: 'string',
        required: true,
        validation: { maxLength: 500 },
        description: 'Post title',
      },
      {
        name: 'slug',
        label: 'Slug',
        type: 'string',
        required: true,
        validation: {
          pattern: '^[a-z0-9-]+$',
          maxLength: 500,
        },
        description: 'URL-friendly identifier',
      },
      {
        name: 'content',
        label: 'Content',
        type: 'string',
        required: false,
        description: 'Post content (HTML)',
      },
      {
        name: 'excerpt',
        label: 'Excerpt',
        type: 'string',
        required: false,
        validation: { maxLength: 1000 },
        description: 'Short description or excerpt',
      },
      {
        name: 'status',
        label: 'Status',
        type: 'enum',
        required: true,
        enum: Object.values(PostStatus),
        default: PostStatus.DRAFT,
        options: [
          { value: PostStatus.DRAFT, label: 'Draft' },
          { value: PostStatus.PUBLISHED, label: 'Published' },
          { value: PostStatus.ARCHIVED, label: 'Archived' },
        ],
        description: 'Post publication status',
      },
      {
        name: 'workflowStatus',
        label: 'Workflow Status',
        type: 'enum',
        required: false,
        enum: ['draft', 'pending_review', 'approved', 'rejected'],
        default: 'draft',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'pending_review', label: 'Pending Review' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
        ],
        description: 'Workflow approval status',
      },
      {
        name: 'publishedAt',
        label: 'Published At',
        type: 'datetime',
        required: false,
        description: 'Publication date and time',
      },
      {
        name: 'scheduledPublishAt',
        label: 'Scheduled Publish At',
        type: 'datetime',
        required: false,
        description: 'Scheduled publication date and time',
      },
      {
        name: 'metaTitle',
        label: 'Meta Title',
        type: 'string',
        required: false,
        validation: { maxLength: 60 },
        description: 'SEO meta title',
      },
      {
        name: 'metaDescription',
        label: 'Meta Description',
        type: 'string',
        required: false,
        validation: { maxLength: 160 },
        description: 'SEO meta description',
      },
      {
        name: 'metaKeywords',
        label: 'Meta Keywords',
        type: 'string',
        required: false,
        validation: { maxLength: 255 },
        description: 'SEO meta keywords',
      },
      {
        name: 'canonicalUrl',
        label: 'Canonical URL',
        type: 'string',
        required: false,
        validation: { pattern: '^https?://' },
        description: 'Canonical URL for SEO',
      },
      {
        name: 'viewCount',
        label: 'View Count',
        type: 'number',
        required: false,
        readOnly: true,
        description: 'Number of times the post has been viewed',
      },
      {
        name: 'shareCount',
        label: 'Share Count',
        type: 'number',
        required: false,
        readOnly: true,
        description: 'Number of times the post has been shared',
      },
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Creation date and time',
      },
      {
        name: 'updatedAt',
        label: 'Updated At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Last update date and time',
      },
    ],
    enums: {
      status: {
        values: Object.values(PostStatus),
        description: 'Post publication status values',
      },
      workflowStatus: {
        values: ['draft', 'pending_review', 'approved', 'rejected'],
        description: 'Workflow approval status values',
      },
    },
    relationships: [
      { type: 'belongsTo', target: 'postTypes', field: 'postTypeId' },
      { type: 'belongsTo', target: 'users', field: 'authorId' },
      { type: 'belongsTo', target: 'media', field: 'featuredImageId' },
      { type: 'belongsTo', target: 'media', field: 'ogImageId' },
      { type: 'belongsTo', target: 'posts', field: 'parentId' },
      { type: 'hasMany', target: 'taxonomies', through: 'postTaxonomies' },
      { type: 'hasMany', target: 'customFields', through: 'postFieldValues' },
    ],
  };
}

/**
 * Schema for Media object type
 */
function getMediaSchema() {
  return {
    objectType: 'media',
    properties: [
      {
        name: 'id',
        label: 'ID',
        type: 'string',
        required: true,
        readOnly: true,
        description: 'Unique identifier for the media',
      },
      {
        name: 'filename',
        label: 'Filename',
        type: 'string',
        required: true,
        description: 'Original filename',
      },
      {
        name: 'mimeType',
        label: 'MIME Type',
        type: 'string',
        required: true,
        description: 'MIME type of the file',
      },
      {
        name: 'fileSize',
        label: 'File Size',
        type: 'number',
        required: true,
        description: 'File size in bytes',
      },
      {
        name: 'width',
        label: 'Width',
        type: 'number',
        required: false,
        description: 'Image width in pixels (images only)',
      },
      {
        name: 'height',
        label: 'Height',
        type: 'number',
        required: false,
        description: 'Image height in pixels (images only)',
      },
      {
        name: 'altText',
        label: 'Alt Text',
        type: 'string',
        required: false,
        description: 'Alternative text for accessibility',
      },
      {
        name: 'caption',
        label: 'Caption',
        type: 'string',
        required: false,
        description: 'Media caption',
      },
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Upload date and time',
      },
      {
        name: 'updatedAt',
        label: 'Updated At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Last update date and time',
      },
    ],
    enums: {},
    relationships: [
      { type: 'belongsTo', target: 'users', field: 'uploaderId' },
    ],
  };
}

/**
 * Schema for Users object type
 */
function getUsersSchema() {
  return {
    objectType: 'users',
    properties: [
      {
        name: 'id',
        label: 'ID',
        type: 'string',
        required: true,
        readOnly: true,
        description: 'Unique identifier for the user',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'string',
        required: true,
        validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        description: 'User email address',
      },
      {
        name: 'name',
        label: 'Name',
        type: 'string',
        required: false,
        description: 'User display name',
      },
      {
        name: 'avatarUrl',
        label: 'Avatar URL',
        type: 'string',
        required: false,
        validation: { pattern: '^https?://' },
        description: 'URL to user avatar image',
      },
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Account creation date and time',
      },
      {
        name: 'updatedAt',
        label: 'Updated At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Last update date and time',
      },
    ],
    enums: {},
    relationships: [
      { type: 'hasMany', target: 'organizations', through: 'usersOrganizations' },
      { type: 'hasMany', target: 'posts', field: 'authorId' },
      { type: 'hasMany', target: 'media', field: 'uploaderId' },
    ],
  };
}

/**
 * Schema for Taxonomies object type
 */
function getTaxonomiesSchema() {
  return {
    objectType: 'taxonomies',
    properties: [
      {
        name: 'id',
        label: 'ID',
        type: 'string',
        required: true,
        readOnly: true,
        description: 'Unique identifier for the taxonomy',
      },
      {
        name: 'name',
        label: 'Name',
        type: 'string',
        required: true,
        description: 'Taxonomy name',
      },
      {
        name: 'slug',
        label: 'Slug',
        type: 'string',
        required: true,
        validation: {
          pattern: '^[a-z0-9-]+$',
        },
        description: 'URL-friendly identifier',
      },
      {
        name: 'isHierarchical',
        label: 'Is Hierarchical',
        type: 'boolean',
        required: true,
        default: false,
        description: 'Whether taxonomy supports parent-child relationships',
      },
      {
        name: 'createdAt',
        label: 'Created At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Creation date and time',
      },
      {
        name: 'updatedAt',
        label: 'Updated At',
        type: 'datetime',
        required: true,
        readOnly: true,
        description: 'Last update date and time',
      },
    ],
    enums: {},
    relationships: [
      { type: 'hasMany', target: 'taxonomyTerms', field: 'taxonomyId' },
      { type: 'hasMany', target: 'posts', through: 'postTaxonomies' },
    ],
  };
}

