import { z } from 'zod';
import { optionalJsonStringSchema, urlSchema } from '@/lib/utils/validation';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  domain: urlSchema,
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    .optional(),
  domain: urlSchema,
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
});

// Schema for settings form (with JSON string)
export const organizationSettingsFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  domain: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        try {
          new URL(val.startsWith('http') ? val : `https://${val}`);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Please enter a valid domain or URL',
      }
    ),
  settings: z
    .string()
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Invalid JSON format. Please check your JSON syntax.',
      }
    ),
});

// Schema for organization create/edit form dialogs (with JSON string)
export const organizationFormDialogSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  domain: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        try {
          new URL(val.startsWith('http') ? val : `https://${val}`);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Please enter a valid domain or URL',
      }
    ),
  settings: z
    .string()
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Invalid JSON format. Please check your JSON syntax.',
      }
    ),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type OrganizationSettingsFormInput = z.infer<typeof organizationSettingsFormSchema>;
export type OrganizationFormDialogInput = z.infer<typeof organizationFormDialogSchema>;
