/**
 * Blog Post Schema for Omni-CMS
 * Maps WordPress post data to Omni-CMS format
 */

export interface WordPressBlogPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  format: string;
  categories: number[];
  tags: number[];
  _links: Record<string, any>;
}

export interface OmniCMSBlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  featuredImageId?: string;
  categoryIds?: string[];
  tagIds?: string[];
  customFields?: Record<string, any>;
  metadata?: {
    wordpressId?: number;
    wordpressUrl?: string;
    importedAt?: Date;
  };
}

/**
 * Transform WordPress blog post to Omni-CMS format
 */
export function transformBlogPost(
  wpPost: WordPressBlogPost,
  mediaMap: Map<number, string>, // WordPress media ID -> Omni-CMS media ID
  taxonomyMap: Map<number, string> // WordPress taxonomy ID -> Omni-CMS taxonomy term ID
): OmniCMSBlogPost {
  return {
    title: wpPost.title.rendered,
    slug: wpPost.slug,
    content: wpPost.content.rendered,
    excerpt: wpPost.excerpt.rendered || undefined,
    status: wpPost.status === 'publish' ? 'published' : 'draft',
    publishedAt: wpPost.status === 'publish' ? new Date(wpPost.date) : undefined,
    featuredImageId: wpPost.featured_media ? mediaMap.get(wpPost.featured_media) : undefined,
    categoryIds: wpPost.categories.map(id => taxonomyMap.get(id)).filter(Boolean) as string[],
    tagIds: wpPost.tags.map(id => taxonomyMap.get(id)).filter(Boolean) as string[],
    metadata: {
      wordpressId: wpPost.id,
      wordpressUrl: wpPost.link,
      importedAt: new Date(),
    },
  };
}

