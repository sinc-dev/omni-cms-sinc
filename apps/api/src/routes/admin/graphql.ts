import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { Errors } from '../../lib/api/hono-response';
import { typeDefs } from '../../lib/graphql/schema';
import { resolvers, type GraphQLContext } from '../../lib/graphql/resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

app.post(
  '/graphql',
  authMiddleware,
  async (c) => {
    try {
      const { db, user, organizationId } = getAuthContext(c);
      
      const body = await c.req.json() as { query?: string; variables?: Record<string, unknown>; operationName?: string };
      const { query, variables, operationName } = body;

      if (!query) {
        return c.json(Errors.badRequest('GraphQL query is required'), 400);
      }

      // Extract organizationId from variables if provided, or use from context
      const orgId = (variables?.organizationId as string | undefined) || organizationId;

      const context: GraphQLContext = {
        db,
        user: {
          id: user.id,
          email: user.email,
        },
        organizationId: orgId,
      };

      const result = await graphql({
        schema,
        source: query,
        variableValues: variables || undefined,
        operationName: operationName || undefined,
        contextValue: context,
      });

      return c.json(result);
    } catch (error) {
      return c.json(
        {
          errors: [
            {
              message: error instanceof Error ? error.message : 'GraphQL error',
            },
          ],
        },
        500
      );
    }
  }
);

export default app;

