import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = import.meta.env.VITE_R2_ENDPOINT || 'https://8ddb172434dd7aec1d56e202103365e5.r2.cloudflarestorage.com';
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID || '6e3142da49e7fce423aa335cb39d27a9';
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || 'd92ea3497cfdf3dcfeb246ef6bf77e8b489cc2a772ab1a8e729c65a1c2e8707a';
export const R2_BUCKET = import.meta.env.VITE_R2_BUCKET || 'club-particular';

/**
 * Cloudflare R2 S3-Compatible Client Initialization
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

/**
 * Uploads a file buffer/blob directly to Cloudflare R2 under the recommended path structure:
 * e.g., offers/oferta-001/vsl/principal.mp4
 */
export async function uploadToR2(
  file: File | Blob,
  keyPath: string,
  contentType: string
): Promise<{ key: string; bucket: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: keyPath,
      Body: new Uint8Array(arrayBuffer),
      ContentType: contentType,
    });

    await r2Client.send(command);
    return { key: keyPath, bucket: R2_BUCKET };
  } catch (error) {
    console.error('Error uploading file to Cloudflare R2:', error);
    throw error;
  }
}

/**
 * Generates a temporary signed download URL (valid for 1 hour) for Cloudflare R2 objects
 */
export async function getR2PresignedDownloadUrl(keyPath: string, expiresInSeconds = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: keyPath,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (error) {
    console.error('Error generating Cloudflare R2 presigned URL:', error);
    throw error;
  }
}
