/**
 * Public API Client
 * 
 * Client for consuming public API endpoints (published content)
 * Used for fetching posts, taxonomies, and other public content
 * from the Omni-CMS public API.
 */

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  postType: {
    id: string;
    name: string;
    slug: string;
  };
  featuredImage: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    altText: string | null;
    caption: string | null;
  } | null;
  taxonomies: Record<string, Array<{
    id: string;
    name: string;
    slug: string;
  }>>;
  customFields: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface PublicPostsOptions {
  page?: number;
  perPage?: number;
  postType?: string;
  search?: string;
  publishedFrom?: string; // ISO 8601 date
  publishedTo?: string; // ISO 8601 date
  sort?: string; // Format: "field_asc" or "field_desc", e.g., "publishedAt_desc", "title_asc"
}

class PublicApiClient {
  private baseUrl: string;

  constructor() {
    // Use the public API URL, fallback to same origin for development
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData: { error?: { message?: string; code?: string } } = {};
      
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, create a generic error
        errorData = { error: { message: 'An error occurred' } };
      }

      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get published posts for an organization
   * 
   * @param orgSlug Organization slug (e.g., 'study-in-kazakhstan')
   * @param options Query options for filtering and pagination
   * @returns Paginated response with posts
   * 
   * @example
   * ```typescript
   * const { data: posts, meta } = await publicApi.getPosts('study-in-kazakhstan', {
   *   page: 1,
   *   perPage: 20,
   *   postType: 'programs',
   *   search: 'engineering',
   *   sort: 'publishedAt_desc'
   * });
   * ```
   */
  async getPosts(
    orgSlug: string,
    options: PublicPostsOptions = {}
  ): Promise<PaginatedResponse<PublicPost>> {
    const params = new URLSearchParams();
    
    if (options.page) params.set('page', options.page.toString());
    if (options.perPage) params.set('per_page', options.perPage.toString());
    if (options.postType) params.set('post_type', options.postType);
    if (options.search) params.set('search', options.search);
    if (options.publishedFrom) params.set('published_from', options.publishedFrom);
    if (options.publishedTo) params.set('published_to', options.publishedTo);
    if (options.sort) params.set('sort', options.sort);

    const queryString = params.toString();
    const endpoint = `/api/public/v1/${orgSlug}/posts${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<PublicPost>>(endpoint);
  }

  /**
   * Get a single published post by slug
   * 
   * @param orgSlug Organization slug
   * @param slug Post slug
   * @returns Post with full details including taxonomies, custom fields, and related posts
   */
  async getPost(orgSlug: string, slug: string): Promise<{ success: true; data: PublicPost & { relatedPosts?: PublicPost[] } }> {
    return this.request(`/api/public/v1/${orgSlug}/posts/${slug}`);
  }

  /**
   * Get taxonomy with all terms
   * 
   * @param orgSlug Organization slug
   * @param taxonomySlug Taxonomy slug (e.g., 'categories', 'program-types')
   * @returns Taxonomy with hierarchical terms
   */
  async getTaxonomy(orgSlug: string, taxonomySlug: string) {
    return this.request(`/api/public/v1/${orgSlug}/taxonomies/${taxonomySlug}`);
  }

  /**
   * Get posts by taxonomy term
   * 
   * @param orgSlug Organization slug
   * @param taxonomySlug Taxonomy slug
   * @param termSlug Term slug
   * @param options Query options for filtering and pagination
   * @returns Paginated response with posts
   */
  async getPostsByTaxonomyTerm(
    orgSlug: string,
    taxonomySlug: string,
    termSlug: string,
    options: PublicPostsOptions = {}
  ): Promise<PaginatedResponse<PublicPost>> {
    const params = new URLSearchParams();
    
    if (options.page) params.set('page', options.page.toString());
    if (options.perPage) params.set('per_page', options.perPage.toString());
    if (options.postType) params.set('post_type', options.postType);
    if (options.search) params.set('search', options.search);
    if (options.publishedFrom) params.set('published_from', options.publishedFrom);
    if (options.publishedTo) params.set('published_to', options.publishedTo);
    if (options.sort) params.set('sort', options.sort);

    const queryString = params.toString();
    const endpoint = `/api/public/v1/${orgSlug}/taxonomies/${taxonomySlug}/${termSlug}/posts${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<PublicPost>>(endpoint);
  }

  /**
   * Search posts (requires API key)
   * 
   * @param orgSlug Organization slug
   * @param searchRequest Search request with filters
   * @param apiKey Optional API key for authenticated search
   * @returns Search results
   */
  async searchPosts(
    orgSlug: string,
    searchRequest: {
      search?: string;
      entityType?: 'posts' | 'media' | 'users' | 'taxonomies' | 'all';
      filters?: {
        postType?: string;
        taxonomies?: Record<string, string[]>;
        publishedFrom?: string;
        publishedTo?: string;
      };
      sort?: { field: string; order: 'asc' | 'desc' };
      page?: number;
      perPage?: number;
    },
    apiKey?: string
  ) {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return this.request(`/api/public/v1/${orgSlug}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(searchRequest),
    });
  }

  /**
   * Get sitemap XML
   * 
   * @param orgSlug Organization slug
   * @returns XML sitemap string
   */
  async getSitemap(orgSlug: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/public/v1/${orgSlug}/sitemap.xml`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    return response.text();
  }

  /**
   * Get SEO metadata for a post
   * 
   * @param orgSlug Organization slug
   * @param slug Post slug
   * @returns SEO metadata
   */
  async getPostSEO(orgSlug: string, slug: string) {
    return this.request(`/api/public/v1/${orgSlug}/posts/${slug}/seo`);
  }
}

export const publicApiClient = new PublicApiClient();
export default publicApiClient;

