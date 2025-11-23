import { eq, and } from 'drizzle-orm';
import { withPublic } from '@/lib/api/public-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { organizations, taxonomies, taxonomyTerms } from '@/db/schema';

// GET /api/public/v1/:orgSlug/taxonomies/:taxonomySlug - Get taxonomy with terms
export const GET = withPublic(
  async (request, { db }, params) => {
    const orgSlug = params?.orgSlug;
    const taxonomySlug = params?.taxonomySlug;

    if (!orgSlug || !taxonomySlug) {
      return Errors.badRequest('Organization slug and taxonomy slug required');
    }

  // Find organization by slug
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!organization) {
    return Errors.notFound('Organization');
  }

  // Find taxonomy by slug
  const taxonomy = await db.query.taxonomies.findFirst({
    where: and(
      eq(taxonomies.organizationId, organization.id),
      eq(taxonomies.slug, taxonomySlug)
    ),
  });

  if (!taxonomy) {
    return Errors.notFound('Taxonomy');
  }

  // Fetch all terms for this taxonomy
  const terms = await db.query.taxonomyTerms.findMany({
    where: eq(taxonomyTerms.taxonomyId, taxonomy.id),
    orderBy: [taxonomyTerms.name],
  });

  // Build hierarchical structure if needed
  const termsWithChildren = taxonomy.isHierarchical
    ? terms.map((term) => ({
        ...term,
        children: terms.filter((t) => t.parentId === term.id),
      }))
    : terms;

  const taxonomyWithTerms = {
    ...taxonomy,
    terms: termsWithChildren,
  };

  // Set caching headers (15 minutes)
  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');

  const response = successResponse(taxonomyWithTerms);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      ...Object.fromEntries(headers),
      'Content-Type': 'application/json',
    },
  });
  }
);

