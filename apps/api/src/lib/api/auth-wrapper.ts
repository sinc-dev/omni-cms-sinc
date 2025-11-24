import type { DbClient } from '@/db/client';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { checkPermission } from '@/lib/auth/permissions';
import { userHasAccessToOrganization } from '@/lib/auth/organization-context';
import { Errors } from './response';
import type { User } from '@/db/schema';
import type { Permission } from '@/lib/auth/permissions';

export interface AuthenticatedContext {
  user: User;
  db: DbClient;
  organizationId?: string;
}

export type AuthenticatedHandler = (
  request: Request,
  context: AuthenticatedContext,
  params?: Record<string, string>
) => Promise<Response>;

/**
 * Wraps an API route handler with authentication and permission checks
 * @param handler - The route handler function
 * @param options - Configuration options
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options?: {
    requiredPermission?: Permission;
    requireOrgAccess?: boolean;
  }
) {
  return async (request: Request, routeParams?: { params: Record<string, string> }) => {
    try {
      // Get D1 database from Cloudflare binding
      // Note: This needs to be adapted based on how Cloudflare bindings work in Next.js
      // For now, we'll assume it's available in the request context
      const db = (request as any).db as DbClient;
      
      if (!db) {
        return Errors.serverError('Database not configured');
      }

      // Authenticate user
      const user = await getAuthenticatedUser(request, db);

      // Extract organization ID from route params
      const params = routeParams?.params || {};
      const organizationId = params.orgId;

      // Check organization access if required
      if (options?.requireOrgAccess && organizationId) {
        const hasAccess = await userHasAccessToOrganization(db, user, organizationId);
        if (!hasAccess) {
          return Errors.forbidden();
        }
      }

      // Check permission if required
      if (options?.requiredPermission && organizationId) {
        const hasPermission = await checkPermission(
          db,
          user.id,
          organizationId,
          options.requiredPermission
        );
        if (!hasPermission) {
          return Errors.forbidden();
        }
      }

      // Call the handler with authenticated context
      return handler(request, { user, db, organizationId }, params);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return Errors.unauthorized();
        }
        return Errors.serverError(error.message);
      }
      return Errors.serverError();
    }
  };
}
