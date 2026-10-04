import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  updatedAt?: string;
}

export interface DetailedR2Status {
  configured: boolean;
  source: 'custom' | 'env' | 'cloud' | 'local' | 'none';
  accountId?: string;
  accountIdMasked?: string;
  accessKeyId?: string;
  accessKeyIdMasked?: string;
  hasSecretAccessKey: boolean;
  maskedSecretAccessKey: string;
  rawSecretAccessKey?: string;
  bucketName?: string;
  publicUrl?: string;
  updatedAt?: string | null;
}

const R2_CONFIG_FILE = path.resolve(process.cwd(), 'r2-config.json');

export function maskSecretKey(key?: string): string {
  if (!key || !key.trim()) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function maskAccountId(acc?: string): string {
  if (!acc || !acc.trim()) return '';
  const trimmed = acc.trim();
  if (trimmed.length <= 6) return '••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export function maskAccessKey(key?: string): string {
  if (!key || !key.trim()) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

/**
 * Loads R2 configuration from disk (r2-config.json).
 */
export function getStoredR2ConfigFile(): (R2Config & { source: 'custom' }) | null {
  if (fs.existsSync(R2_CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(R2_CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (
        data &&
        typeof data === 'object' &&
        data.accountId &&
        data.accessKeyId &&
        data.secretAccessKey &&
        data.bucketName
      ) {
        let pubUrl = (data.publicUrl || '').trim();
        if (pubUrl.endsWith('/')) pubUrl = pubUrl.slice(0, -1);
        return {
          accountId: data.accountId.trim(),
          accessKeyId: data.accessKeyId.trim(),
          secretAccessKey: data.secretAccessKey.trim(),
          bucketName: data.bucketName.trim(),
          publicUrl: pubUrl,
          updatedAt: data.updatedAt || undefined,
          source: 'custom',
        };
      }
    } catch (e) {
      console.warn('Failed to read r2-config.json:', e);
    }
  }
  return null;
}

/**
 * Saves R2 configuration to disk (r2-config.json).
 */
export function saveR2ConfigFile(config: R2Config): void {
  const payload = {
    accountId: config.accountId.trim(),
    accessKeyId: config.accessKeyId.trim(),
    secretAccessKey: config.secretAccessKey.trim(),
    bucketName: config.bucketName.trim(),
    publicUrl: (config.publicUrl || '').trim().replace(/\/+$/, ''),
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(R2_CONFIG_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  resetR2Client();
}

/**
 * Deletes r2-config.json from disk.
 */
export function clearR2ConfigFile(): void {
  if (fs.existsSync(R2_CONFIG_FILE)) {
    try {
      fs.unlinkSync(R2_CONFIG_FILE);
    } catch (e) {
      console.warn('Failed to delete r2-config.json:', e);
    }
  }
  resetR2Client();
}

export function getR2Config(): (R2Config & { source: 'custom' | 'env' }) | null {
  // 1. Check r2-config.json (Saved from UI or Firestore sync)
  const fileConfig = getStoredR2ConfigFile();
  if (fileConfig) {
    return fileConfig;
  }

  // 2. Check process.env
  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '').trim();
  const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '').trim();
  const bucketName = (process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || '').trim();
  let publicUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').trim();

  if (accountId && accessKeyId && secretAccessKey && bucketName) {
    if (publicUrl.endsWith('/')) {
      publicUrl = publicUrl.slice(0, -1);
    }
    return {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicUrl,
      source: 'env',
    };
  }

  return null;
}

let cachedS3Client: S3Client | null = null;
let cachedClientKey: string = '';

export function resetR2Client(): void {
  cachedS3Client = null;
  cachedClientKey = '';
}

export function getR2Client(): { client: S3Client; config: R2Config } {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      'Cloudflare R2 is not configured. Please enter Account ID, Access Key ID, Secret Access Key, and Bucket Name in Cloud Settings.'
    );
  }

  const key = `${config.accountId}:${config.accessKeyId}:${config.secretAccessKey}`;
  if (!cachedS3Client || cachedClientKey !== key) {
    cachedS3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    cachedClientKey = key;
    // Asynchronously ensure bucket CORS is active for web uploads
    ensureR2Cors(cachedS3Client, config.bucketName).catch(() => {});
  }

  return { client: cachedS3Client, config };
}

export function getR2Status(): DetailedR2Status {
  const config = getR2Config();
  if (!config) {
    const rawEnvAcc = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '').trim();
    const rawEnvKey = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '').trim();
    const rawEnvBucket = (process.env.CLOUDFLARE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || '').trim();
    const rawEnvPublic = (process.env.CLOUDFLARE_R2_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').trim();

    return {
      configured: false,
      source: 'none',
      accountId: rawEnvAcc || undefined,
      accountIdMasked: rawEnvAcc ? maskAccountId(rawEnvAcc) : undefined,
      accessKeyId: rawEnvKey || undefined,
      accessKeyIdMasked: rawEnvKey ? maskAccessKey(rawEnvKey) : undefined,
      hasSecretAccessKey: false,
      maskedSecretAccessKey: '',
      bucketName: rawEnvBucket || undefined,
      publicUrl: rawEnvPublic || undefined,
      updatedAt: null,
    };
  }

  return {
    configured: true,
    source: config.source,
    accountId: config.accountId,
    accountIdMasked: maskAccountId(config.accountId),
    accessKeyId: config.accessKeyId,
    accessKeyIdMasked: maskAccessKey(config.accessKeyId),
    hasSecretAccessKey: true,
    maskedSecretAccessKey: maskSecretKey(config.secretAccessKey),
    rawSecretAccessKey: config.secretAccessKey,
    bucketName: config.bucketName,
    publicUrl: config.publicUrl || undefined,
    updatedAt: config.updatedAt || null,
  };
}

/**
 * Ensures that CORS rules are present on the Cloudflare R2 bucket so browser direct PUT uploads succeed.
 */
export async function ensureR2Cors(client: S3Client, bucketName: string): Promise<void> {
  try {
    const cmd = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'HEAD', 'POST', 'DELETE'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });
    await client.send(cmd);
  } catch (err) {
    // Non-fatal if permission is restricted or already handled
    console.warn('[Cloudflare R2] Notice setting bucket CORS:', err);
  }
}

export async function createR2PresignedUploadUrl(options: {
  fileName: string;
  contentType: string;
  folder?: string;
}) {
  const { client, config } = getR2Client();
  const ext = options.fileName.split('.').pop()?.toLowerCase() || 'mp4';
  const cleanBaseName = options.fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const folder = options.folder ? options.folder.replace(/^\/+|\/+$/g, '') : 'guestbook-videos';
  const objectKey = `${folder}/${Date.now()}_${cleanBaseName || 'video'}.${ext}`;

  // Clean contentType without complex codec params for browser standard playback
  const cleanContentType = options.contentType
    ? options.contentType.split(';')[0].trim()
    : ext === 'webm'
    ? 'video/webm'
    : 'video/mp4';

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: objectKey,
    ContentType: cleanContentType,
  });

  // Presigned URL valid for 1 hour
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = config.publicUrl
    ? `${config.publicUrl}/${objectKey}`
    : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${objectKey}`;

  return {
    uploadUrl,
    publicUrl,
    objectKey,
    contentType: cleanContentType,
  };
}

export async function uploadBufferToR2(options: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
  folder?: string;
}) {
  const { client, config } = getR2Client();
  const ext = options.fileName.split('.').pop()?.toLowerCase() || 'mp4';
  const cleanBaseName = options.fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const folder = options.folder ? options.folder.replace(/^\/+|\/+$/g, '') : 'guestbook-videos';
  const objectKey = `${folder}/${Date.now()}_${cleanBaseName || 'video'}.${ext}`;

  // Clean contentType without complex codec params for browser standard playback
  const cleanContentType = options.contentType
    ? options.contentType.split(';')[0].trim()
    : ext === 'webm'
    ? 'video/webm'
    : 'video/mp4';

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: options.buffer,
      ContentType: cleanContentType,
    })
  );

  const publicUrl = config.publicUrl
    ? `${config.publicUrl}/${objectKey}`
    : `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${objectKey}`;

  return {
    publicUrl,
    objectKey,
    contentType: cleanContentType,
  };
}

/**
 * Robustly extracts the object key from a Cloudflare R2 URL or object path.
 * Handles:
 * - Direct public URLs: https://pub-xxx.r2.dev/guestbook-videos/123_video.mp4 -> guestbook-videos/123_video.mp4
 * - S3/R2 endpoints: https://bucket.account.r2.cloudflarestorage.com/guestbook-videos/123_video.mp4 -> guestbook-videos/123_video.mp4
 * - Custom domain URLs: https://media.example.com/guestbook-videos/123_video.mp4 -> guestbook-videos/123_video.mp4
 * - Object keys: "guestbook-videos/123_video.mp4" or "/guestbook-videos/123_video.mp4"
 */
export function extractR2ObjectKey(urlOrKey: string): string | null {
  if (!urlOrKey || typeof urlOrKey !== 'string') return null;
  let trimmed = urlOrKey.trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return null;
  }

  // Strip query parameters and fragment identifier
  trimmed = trimmed.split('?')[0].split('#')[0];

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed.replace(/^\/+/, '') || null;
  }

  try {
    const parsed = new URL(trimmed);
    let key = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');

    const config = getR2Config();
    if (config?.publicUrl) {
      try {
        const publicBase = new URL(config.publicUrl);
        const basePath = decodeURIComponent(publicBase.pathname).replace(/^\/+|\/+$/g, '');
        if (basePath && key.startsWith(basePath + '/')) {
          key = key.slice(basePath.length + 1);
        }
      } catch {
        // ignore
      }
    }

    return key || null;
  } catch {
    return null;
  }
}

/**
 * Permanently deletes an object from the Cloudflare R2 bucket.
 * Accepts either the full public URL or the object key.
 */
export async function deleteObjectFromR2(objectKeyOrUrl: string): Promise<{
  success: boolean;
  objectKey?: string;
  message?: string;
}> {
  const config = getR2Config();
  if (!config) {
    return {
      success: false,
      message: 'Cloudflare R2 is not configured on this server.',
    };
  }

  const objectKey = extractR2ObjectKey(objectKeyOrUrl);
  if (!objectKey) {
    return {
      success: false,
      message: 'Invalid object key or URL provided for Cloudflare R2 deletion.',
    };
  }

  try {
    const { client } = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    });

    await client.send(command);
    console.log(`[Cloudflare R2] Successfully deleted object "${objectKey}" from bucket "${config.bucketName}"`);
    return {
      success: true,
      objectKey,
      message: `Object "${objectKey}" was deleted from Cloudflare R2 bucket "${config.bucketName}".`,
    };
  } catch (err: any) {
    console.error(`[Cloudflare R2] Failed to delete object "${objectKey}":`, err);
    return {
      success: false,
      objectKey,
      message: err.message || 'Failed to delete object from Cloudflare R2.',
    };
  }
}

/**
 * Tests Cloudflare R2 connectivity and credentials by sending a lightweight ListObjectsV2 ping.
 */
export async function testR2Connection(customConfig?: Partial<R2Config>): Promise<{
  success: boolean;
  message: string;
  bucketName?: string;
  publicUrl?: string;
}> {
  let activeConfig: R2Config;

  if (
    customConfig?.accountId &&
    customConfig?.accessKeyId &&
    customConfig?.secretAccessKey &&
    customConfig?.bucketName
  ) {
    activeConfig = {
      accountId: customConfig.accountId.trim(),
      accessKeyId: customConfig.accessKeyId.trim(),
      secretAccessKey: customConfig.secretAccessKey.trim(),
      bucketName: customConfig.bucketName.trim(),
      publicUrl: (customConfig.publicUrl || '').trim().replace(/\/+$/, ''),
    };
  } else {
    const existing = getR2Config();
    if (!existing) {
      return {
        success: false,
        message: 'Cloudflare R2 credentials are not configured yet.',
      };
    }
    activeConfig = {
      accountId: customConfig?.accountId?.trim() || existing.accountId,
      accessKeyId: customConfig?.accessKeyId?.trim() || existing.accessKeyId,
      secretAccessKey: customConfig?.secretAccessKey?.trim() || existing.secretAccessKey,
      bucketName: customConfig?.bucketName?.trim() || existing.bucketName,
      publicUrl: customConfig?.publicUrl !== undefined
        ? customConfig.publicUrl.trim().replace(/\/+$/, '')
        : existing.publicUrl,
    };
  }

  const testClient = new S3Client({
    region: 'auto',
    endpoint: `https://${activeConfig.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: activeConfig.accessKeyId,
      secretAccessKey: activeConfig.secretAccessKey,
    },
  });

  try {
    const testCommand = new ListObjectsV2Command({
      Bucket: activeConfig.bucketName,
      MaxKeys: 1,
    });
    await testClient.send(testCommand);

    return {
      success: true,
      message: `✓ Successfully verified Cloudflare R2 connection! Bucket "${activeConfig.bucketName}" is accessible and authorized.`,
      bucketName: activeConfig.bucketName,
      publicUrl: activeConfig.publicUrl || undefined,
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn('[Cloudflare R2] Connection test failed:', errMsg);

    if (errMsg.includes('NoSuchBucket')) {
      return {
        success: false,
        message: `Bucket "${activeConfig.bucketName}" was not found in Cloudflare account ${activeConfig.accountId}. Please check the bucket name.`,
      };
    }
    if (errMsg.includes('InvalidAccessKeyId') || errMsg.includes('SignatureDoesNotMatch')) {
      return {
        success: false,
        message: 'Authentication failed. Please verify your Access Key ID and Secret Access Key.',
      };
    }
    if (errMsg.includes('AccessDenied') || errMsg.includes('Forbidden')) {
      return {
        success: false,
        message: `Access denied to bucket "${activeConfig.bucketName}". Please ensure your R2 API token has Object Read & Write permissions for this bucket.`,
      };
    }
    return {
      success: false,
      message: `Cloudflare R2 test failed: ${errMsg}`,
    };
  }
}


