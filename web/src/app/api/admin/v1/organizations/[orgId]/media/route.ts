import { eq, and, sql, desc, gte, lte, like } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import {
  validateRequest,
  getPaginationParams,
  getOffset,
} from '@/lib/api/validation';
import { z } from 'zod';
import { media } from '@/db/schema';
import { generatePresignedUploadUrl } from '@/lib/storage/upload';
import { getMediaVariantUrls } from '@/lib/media/urls';

// Schema for requesting an upload URL
const requestUploadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// GET /api/admin/v1/organizations/:orgId/media - List media
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;
    const type = url.searchParams.get('type') ?? undefined; // image|video|other
    const sort = url.searchParams.get('sort') ?? 'createdAt_desc';
    const createdFrom = url.searchParams.get('created_from') ?? undefined;
    const createdTo = url.searchParams.get('created_to') ?? undefined;

    const whereClauses = [eq(media.organizationId, organizationId!)];

    if (search) {
      whereClauses.push(like(media.filename, `%${search}%`));
    }

    if (type === 'image') {
      whereClauses.push(like(media.mimeType, 'image/%'));
    } else if (type === 'video') {
      whereClauses.push(like(media.mimeType, 'video/%'));
    } else if (type === 'other') {
      // Use sql template for NOT LIKE conditions
      whereClauses.push(
        sql`${media.mimeType} NOT LIKE 'image/%' AND ${media.mimeType} NOT LIKE 'video/%'`
      );
    }

    if (createdFrom) {
      const fromDate = new Date(createdFrom);
      if (Number.isNaN(fromDate.getTime())) {
        return Errors.badRequest('Invalid created_from date');
      }
      whereClauses.push(gte(media.createdAt, fromDate));
    }

    if (createdTo) {
      const toDate = new Date(createdTo);
      if (Number.isNaN(toDate.getTime())) {
        return Errors.badRequest('Invalid created_to date');
      }
      whereClauses.push(lte(media.createdAt, toDate));
    }

    const orderBy =
      sort === 'filename_asc'
        ? [media.filename]
        : sort === 'filename_desc'
        ? [desc(media.filename)]
        : sort === 'createdAt_asc'
        ? [media.createdAt]
        : [desc(media.createdAt)];

    const allMedia = await db.query.media.findMany({
      where: and(...whereClauses),
      limit: perPage,
      offset,
      orderBy,
      with: {
        uploader: true,
      },
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(media)
      .where(and(...whereClauses));
    const total = totalResult[0]?.count || 0;

    const itemsWithUrls = allMedia.map((item) => ({
      ...item,
      urls: getMediaVariantUrls(item),
    }));

    return paginatedResponse(itemsWithUrls, page, perPage, total);
  },
  {
    requiredPermission: 'media:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/media - Request upload URL
export const POST = withAuth(
  async (request, { db, user, organizationId }) => {
    const validation = await validateRequest(request, requestUploadSchema);
    if (!validation.success) return validation.response;

    const { filename, mimeType, fileSize, width, height } = validation.data;

    // Generate presigned URL and file key
    const { uploadUrl, fileKey, publicUrl } = await generatePresignedUploadUrl(
      mimeType,
      filename
    );

    // Create media record with 'uploading' status
    const newMedia = await db
      .insert(media)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        uploaderId: user.id,
        filename,
        fileKey,
        mimeType,
        fileSize,
        width: width || null,
        height: height || null,
        altText: null,
        caption: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newMediaArray = Array.isArray(newMedia) ? newMedia : [newMedia];
    if (newMediaArray.length === 0) {
      return Errors.serverError('Failed to create media record');
    }
    return successResponse({
      media: newMediaArray[0],
      uploadUrl,
      publicUrl,
    });
  },
  {
    requiredPermission: 'media:upload',
    requireOrgAccess: true,
  }
);

