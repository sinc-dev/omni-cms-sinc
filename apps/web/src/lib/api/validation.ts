import { z } from 'zod';
import { Errors } from './response';
import { eq, and, like, desc, gte, lte, asc, SQL, sql } from 'drizzle-orm';

/**
 * Validates request body against a Zod schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: Errors.validationError(error.issues),
      };
    }
    return {
      success: false,
      response: Errors.badRequest('Invalid request body'),
    };
  }
}

/**
 * Extracts pagination parameters from URL search params
 */
export function getPaginationParams(url: URL): { page: number; perPage: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get('per_page') || '20', 10))
  );
  return { page, perPage };
}

/**
 * Calculates offset for pagination
 */
export function getOffset(page: number, perPage: number): number {
  return (page - 1) * perPage;
}

/**
 * Parses a date string from query params, returning undefined if invalid
 */
export function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Builds a search condition for a text field using LIKE
 */
export function buildSearchCondition<T>(
  field: any,
  search: string | null | undefined
): T[] {
  if (!search) return [];
  return [like(field, `%${search}%`)] as T[];
}

/**
 * Parses sort parameter into drizzle orderBy array
 * Format: "field_asc" or "field_desc" (default: "createdAt_desc")
 */
export function parseSortParam<T>(
  sort: string | null | undefined,
  fields: {
    createdAt: any;
    [key: string]: any;
  },
  defaultField: keyof typeof fields = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): any[] {
  if (!sort) {
    return defaultOrder === 'desc'
      ? [desc(fields[defaultField])]
      : [asc(fields[defaultField])];
  }

  const [field, order] = sort.split('_');
  if (!field || !fields[field]) {
    return defaultOrder === 'desc'
      ? [desc(fields[defaultField])]
      : [asc(fields[defaultField])];
  }

  return order === 'asc' ? [asc(fields[field])] : [desc(fields[field])];
}
