import { z } from 'zod';

export const createPostTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  isHierarchical: z.boolean().default(false),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updatePostTypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  isHierarchical: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

// Schema for post type edit form (with required fields for validation)
export const editPostTypeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  isHierarchical: z.boolean().default(false),
});

export const createCustomFieldSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9_]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and underscores',
    }),
  fieldType: z.enum([
    'text',
    'textarea',
    'rich_text',
    'number',
    'boolean',
    'date',
    'datetime',
    'media',
    'relation',
    'select',
    'multi_select',
    'json',
  ]),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateCustomFieldSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((val) => /^[a-z0-9_]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and underscores',
    })
    .optional(),
  fieldType: z
    .enum([
      'text',
      'textarea',
      'rich_text',
      'number',
      'boolean',
      'date',
      'datetime',
      'media',
      'relation',
      'select',
      'multi_select',
      'json',
    ])
    .optional(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreatePostTypeInput = z.infer<typeof createPostTypeSchema>;
export type UpdatePostTypeInput = z.infer<typeof updatePostTypeSchema>;
export type EditPostTypeFormInput = z.infer<typeof editPostTypeFormSchema>;
export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;
