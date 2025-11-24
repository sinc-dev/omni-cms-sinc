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
 * Creates a success response
 */
export function successResponse<T>(data: T): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  return Response.json(response);
}

/**
 * Creates a paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number
): Response {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
  return Response.json(response);
}

/**
 * Creates an error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): Response {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return Response.json(response, { status });
}

/**
 * Common error responses
 */
export const Errors = {
  unauthorized: () => errorResponse('UNAUTHORIZED', 'Authentication required', 401),
  forbidden: () => errorResponse('FORBIDDEN', 'Insufficient permissions', 403),
  notFound: (resource: string = 'Resource') =>
    errorResponse('NOT_FOUND', `${resource} not found`, 404),
  badRequest: (message: string) => errorResponse('BAD_REQUEST', message, 400),
  conflict: (message: string, details?: unknown) => errorResponse('CONFLICT', message, 409, details),
  validationError: (details: unknown) =>
    errorResponse('VALIDATION_ERROR', 'Validation failed', 400, details),
  serverError: (message: string = 'Internal server error') =>
    errorResponse('SERVER_ERROR', message, 500),
};
