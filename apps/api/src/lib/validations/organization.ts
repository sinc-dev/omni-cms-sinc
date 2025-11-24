import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  domain: z.string().url('Invalid domain').optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    .optional(),
  domain: z.string().url().optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
