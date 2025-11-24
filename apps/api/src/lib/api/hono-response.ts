// Hono-compatible response helpers
// These return JSON objects instead of Response objects for use with c.json()

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Creates a success response object (for Hono)
 */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates a paginated success response object (for Hono)
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

/**
 * Common error response objects (for Hono)
 */
export const Errors = {
  unauthorized: (): ErrorResponse => ({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    },
  }),
  forbidden: (): ErrorResponse => ({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Insufficient permissions',
    },
  }),
  notFound: (resource: string = 'Resource'): ErrorResponse => ({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `${resource} not found`,
    },
  }),
  badRequest: (message: string): ErrorResponse => ({
    success: false,
    error: {
      code: 'BAD_REQUEST',
      message,
    },
  }),
  conflict: (message: string, details?: unknown): ErrorResponse => ({
    success: false,
    error: {
      code: 'CONFLICT',
      message,
      ...(details ? { details } : {}),
    },
  }),
  validationError: (details: unknown): ErrorResponse => ({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
    },
  }),
  serverError: (message: string = 'Internal server error'): ErrorResponse => ({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message,
    },
  }),
};

