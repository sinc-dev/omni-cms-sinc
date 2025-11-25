import { z, ZodError } from 'zod';

/**
 * Common validation rules and helpers
 */

/**
 * Email validation
 */
export const emailSchema = z.string().email('Please enter a valid email address');

/**
 * URL validation
 */
export const urlSchema = z.string().url('Please enter a valid URL').optional().nullable();

/**
 * Slug validation - lowercase letters, numbers, and hyphens only
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(255, 'Slug must be less than 255 characters')
  .refine(
    (val) => /^[a-z0-9-]+$/.test(val),
    {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }
  );

/**
 * JSON string validation
 */
export const jsonStringSchema = z.string().refine(
  (val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: 'Invalid JSON format',
  }
);

/**
 * Optional JSON string validation
 */
export const optionalJsonStringSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid JSON format',
    }
  );

/**
 * File validation schemas
 */
export const fileSchema = z.instanceof(File);

export const jsonFileSchema = fileSchema.refine(
  (file) => file.name.endsWith('.json'),
  {
    message: 'File must be a JSON file',
  }
);

export const fileSizeSchema = (maxSizeMB: number) =>
  fileSchema.refine(
    (file) => file.size <= maxSizeMB * 1024 * 1024,
    {
      message: `File size must be less than ${maxSizeMB}MB`,
    }
  );

/**
 * Format validation error messages
 */
export function formatValidationError(error: ZodError): string {
  if (error.issues.length === 0) return 'Validation error';
  
  const firstError = error.issues[0];
  return firstError.message || 'Invalid value';
}

/**
 * Get field error message from Zod error
 */
export function getFieldError(
  errors: ZodError | Record<string, { message?: string }>,
  fieldName: string
): string | undefined {
  if (errors instanceof ZodError) {
    const fieldError = errors.issues.find((err) => err.path[0] === fieldName);
    return fieldError?.message;
  }
  
  return errors[fieldName]?.message;
}

/**
 * Validate JSON string and return parsed object or error
 */
export function validateJsonString(jsonString: string): {
  success: boolean;
  data?: unknown;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Common validation patterns
 */
export const validationPatterns = {
  slug: /^[a-z0-9-]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
};

/**
 * Validation helper functions
 */
export const validationHelpers = {
  isRequired: (value: unknown): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  },
  
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },
  
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },
  
  matchesPattern: (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  },
};

