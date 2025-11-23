import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME } from './r2-client';
import { nanoid } from 'nanoid';

/**
 * Generates a presigned URL for uploading a file to R2
 * @param contentType MIME type of the file
 * @param originalFilename Original filename to preserve extension
 * @returns Object containing the upload URL, the generated file key, and the public URL
 */
export async function generatePresignedUploadUrl(
  contentType: string,
  originalFilename: string
) {
  const ext = originalFilename.split('.').pop();
  const fileKey = `${nanoid()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  // Generate a presigned URL valid for 15 minutes
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

  return {
    uploadUrl,
    fileKey,
    // If R2_PUBLIC_URL is set, use it, otherwise fallback to direct R2 URL structure (which might not be public)
    publicUrl: process.env.R2_PUBLIC_URL 
      ? `${process.env.R2_PUBLIC_URL}/${fileKey}`
      : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileKey}`,
  };
}

/**
 * Deletes a file from R2
 * @param fileKey The key of the file to delete
 */
export async function deleteFileFromR2(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
  });

  await r2Client.send(command);
}
