import { z } from 'zod';

export const createPostSchema = z.object({
  postTypeId: z.string().min(1, 'Post type is required'),
  title: z.string().min(1, 'Title is required').max(500),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(500)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  content: z.string().optional().nullable(),
  excerpt: z.string().max(1000).optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  parentId: z.string().optional().nullable(),
  featuredImageId: z.string().optional().nullable(),
  scheduledPublishAt: z.string().datetime().optional().nullable(), // ISO datetime string
  // SEO fields
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  metaKeywords: z.string().max(255).optional().nullable(),
  ogImageId: z.string().optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  structuredData: z.record(z.string(), z.unknown()).optional().nullable(), // JSON object
  customFields: z.record(z.string(), z.unknown()).optional(),
  taxonomies: z.record(z.string(), z.array(z.string())).optional(),
  relationships: z.record(z.string(), z.array(z.string())).optional(),
  autoSave: z.boolean().optional().default(false), // Flag to indicate auto-save
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z
    .string()
    .min(1)
    .max(500)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    .optional(),
  content: z.string().optional().nullable(),
  excerpt: z.string().max(1000).optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  parentId: z.string().optional().nullable(),
  featuredImageId: z.string().optional().nullable(),
  scheduledPublishAt: z.string().datetime().optional().nullable(), // ISO datetime string
  // SEO fields
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  metaKeywords: z.string().max(255).optional().nullable(),
  ogImageId: z.string().optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  structuredData: z.record(z.string(), z.unknown()).optional().nullable(), // JSON object
  customFields: z.record(z.string(), z.unknown()).optional(),
  taxonomies: z.record(z.string(), z.array(z.string())).optional(),
  relationships: z.record(z.string(), z.array(z.string())).optional(),
  autoSave: z.boolean().optional().default(false), // Flag to indicate auto-save
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
