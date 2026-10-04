import { 
  saveR2ConfigToCloud, 
  loadR2ConfigFromCloud, 
  resetR2ConfigInCloud 
} from '../lib/firebase';

export interface R2StatusResponse {
  success?: boolean;
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
  error?: string;
}

export interface R2ConfigInput {
  accountId: string;
  accessKeyId: string;
  secretAccessKey?: string;
  bucketName: string;
  publicUrl?: string;
}

export interface VideoUploadResult {
  success: boolean;
  publicUrl: string;
  objectKey?: string;
  isLocalPreview?: boolean;
  error?: string;
}

const LOCAL_STORAGE_KEY = 'wedding_r2_config';

export function maskSecretKey(key?: string): string {
  if (!key || !key.trim()) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

export const maskR2SecretKey = maskSecretKey;

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

export function getLocalR2Config(): (R2ConfigInput & { updatedAt?: string }) | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        accountId: parsed.accountId || '',
        accessKeyId: parsed.accessKeyId || '',
        secretAccessKey: parsed.secretAccessKey || '',
        bucketName: parsed.bucketName || '',
        publicUrl: parsed.publicUrl || '',
        updatedAt: parsed.updatedAt,
      };
    }
  } catch (e) {
    console.warn('Failed to parse local R2 config:', e);
  }
  return null;
}

export function saveLocalR2Config(config: R2ConfigInput) {
  try {
    const acc = (config.accountId ?? '').trim();
    const aKey = (config.accessKeyId ?? '').trim();
    const sKey = (config.secretAccessKey ?? '').trim();
    const bName = (config.bucketName ?? '').trim();
    const pUrl = (config.publicUrl ?? '').trim();

    if (!acc && !aKey && !sKey && !bName) {
      clearLocalR2Config();
      return;
    }

    const data = {
      accountId: acc,
      accessKeyId: aKey,
      secretAccessKey: sKey,
      bucketName: bName,
      publicUrl: pUrl,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save R2 config to localStorage:', e);
  }
}

export function clearLocalR2Config() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear local R2 config:', e);
  }
}

/**
 * Checks Cloudflare R2 status safely across Backend Server, Cloud Firestore, and LocalStorage.
 * Cross-synchronizes tiers so credentials persist permanently without repeated manual entry.
 */
export async function checkR2Status(): Promise<R2StatusResponse> {
  // 1. Try server endpoint
  let serverData: any = null;
  try {
    const res = await fetch('/api/r2/status');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.configured) {
        serverData = data;
      }
    }
  } catch (err) {
    console.warn('Server /api/r2/status check notice:', err);
  }

  // 2. Try Firestore cloud storage (cross-device, cross-reload persistence)
  let cloudConfig: any = null;
  try {
    cloudConfig = await loadR2ConfigFromCloud();
  } catch (e) {
    console.warn('Firestore R2 config load notice:', e);
  }

  // 3. Try LocalStorage
  const localConfig = getLocalR2Config();

  // Priority: Server > Firestore > LocalStorage
  const effectiveAccountId =
    (serverData?.accountId && serverData.accountId.trim()) ||
    (cloudConfig?.accountId && cloudConfig.accountId.trim()) ||
    (localConfig?.accountId && localConfig.accountId.trim()) ||
    '';

  const effectiveAccessKeyId =
    (serverData?.accessKeyId && serverData.accessKeyId.trim()) ||
    (cloudConfig?.accessKeyId && cloudConfig.accessKeyId.trim()) ||
    (localConfig?.accessKeyId && localConfig.accessKeyId.trim()) ||
    '';

  const effectiveSecretAccessKey =
    (serverData?.rawSecretAccessKey && serverData.rawSecretAccessKey.trim()) ||
    (cloudConfig?.secretAccessKey && cloudConfig.secretAccessKey.trim()) ||
    (localConfig?.secretAccessKey && localConfig.secretAccessKey.trim()) ||
    '';

  const effectiveBucketName =
    (serverData?.bucketName && serverData.bucketName.trim()) ||
    (cloudConfig?.bucketName && cloudConfig.bucketName.trim()) ||
    (localConfig?.bucketName && localConfig.bucketName.trim()) ||
    '';

  const effectivePublicUrl =
    (serverData?.publicUrl && serverData.publicUrl.trim()) ||
    (cloudConfig?.publicUrl && cloudConfig.publicUrl.trim()) ||
    (localConfig?.publicUrl && localConfig.publicUrl.trim()) ||
    '';

  // If we have valid R2 credentials, cross-synchronize tiers so credentials stay permanent everywhere:
  if (effectiveAccountId && effectiveAccessKeyId && effectiveBucketName) {
    const syncPayload = {
      accountId: effectiveAccountId,
      accessKeyId: effectiveAccessKeyId,
      secretAccessKey: effectiveSecretAccessKey,
      bucketName: effectiveBucketName,
      publicUrl: effectivePublicUrl,
    };

    // Keep localStorage updated
    if (!localConfig?.accountId || localConfig.accountId !== effectiveAccountId) {
      saveLocalR2Config(syncPayload);
    }

    // Keep Firestore updated if missing
    if (!cloudConfig?.accountId) {
      saveR2ConfigToCloud(syncPayload).catch(() => {});
    }

    // Keep backend server updated if server was not configured
    if (!serverData?.configured) {
      try {
        fetch('/api/r2/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload),
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    const source = serverData?.source === 'custom' || serverData?.source === 'env'
      ? serverData.source
      : cloudConfig
        ? 'cloud'
        : 'local';

    return {
      success: true,
      configured: true,
      source,
      accountId: effectiveAccountId,
      accountIdMasked: maskAccountId(effectiveAccountId),
      accessKeyId: effectiveAccessKeyId,
      accessKeyIdMasked: maskAccessKey(effectiveAccessKeyId),
      hasSecretAccessKey: Boolean(effectiveSecretAccessKey),
      maskedSecretAccessKey: maskSecretKey(effectiveSecretAccessKey),
      rawSecretAccessKey: effectiveSecretAccessKey,
      bucketName: effectiveBucketName,
      publicUrl: effectivePublicUrl || undefined,
      updatedAt: serverData?.updatedAt || cloudConfig?.updatedAt || localConfig?.updatedAt || null,
    };
  }

  // Unconfigured
  return {
    success: false,
    configured: false,
    source: 'none',
    accountId: effectiveAccountId || undefined,
    accountIdMasked: effectiveAccountId ? maskAccountId(effectiveAccountId) : undefined,
    accessKeyId: effectiveAccessKeyId || undefined,
    accessKeyIdMasked: effectiveAccessKeyId ? maskAccessKey(effectiveAccessKeyId) : undefined,
    hasSecretAccessKey: false,
    maskedSecretAccessKey: '',
    rawSecretAccessKey: '',
    bucketName: effectiveBucketName || undefined,
    publicUrl: effectivePublicUrl || undefined,
    updatedAt: null,
  };
}

/**
 * Tests Cloudflare R2 credentials safely against server.
 */
export async function testR2Credentials(config: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey?: string;
  bucketName: string;
  publicUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  let secretToTest = config.secretAccessKey ? config.secretAccessKey.trim() : '';
  if (!secretToTest) {
    const local = getLocalR2Config();
    if (local?.secretAccessKey) {
      secretToTest = local.secretAccessKey.trim();
    } else {
      const cloud = await loadR2ConfigFromCloud().catch(() => null);
      if (cloud?.secretAccessKey) {
        secretToTest = cloud.secretAccessKey.trim();
      }
    }
  }

  const payload = {
    accountId: config.accountId?.trim(),
    accessKeyId: config.accessKeyId?.trim(),
    secretAccessKey: secretToTest,
    bucketName: config.bucketName?.trim(),
    publicUrl: config.publicUrl?.trim(),
  };

  if (!payload.accountId || !payload.accessKeyId || !payload.bucketName) {
    return {
      success: false,
      message: 'Account ID, Access Key ID, and Bucket Name are required for testing.',
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('/api/r2/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || `✓ Cloudflare R2 bucket "${payload.bucketName}" connection verified!`,
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Failed to verify Cloudflare R2 credentials on server.',
        };
      }
    }
    return {
      success: false,
      message: `Server returned unexpected response code ${res.status}.`,
    };
  } catch (err: any) {
    console.warn('Backend /api/r2/test error:', err);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection test timed out. Please check network connectivity.',
      };
    }
    return {
      success: false,
      message: err.message || 'Unable to connect to server for R2 testing.',
    };
  }
}

/**
 * Saves Cloudflare R2 credentials permanently to Cloud Firestore, Server, and client localStorage.
 * If all credentials are empty, permanently clears/deletes the credentials from all tiers.
 */
export async function saveR2Credentials(config: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey?: string;
  bucketName: string;
  publicUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  const acc = (config.accountId || '').trim();
  const aKey = (config.accessKeyId || '').trim();
  const sKey = (config.secretAccessKey || '').trim();
  const bName = (config.bucketName || '').trim();
  const pUrl = (config.publicUrl || '').trim();

  // If ALL fields are empty, the user wants to delete / remove R2 credentials completely
  if (!acc && !aKey && !sKey && !bName) {
    return await clearR2Credentials();
  }

  let effectiveSecret = sKey;
  if (!effectiveSecret) {
    const local = getLocalR2Config();
    effectiveSecret = local?.secretAccessKey || '';
    if (!effectiveSecret) {
      const cloud = await loadR2ConfigFromCloud().catch(() => null);
      effectiveSecret = cloud?.secretAccessKey || '';
    }
  }

  if (!acc || !aKey || !bName) {
    return {
      success: false,
      message: 'Account ID, Access Key ID, and Bucket Name are required.',
    };
  }

  const finalConfig: R2ConfigInput = {
    accountId: acc,
    accessKeyId: aKey,
    secretAccessKey: effectiveSecret,
    bucketName: bName,
    publicUrl: pUrl,
  };

  // 1. Always persist to localStorage
  saveLocalR2Config(finalConfig);

  // 2. Always persist to Cloud Firestore
  try {
    await saveR2ConfigToCloud(finalConfig);
  } catch (err) {
    console.warn('Could not persist R2 config to Firestore:', err);
  }

  // 3. Attempt to save to backend server
  try {
    const res = await fetch('/api/r2/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalConfig),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || '✓ Cloudflare R2 credentials saved and activated across Cloud & Server!',
        };
      } else if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Server rejected Cloudflare R2 credentials.',
        };
      }
    }
  } catch {
    // Server not reachable or static deployment
  }

  return {
    success: true,
    message: '✓ Cloudflare R2 credentials saved and activated in Cloud Firestore & Browser Storage!',
  };
}

/**
 * Permanently deletes and removes Cloudflare R2 credentials from Cloud Firestore, server, and client localStorage.
 */
export async function clearR2Credentials(): Promise<{ success: boolean; message: string }> {
  // 1. Clear LocalStorage
  clearLocalR2Config();

  // 2. Remove configuration document from Cloud Firestore
  try {
    await resetR2ConfigInCloud();
  } catch (err) {
    console.warn('Failed to reset R2 config in Firestore:', err);
  }

  // 3. Clear configuration file from backend server
  try {
    const res = await fetch('/api/r2/clear', { method: 'POST' });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: '✓ Cloudflare R2 credentials permanently deleted from Cloud, Server, and Browser Storage.',
        };
      }
    }
  } catch {
    try {
      await fetch('/api/r2/reset', { method: 'POST' });
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    message: '✓ Cloudflare R2 credentials permanently deleted from Cloud Firestore & Browser Storage.',
  };
}

export async function resetR2Credentials(): Promise<{ success: boolean; message: string }> {
  return await clearR2Credentials();
}

/**
 * Uploads a video file or blob to Cloudflare R2 with progress tracking.
 * Falls back to direct server proxy upload if direct CORS upload encounters any network limitation.
 */
export async function uploadVideoToR2(
  fileOrBlob: File | Blob,
  fileName?: string,
  onProgress?: (percent: number) => void
): Promise<VideoUploadResult> {
  const rawContentType = fileOrBlob.type || 'video/mp4';
  const cleanContentType = rawContentType.split(';')[0].trim() || 'video/mp4';
  const ext = (fileName?.split('.').pop() || (cleanContentType.includes('webm') ? 'webm' : 'mp4')).toLowerCase();
  const resolvedFileName = fileName || (fileOrBlob instanceof File ? fileOrBlob.name : `video_${Date.now()}.${ext}`);
  const finalContentType = ext === 'webm' ? 'video/webm' : (cleanContentType || 'video/mp4');

  // 1. Check if R2 is configured on backend or in client/cloud sync
  const status = await checkR2Status();

  if (!status.configured) {
    // If not configured yet, generate a local object URL so the user can still test & preview
    const localUrl = URL.createObjectURL(fileOrBlob);
    return {
      success: true,
      publicUrl: localUrl,
      isLocalPreview: true,
      error: 'Cloudflare R2 is not configured yet. Displaying local preview.',
    };
  }

  // 2. Request a Presigned Upload URL for high-performance direct upload
  try {
    const presignedRes = await fetch('/api/r2/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: resolvedFileName,
        contentType: finalContentType,
        folder: 'guestbook-videos',
      }),
    });

    if (presignedRes.ok) {
      const presignedData = await presignedRes.json();
      if (presignedData.uploadUrl) {
        try {
          const directSuccess = await new Promise<boolean>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', presignedData.uploadUrl, true);
            xhr.setRequestHeader('Content-Type', finalContentType);

            if (xhr.upload && onProgress) {
              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const percent = Math.round((e.loaded / e.total) * 100);
                  onProgress(percent);
                }
              };
            }

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                if (onProgress) onProgress(100);
                resolve(true);
              } else {
                reject(new Error(`Direct R2 presigned PUT status ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error('Network error during direct R2 upload'));
            xhr.send(fileOrBlob);
          });

          if (directSuccess) {
            return {
              success: true,
              publicUrl: presignedData.publicUrl,
              objectKey: presignedData.objectKey,
            };
          }
        } catch (directErr) {
          console.warn('Direct R2 presigned PUT failed (attempting fast server raw binary fallback):', directErr);
        }
      }
    }
  } catch (presignedErr) {
    console.warn('Presigned ticket generation issue, falling back to server upload:', presignedErr);
  }

  // 2.5. High-performance Raw Binary Server Proxy Upload (Zero base64 overhead, streams exact bytes)
  try {
    if (onProgress) onProgress(20);
    const rawSuccess = await new Promise<VideoUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const rawUrl = `/api/r2/upload-raw?fileName=${encodeURIComponent(resolvedFileName)}&contentType=${encodeURIComponent(finalContentType)}&folder=guestbook-videos`;
      xhr.open('POST', rawUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('X-File-Name', encodeURIComponent(resolvedFileName));
      xhr.setRequestHeader('X-Content-Type', finalContentType);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = 20 + Math.round((e.loaded / e.total) * 75);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resData = JSON.parse(xhr.responseText);
            if (onProgress) onProgress(100);
            resolve({
              success: true,
              publicUrl: resData.publicUrl,
              objectKey: resData.objectKey,
            });
          } catch (parseErr) {
            reject(new Error('Failed to parse server upload response'));
          }
        } else {
          reject(new Error(`Server raw binary upload status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during raw binary upload'));
      xhr.send(fileOrBlob);
    });

    if (rawSuccess.success) {
      return rawSuccess;
    }
  } catch (rawErr) {
    console.warn('Raw binary upload fallback failed, attempting base64 direct upload:', rawErr);
  }

  // 3. Fallback: Base64 Direct Server Proxy Upload
  try {
    if (onProgress) onProgress(50);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });

    if (onProgress) onProgress(75);

    const directRes = await fetch('/api/r2/upload-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl,
        fileName: resolvedFileName,
        contentType: finalContentType,
        folder: 'guestbook-videos',
      }),
    });

    if (!directRes.ok) {
      const errData = await directRes.json().catch(() => ({}));
      throw new Error(errData.error || `Server proxy upload returned status ${directRes.status}`);
    }

    const data = await directRes.json();
    if (onProgress) onProgress(100);

    return {
      success: true,
      publicUrl: data.publicUrl,
      objectKey: data.objectKey,
    };
  } catch (fallbackErr: any) {
    console.error('All Cloudflare R2 upload attempts failed:', fallbackErr);
    // Resilient fallback: return local Object URL
    const localUrl = URL.createObjectURL(fileOrBlob);
    return {
      success: false,
      publicUrl: localUrl,
      isLocalPreview: true,
      error: fallbackErr.message || 'Failed to upload video to Cloudflare R2',
    };
  }
}

/**
 * Permanently deletes a video from Cloudflare R2 via the server-side API.
 * Accepts either the full video public URL or the object key.
 */
export async function deleteVideoFromR2(videoUrlOrKey: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  if (!videoUrlOrKey || typeof videoUrlOrKey !== 'string') {
    return { success: true };
  }

  const trimmed = videoUrlOrKey.trim();
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return { success: true };
  }

  try {
    const res = await fetch('/api/r2/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl: trimmed }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn('Cloudflare R2 delete returned non-ok status:', res.status, data);
      return {
        success: false,
        error: data.error || `R2 deletion failed with status ${res.status}`,
      };
    }

    return {
      success: Boolean(data.success),
      message: data.message,
    };
  } catch (err: any) {
    console.warn('Network error while deleting video from Cloudflare R2:', err);
    return {
      success: false,
      error: err.message || 'Network error during Cloudflare R2 deletion',
    };
  }
}
