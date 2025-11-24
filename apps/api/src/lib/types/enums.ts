/**
 * TypeScript enum types for API use
 * These match the Zod schemas in the validation files
 */

/**
 * Post status values
 */
export const PostStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type PostStatus = typeof PostStatus[keyof typeof PostStatus];

/**
 * Custom field type values
 */
export const CustomFieldType = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  RICH_TEXT: 'rich_text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'date',
  DATETIME: 'datetime',
  MEDIA: 'media',
  RELATION: 'relation',
  SELECT: 'select',
  MULTI_SELECT: 'multi_select',
  JSON: 'json',
} as const;

export type CustomFieldType = typeof CustomFieldType[keyof typeof CustomFieldType];

/**
 * Filter operator values
 */
export const FilterOperator = {
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  IN: 'in',
  NOT_IN: 'not_in',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  BETWEEN: 'between',
  IS_NULL: 'is_null',
  IS_NOT_NULL: 'is_not_null',
  DATE_EQ: 'date_eq',
  DATE_GT: 'date_gt',
  DATE_GTE: 'date_gte',
  DATE_LT: 'date_lt',
  DATE_LTE: 'date_lte',
  DATE_BETWEEN: 'date_between',
} as const;

export type FilterOperator = typeof FilterOperator[keyof typeof FilterOperator];

/**
 * Filter group operator values
 */
export const FilterGroupOperator = {
  AND: 'AND',
  OR: 'OR',
} as const;

export type FilterGroupOperator = typeof FilterGroupOperator[keyof typeof FilterGroupOperator];

/**
 * Sort direction values
 */
export const SortDirection = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortDirection = typeof SortDirection[keyof typeof SortDirection];

/**
 * Entity type values for search
 */
export const EntityType = {
  POSTS: 'posts',
  MEDIA: 'media',
  USERS: 'users',
  TAXONOMIES: 'taxonomies',
  ALL: 'all',
} as const;

export type EntityType = typeof EntityType[keyof typeof EntityType];

/**
 * Helper function to check if a value is a valid PostStatus
 */
export function isValidPostStatus(value: string): value is PostStatus {
  return Object.values(PostStatus).includes(value as PostStatus);
}

/**
 * Helper function to check if a value is a valid CustomFieldType
 */
export function isValidCustomFieldType(value: string): value is CustomFieldType {
  return Object.values(CustomFieldType).includes(value as CustomFieldType);
}

/**
 * Helper function to check if a value is a valid FilterOperator
 */
export function isValidFilterOperator(value: string): value is FilterOperator {
  return Object.values(FilterOperator).includes(value as FilterOperator);
}

/**
 * Helper function to check if a value is a valid SortDirection
 */
export function isValidSortDirection(value: string): value is SortDirection {
  return Object.values(SortDirection).includes(value as SortDirection);
}

/**
 * Helper function to check if a value is a valid EntityType
 */
export function isValidEntityType(value: string): value is EntityType {
  return Object.values(EntityType).includes(value as EntityType);
}

