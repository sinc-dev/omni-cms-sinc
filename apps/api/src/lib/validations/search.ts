import { z } from 'zod';

// Filter operator types
export const filterOperatorSchema = z.enum([
  'eq',           // equals
  'ne',           // not equals
  'gt',           // greater than
  'gte',          // greater than or equal
  'lt',           // less than
  'lte',          // less than or equal
  'in',           // in array
  'not_in',       // not in array
  'contains',     // contains substring
  'not_contains', // does not contain substring
  'starts_with',  // starts with
  'ends_with',    // ends with
  'between',      // between two values
  'is_null',      // is null
  'is_not_null',  // is not null
  'date_eq',      // date equals
  'date_gt',      // date greater than
  'date_gte',     // date greater than or equal
  'date_lt',      // date less than
  'date_lte',     // date less than or equal
  'date_between', // date between
]);

export type FilterOperator = z.infer<typeof filterOperatorSchema>;

// Filter schema
export const filterSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  operator: filterOperatorSchema,
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number()])),
    z.null(),
  ]).optional(),
});

export type Filter = z.infer<typeof filterSchema>;

// Filter group schema
export const filterGroupSchema = z.object({
  filters: z.array(filterSchema).min(1, 'At least one filter is required'),
  operator: z.enum(['AND', 'OR']).default('AND'),
});

export type FilterGroup = z.infer<typeof filterGroupSchema>;

// Sort configuration
export const sortConfigSchema = z.object({
  property: z.string().min(1, 'Property is required'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export type SortConfig = z.infer<typeof sortConfigSchema>;

// Main search request schema
export const searchRequestSchema = z.object({
  entityType: z.enum(['posts', 'media', 'users', 'taxonomies', 'all']).default('posts'),
  properties: z.array(z.string()).optional(), // Which fields to return
  filterGroups: z.array(filterGroupSchema).optional(),
  sorts: z.array(sortConfigSchema).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  after: z.string().optional(), // Cursor for pagination
  search: z.string().optional(), // Full-text search query
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

