/// <reference types="jest" />
import type { MockHonoContext } from './mock-hono-context';
import type { SuccessResponse, PaginatedResponse, ErrorResponse } from '../../lib/api/hono-response';

/**
 * Request builder for creating test requests
 */
export class RequestBuilder {
  private _method: string = 'GET';
  private _url: string = 'http://localhost:8787';
  private _headers: Record<string, string> = {};
  private _body: any = undefined;
  private _params: Record<string, string> = {};
  private _query: Record<string, string> = {};

  static create(): RequestBuilder {
    return new RequestBuilder();
  }

  method(method: string): this {
    this._method = method;
    return this;
  }

  url(url: string): this {
    this._url = url;
    return this;
  }

  header(name: string, value: string): this {
    this._headers[name] = value;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this._headers = { ...this._headers, ...headers };
    return this;
  }

  body(body: any): this {
    this._body = body;
    return this;
  }

  param(key: string, value: string): this {
    this._params[key] = value;
    return this;
  }

  params(params: Record<string, string>): this {
    this._params = { ...this._params, ...params };
    return this;
  }

  query(key: string, value: string): this {
    this._query[key] = value;
    return this;
  }

  queryParams(query: Record<string, string>): this {
    this._query = { ...this._query, ...query };
    return this;
  }

  build(): {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    params: Record<string, string>;
    query: Record<string, string>;
  } {
    return {
      method: this._method,
      url: this._url,
      headers: this._headers,
      body: this._body,
      params: this._params,
      query: this._query,
    };
  }
}

/**
 * Response validator for checking test responses
 */
export class ResponseValidator {
  private response: Response;

  constructor(response: Response) {
    this.response = response;
  }

  async expectStatus(status: number): Promise<this> {
    expect(this.response.status).toBe(status);
    return this;
  }

  async expectHeader(name: string, value: string | RegExp): Promise<this> {
    const headerValue = this.response.headers.get(name);
    expect(headerValue).toBeDefined();
    if (value instanceof RegExp) {
      expect(headerValue).toMatch(value);
    } else {
      expect(headerValue).toBe(value);
    }
    return this;
  }

  async expectJson(): Promise<this> {
    const contentType = this.response.headers.get('Content-Type');
    expect(contentType).toContain('application/json');
    return this;
  }

  async expectSuccessResponse<T = any>(): Promise<SuccessResponse<T>> {
    await this.expectStatus(200);
    await this.expectJson();
    const data = await this.response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    return data as SuccessResponse<T>;
  }

  async expectPaginatedResponse<T = any>(): Promise<PaginatedResponse<T>> {
    await this.expectStatus(200);
    await this.expectJson();
    const data = await this.response.json() as any;
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('meta');
    expect(data.meta).toHaveProperty('page');
    expect(data.meta).toHaveProperty('perPage');
    expect(data.meta).toHaveProperty('total');
    expect(data.meta).toHaveProperty('totalPages');
    return data as PaginatedResponse<T>;
  }

  async expectErrorResponse(code?: string): Promise<ErrorResponse> {
    const data = await this.response.json() as any;
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('code');
    expect(data.error).toHaveProperty('message');
    if (code) {
      expect(data.error.code).toBe(code);
    }
    return data as ErrorResponse;
  }

  async expectData<T = any>(): Promise<T> {
    const data = await this.response.json();
    return data as T;
  }

  async expectText(): Promise<string> {
    return await this.response.text();
  }
}

/**
 * Helper to validate pagination metadata
 */
export function validatePagination(meta: any, expectedPage: number, expectedPerPage: number, expectedTotal: number) {
  expect(meta).toHaveProperty('page', expectedPage);
  expect(meta).toHaveProperty('perPage', expectedPerPage);
  expect(meta).toHaveProperty('total', expectedTotal);
  expect(meta).toHaveProperty('totalPages', Math.ceil(expectedTotal / expectedPerPage));
}

/**
 * Helper to validate error response structure
 */
export function validateErrorResponse(data: any, expectedCode?: string, expectedMessage?: string) {
  expect(data).toHaveProperty('success', false);
  expect(data).toHaveProperty('error');
  expect(data.error).toHaveProperty('code');
  expect(data.error).toHaveProperty('message');
  
  if (expectedCode) {
    expect(data.error.code).toBe(expectedCode);
  }
  
  if (expectedMessage) {
    expect(data.error.message).toContain(expectedMessage);
  }
}

/**
 * Helper to validate success response structure
 */
export function validateSuccessResponse<T>(data: any): data is { success: true; data: T } {
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('data');
  return true;
}

/**
 * Helper to create test data factories
 */
export const TestDataFactory = {
  /**
   * Creates test organization data
   */
  organization: (overrides?: Partial<any>) => ({
    name: 'Test Organization',
    slug: 'test-org',
    domain: 'test.example.com',
    settings: {},
    ...overrides,
  }),

  /**
   * Creates test post data
   */
  post: (overrides?: Partial<any>) => ({
    title: 'Test Post',
    slug: 'test-post',
    content: '<p>Test content</p>',
    excerpt: 'Test excerpt',
    status: 'draft',
    ...overrides,
  }),

  /**
   * Creates test post type data
   */
  postType: (overrides?: Partial<any>) => ({
    name: 'Blog Post',
    slug: 'blog-post',
    description: 'Blog posts',
    isHierarchical: false,
    ...overrides,
  }),

  /**
   * Creates test taxonomy data
   */
  taxonomy: (overrides?: Partial<any>) => ({
    name: 'Categories',
    slug: 'categories',
    isHierarchical: true,
    ...overrides,
  }),

  /**
   * Creates test media data
   */
  media: (overrides?: Partial<any>) => ({
    filename: 'test.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024,
    url: 'https://test.r2.dev/test.jpg',
    ...overrides,
  }),
};

/**
 * Helper to wait for async operations in tests
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to create FormData for file upload tests
 */
export function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof Blob || value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === 'string') {
      formData.append(key, value);
    } else {
      formData.append(key, JSON.stringify(value));
    }
  });
  return formData;
}