import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { roles } from '@/db/schema';

export const runtime = 'edge';


// GET /api/admin/v1/roles - Get all available roles
export const GET = withAuth(async (request, { db }) => {
  const allRoles = await db.query.roles.findMany({
    orderBy: [roles.name],
  });

  return successResponse(allRoles);
});
