import { z } from 'zod';

export const createTaxonomySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  isHierarchical: z.boolean().default(false),
});

export const updateTaxonomySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    .optional(),
  isHierarchical: z.boolean().optional(),
});

export const createTaxonomyTermSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  description: z.string().max(1000).optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export const updateTaxonomyTermSchema = z.object({
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
  parentId: z.string().optional().nullable(),
});

export type CreateTaxonomyInput = z.infer<typeof createTaxonomySchema>;
export type UpdateTaxonomyInput = z.infer<typeof updateTaxonomySchema>;
export type CreateTaxonomyTermInput = z.infer<typeof createTaxonomyTermSchema>;
export type UpdateTaxonomyTermInput = z.infer<typeof updateTaxonomyTermSchema>;
