// Dynamic imports for AWS SDK to prevent bundling into routes that don't use media upload
import { getR2Client, getR2BucketName, getR2PublicUrl } from './r2-client';
import { nanoid } from 'nanoid';

/**
 * Generates a presigned URL for uploading a file to R2
 * @param contentType MIME type of the file
 * @param originalFilename Original filename to preserve extension
 * @param env Environment variables from Cloudflare Workers (c.env)
 * @returns Object containing the upload URL, the generated file key, and the public URL
 */
export async function generatePresignedUploadUrl(
  contentType: string,
  originalFilename: string,
  env: {
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET_NAME?: string;
    R2_PUBLIC_URL?: string;
  }
) {
  // Dynamic import - only loads AWS SDK when this function is called
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  
  const r2Client = await getR2Client(env);
  const bucketName = getR2BucketName(env);
  const ext = originalFilename.split('.').pop();
  const fileKey = `${nanoid()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: contentType,
  });

  // Generate a presigned URL valid for 15 minutes
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

  const publicUrl = getR2PublicUrl(env)
    ? `${getR2PublicUrl(env)}/${fileKey}`
    : `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${fileKey}`;

  return {
    uploadUrl,
    fileKey,
    publicUrl,
  };
}

/**
 * Deletes a file from R2
 * @param fileKey The key of the file to delete
 * @param env Environment variables from Cloudflare Workers (c.env)
 */
export async function deleteFileFromR2(
  fileKey: string,
  env: {
    R2_ACCOUNT_ID?: string;
    R2_ACCESS_KEY_ID?: string;
    R2_SECRET_ACCESS_KEY?: string;
    R2_BUCKET_NAME?: string;
  }
) {
  // Dynamic import - only loads AWS SDK when this function is called
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  
  const r2Client = await getR2Client(env);
  const bucketName = getR2BucketName(env);
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
  });

  await r2Client.send(command);
}
