import { NextRequest } from 'next/server';
import { Errors } from '@/lib/api/response';
import { getDb } from '@/db/client';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { typeDefs } from '@/lib/graphql/schema';
import { resolvers, type GraphQLContext } from '@/lib/graphql/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';

export const runtime = 'edge';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export async function POST(request: NextRequest) {
  try {
    const db = getDb((globalThis as any).DB);
    const user = await getAuthenticatedUser(request, db);

    const body = await request.json() as { query?: string; variables?: Record<string, unknown>; operationName?: string };
    const { query, variables, operationName } = body;

    if (!query) {
      return Errors.badRequest('GraphQL query is required');
    }

    // Extract organizationId from variables if provided, or from query context
    const organizationId = variables?.organizationId as string | undefined;

    const context: GraphQLContext = {
      db,
      user: {
        id: user.id,
        email: user.email,
      },
      organizationId,
    };

    const result = await graphql({
      schema,
      source: query,
      variableValues: variables || undefined,
      operationName: operationName || undefined,
      contextValue: context,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        errors: [
          {
            message: error instanceof Error ? error.message : 'GraphQL error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

