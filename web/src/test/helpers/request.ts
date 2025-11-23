/**
 * Creates a mock Request object for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit;
  } = {}
): Request {
  const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
  
  return new Request(fullUrl, {
    method: options.method || 'GET',
    headers: options.headers as HeadersInit,
    body: options.body as BodyInit,
  });
}

/**
 * Creates a mock Request with authentication headers
 */
export function createAuthenticatedRequest(
  url: string,
  userId: string,
  options: RequestInit = {}
): Request {
  const headers = new Headers(options.headers as HeadersInit);
  headers.set('CF-Access-JWT-Assertion', 'mock-jwt-token');
  headers.set('X-User-Id', userId);

  return createMockRequest(url, {
    ...options,
    headers,
    body: options.body ?? undefined,
  });
}

/**
 * Parses a JSON response
 */
export async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

