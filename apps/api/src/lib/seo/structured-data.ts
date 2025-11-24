/**
 * Generate JSON-LD structured data for posts
 */

interface StructuredDataOptions {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  author?: {
    name: string;
    url?: string;
  } | null;
  publishedAt?: Date | null;
  modifiedAt?: Date | null;
  type?: 'Article' | 'BlogPosting' | 'WebPage';
}

/**
 * Generate Article structured data (JSON-LD)
 */
export function generateArticleStructuredData(options: StructuredDataOptions) {
  const {
    title,
    description,
    url,
    image,
    author,
    publishedAt,
    modifiedAt,
    type = 'Article',
  } = options;

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    headline: title,
    url,
  };

  if (description) {
    structuredData.description = description;
  }

  if (image) {
    structuredData.image = image;
  }

  if (author) {
    structuredData.author = {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    };
  }

  if (publishedAt) {
    structuredData.datePublished = publishedAt.toISOString();
  }

  if (modifiedAt) {
    structuredData.dateModified = modifiedAt.toISOString();
  }

  return structuredData;
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData(options: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name,
    url: options.url,
    ...(options.logo && { logo: options.logo }),
    ...(options.description && { description: options.description }),
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

