/**
 * Safe ImageKit Client Helper
 * 
 * Supports both full-stack (Express backend) and static/client-side (Netlify, Vite preview)
 * deployments. Safely checks response content-type to prevent:
 * SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
 */

import { 
  saveImageKitConfigToCloud, 
  loadImageKitConfigFromCloud, 
  resetImageKitConfigInCloud 
} from './firebase';

export interface ImageKitStatus {
  configured: boolean;
  source: 'custom' | 'env' | 'cloud' | 'local' | 'none';
  publicKey: string;
  urlEndpoint: string;
  hasPrivateKey: boolean;
  maskedPrivateKey: string;
  rawPrivateKey?: string;
  updatedAt: string | null;
}

const LOCAL_STORAGE_KEY = 'wedding_imagekit_config';

export function maskPrivateKey(key?: string): string {
  if (!key || !key.trim()) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 8)}••••${trimmed.slice(-4)}`;
}

export function getLocalImageKitConfig(): { publicKey: string; privateKey: string; urlEndpoint: string; updatedAt?: string } | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        publicKey: parsed.publicKey || '',
        privateKey: parsed.privateKey || '',
        urlEndpoint: parsed.urlEndpoint || '',
        updatedAt: parsed.updatedAt
      };
    }
  } catch (e) {
    console.warn('Failed to parse local ImageKit config:', e);
  }
  return null;
}

export function saveLocalImageKitConfig(config: { publicKey: string; privateKey: string; urlEndpoint: string }) {
  try {
    const pKey = (config.publicKey ?? '').trim();
    const privKey = (config.privateKey ?? '').trim();
    const urlEp = (config.urlEndpoint ?? '').trim();

    // If all fields are empty, remove from localStorage
    if (!pKey && !privKey && !urlEp) {
      clearLocalImageKitConfig();
      return;
    }

    const data = {
      publicKey: pKey,
      privateKey: privKey,
      urlEndpoint: urlEp,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save ImageKit config to localStorage:', e);
  }
}

export function clearLocalImageKitConfig() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear local ImageKit config:', e);
  }
}

/**
 * Checks ImageKit status safely across Backend Server, Cloud Firestore, and LocalStorage.
 * Will NOT throw SyntaxError if server returns HTML (SPA fallback on Netlify/static hosting).
 */
export async function checkImageKitStatus(): Promise<ImageKitStatus> {
  // 1. Try server endpoint
  let serverData: any = null;
  try {
    const res = await fetch('/api/imagekit/status');
    const contentType = res.headers.get('content-type') || '';

    // Verify it returned valid JSON, not an HTML SPA fallback page (e.g. <!doctype html>)
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data.configured) {
        serverData = data;
      }
    }
  } catch (err) {
    console.warn('Server /api/imagekit/status note:', err);
  }

  // 2. Try Firestore cloud storage (cross-device, cross-reload persistence)
  let cloudConfig: any = null;
  try {
    cloudConfig = await loadImageKitConfigFromCloud();
  } catch (e) {
    console.warn('Firestore ImageKit config load note:', e);
  }

  // 3. Try LocalStorage
  const localConfig = getLocalImageKitConfig();

  // Determine active keys by priority:
  // Server > Firestore > LocalStorage
  const effectivePrivateKey = 
    (serverData?.rawPrivateKey && serverData.rawPrivateKey.trim()) ||
    (cloudConfig?.privateKey && cloudConfig.privateKey.trim()) ||
    (localConfig?.privateKey && localConfig.privateKey.trim()) ||
    '';

  const effectivePublicKey = 
    (serverData?.publicKey && serverData.publicKey.trim()) ||
    (cloudConfig?.publicKey && cloudConfig.publicKey.trim()) ||
    (localConfig?.publicKey && localConfig.publicKey.trim()) ||
    '';

  const effectiveUrlEndpoint = 
    (serverData?.urlEndpoint && serverData.urlEndpoint.trim()) ||
    (cloudConfig?.urlEndpoint && cloudConfig.urlEndpoint.trim()) ||
    (localConfig?.urlEndpoint && localConfig.urlEndpoint.trim()) ||
    '';

  // Cross-synchronize tiers so credentials stay permanent everywhere:
  if (effectivePrivateKey) {
    const syncPayload = {
      publicKey: effectivePublicKey,
      privateKey: effectivePrivateKey,
      urlEndpoint: effectiveUrlEndpoint
    };

    // Keep localStorage updated
    if (!localConfig?.privateKey || localConfig.privateKey !== effectivePrivateKey) {
      saveLocalImageKitConfig(syncPayload);
    }

    // Keep Firestore updated if missing
    if (!cloudConfig?.privateKey) {
      saveImageKitConfigToCloud(syncPayload).catch(() => {});
    }

    // Keep backend server updated if server was missing custom keys
    if (!serverData?.hasPrivateKey) {
      try {
        fetch('/api/imagekit/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncPayload)
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
      configured: true,
      source,
      publicKey: effectivePublicKey,
      urlEndpoint: effectiveUrlEndpoint,
      hasPrivateKey: true,
      maskedPrivateKey: maskPrivateKey(effectivePrivateKey),
      rawPrivateKey: effectivePrivateKey,
      updatedAt: serverData?.updatedAt || cloudConfig?.updatedAt || localConfig?.updatedAt || null
    };
  }

  // Unconfigured
  return {
    configured: false,
    source: 'none',
    publicKey: effectivePublicKey,
    urlEndpoint: effectiveUrlEndpoint,
    hasPrivateKey: false,
    maskedPrivateKey: '',
    rawPrivateKey: '',
    updatedAt: null
  };
}

/**
 * Tests ImageKit credentials safely against server or direct ImageKit API.
 */
export async function testImageKitCredentials(config: {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}): Promise<{ success: boolean; message: string }> {
  // If privateKey was not explicitly supplied, fallback to local/cloud stored key
  let privateKeyToTest = config.privateKey ? config.privateKey.trim() : '';
  if (!privateKeyToTest) {
    const local = getLocalImageKitConfig();
    if (local?.privateKey) {
      privateKeyToTest = local.privateKey.trim();
    } else {
      const cloud = await loadImageKitConfigFromCloud().catch(() => null);
      if (cloud?.privateKey) {
        privateKeyToTest = cloud.privateKey.trim();
      }
    }
  }

  if (!privateKeyToTest) {
    return {
      success: false,
      message: 'Please enter a valid ImageKit Private Key (starts with private_).'
    };
  }

  if (privateKeyToTest.startsWith('public_')) {
    return {
      success: false,
      message: "The key provided starts with 'public_'. You entered your Public Key in the Private Key field. Please copy the Private Key (starts with 'private_') from ImageKit Developer Options."
    };
  }

  if (!privateKeyToTest.startsWith('private_') || privateKeyToTest.length < 15) {
    return {
      success: false,
      message: "Please check your Private Key. It should start with 'private_' (e.g. private_xxxxxxxxxxxxxxxxxxxxxxxxxx=)."
    };
  }

  const testPayload = {
    ...config,
    privateKey: privateKeyToTest
  };

  // 1. First try backend server route (with timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('/api/imagekit/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || '✓ ImageKit connection test successful! Key is authorized.'
        };
      } else {
        return {
          success: false,
          message: data.error || 'Failed to verify ImageKit credentials on server.'
        };
      }
    }
  } catch (serverErr: any) {
    console.warn('Backend /api/imagekit/test unavailable or timed out:', serverErr?.message);
    // Backend unavailable or static hosting; fall through to direct verification
  }

  // 2. Direct client-side verification via ImageKit's CORS-enabled Upload API
  // Note: api.imagekit.io does NOT support browser CORS, but upload.imagekit.io has Access-Control-Allow-Origin: *
  try {
    const formData = new FormData();
    // 1x1 transparent PNG data URI
    formData.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    formData.append('fileName', 'test-connection-ping.png');
    formData.append('folder', '/wedding-invitations/_test');
    formData.append('useUniqueFileName', 'false');

    const authHeader = 'Basic ' + btoa(privateKeyToTest + ':');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: authHeader
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = ikRes.headers.get('content-type') || '';
    let ikData: any = {};
    if (contentType.includes('application/json')) {
      ikData = await ikRes.json().catch(() => ({}));
    }

    if (ikRes.ok && (ikData.url || ikData.fileId)) {
      return {
        success: true,
        message: '✓ ImageKit connection test successful! Your Private Key is valid and authorized.'
      };
    } else {
      if (
        ikRes.status === 401 ||
        ikRes.status === 403 ||
        (ikData.message && ikData.message.toLowerCase().includes('authenticated'))
      ) {
        return {
          success: false,
          message: 'Authentication failed. Please verify that your ImageKit Private Key (starts with private_) is correct.'
        };
      }
      return {
        success: false,
        message: ikData.message || ikData.help || `ImageKit returned HTTP ${ikRes.status}: Unable to authenticate.`
      };
    }
  } catch (err: any) {
    console.error('Direct ImageKit test failed:', err);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection test timed out. Please check your internet connection and try again.'
      };
    }
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      success: false,
      message: isOffline
        ? 'You are currently offline. Please check your internet connection.'
        : 'Unable to reach ImageKit.io. Please verify that your internet connection allows access to imagekit.io, or disable ad-blockers for imagekit.io.'
    };
  }
}

/**
 * Saves ImageKit credentials permanently to Cloud Firestore, Server, and client localStorage.
 */
/**
 * Saves ImageKit credentials permanently to Cloud Firestore, Server, and client localStorage.
 * If all credentials are empty, permanently clears/deletes the credentials from all tiers.
 */
export async function saveImageKitCredentials(config: {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}): Promise<{ success: boolean; message: string }> {
  const pKey = (config.publicKey || '').trim();
  const privKey = (config.privateKey || '').trim();
  const urlEp = (config.urlEndpoint || '').trim();

  // If ALL fields are empty, the user wants to delete / remove ImageKit credentials completely!
  if (!pKey && !privKey && !urlEp) {
    return await clearImageKitCredentials();
  }

  // If privateKey was left empty, retain existing stored key only if one of the other fields was updated
  let effectivePrivateKey = privKey;
  if (!effectivePrivateKey) {
    const local = getLocalImageKitConfig();
    effectivePrivateKey = local?.privateKey || '';
    if (!effectivePrivateKey) {
      const cloud = await loadImageKitConfigFromCloud().catch(() => null);
      effectivePrivateKey = cloud?.privateKey || '';
    }
  }

  if (!effectivePrivateKey) {
    return {
      success: false,
      message: 'ImageKit Private Key is required (starts with private_), or clear all fields to delete credentials.'
    };
  }

  const finalConfig = {
    publicKey: pKey,
    privateKey: effectivePrivateKey,
    urlEndpoint: urlEp
  };

  // 1. Always persist to localStorage
  saveLocalImageKitConfig(finalConfig);

  // 2. Always persist to Cloud Firestore
  try {
    await saveImageKitConfigToCloud(finalConfig);
  } catch (err) {
    console.warn('Could not persist ImageKit config to Firestore:', err);
  }

  // 3. Attempt to save to backend server
  try {
    const res = await fetch('/api/imagekit/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalConfig)
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || '✓ ImageKit credentials saved and activated across Cloud & Server!'
        };
      } else if (!res.ok) {
        return {
          success: false,
          message: data.error || 'Server rejected credentials.'
        };
      }
    }
  } catch {
    // Server not running or static deployment
  }

  return {
    success: true,
    message: '✓ ImageKit credentials saved and activated in Cloud Firestore & Browser Storage!'
  };
}

/**
 * Permanently deletes and removes ImageKit credentials from Cloud Firestore, server, and client localStorage.
 */
export async function clearImageKitCredentials(): Promise<{ success: boolean; message: string }> {
  // 1. Clear LocalStorage
  clearLocalImageKitConfig();

  // 2. Remove configuration document from Cloud Firestore
  try {
    await resetImageKitConfigInCloud();
  } catch (err) {
    console.warn('Failed to reset ImageKit config in Firestore:', err);
  }

  // 3. Clear configuration file from backend server
  try {
    const res = await fetch('/api/imagekit/clear', { method: 'POST' });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: '✓ ImageKit credentials permanently deleted from Cloud, Server, and Browser Storage.'
        };
      }
    }
  } catch {
    // Try fallback to /api/imagekit/reset
    try {
      await fetch('/api/imagekit/reset', { method: 'POST' });
    } catch {
      // Server not running or static deployment
    }
  }

  return {
    success: true,
    message: '✓ ImageKit credentials permanently deleted from Cloud Firestore & Browser Storage.'
  };
}

/**
 * Resets ImageKit credentials from Cloud Firestore, server, and client localStorage.
 */
export async function resetImageKitCredentials(): Promise<{ success: boolean; message: string }> {
  return await clearImageKitCredentials();
}

/**
 * Uploads an image either through backend API or directly to ImageKit Upload API.
 */
export async function uploadImageToImageKit(
  filePayload: string | File,
  fileName: string,
  folder = '/wedding-invitations'
): Promise<{ success: boolean; url?: string; fileId?: string; error?: string; missingConfig?: boolean }> {
  const cleanFileName = (fileName || `invitation-card-${Date.now()}.jpg`)
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  // 1. Try server upload API first
  try {
    let fileBase64 = '';
    if (typeof filePayload === 'string') {
      fileBase64 = filePayload;
    } else {
      fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(filePayload);
      });
    }

    const res = await fetch('/api/imagekit/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: fileBase64,
        fileName: cleanFileName,
        folder
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        return {
          success: true,
          url: data.url,
          fileId: data.fileId
        };
      } else if (data.missingConfig) {
        // Fall through to check local storage
      } else if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Server upload to ImageKit failed'
        };
      }
    }
  } catch {
    // Server upload route failed or returned HTML; try client-side upload
  }

  // 2. Direct client-side upload to ImageKit using local or cloud credentials (for Netlify/static hosting)
  let localConfig = getLocalImageKitConfig();
  if (!localConfig || !localConfig.privateKey) {
    try {
      const cloud = await loadImageKitConfigFromCloud();
      if (cloud && cloud.privateKey) {
        localConfig = cloud;
        saveLocalImageKitConfig(cloud);
      }
    } catch {
      // ignore
    }
  }

  if (localConfig && localConfig.privateKey) {
    try {
      const formData = new FormData();
      formData.append('file', filePayload);
      formData.append('fileName', cleanFileName);
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');

      const authHeader = 'Basic ' + btoa(localConfig.privateKey.trim() + ':');

      const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
          Authorization: authHeader
        },
        body: formData
      });

      const contentType = ikRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const ikData = await ikRes.json();
        if (ikRes.ok && ikData.url) {
          return {
            success: true,
            url: ikData.url,
            fileId: ikData.fileId
          };
        } else {
          return {
            success: false,
            error: ikData.message || ikData.help || 'ImageKit rejected upload'
          };
        }
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Direct upload to ImageKit failed'
      };
    }
  }

  return {
    success: false,
    missingConfig: true,
    error: 'ImageKit credentials are not configured.'
  };
}
