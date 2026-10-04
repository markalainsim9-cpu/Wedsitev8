/**
 * Client-side video compression and optimization utility for wedding media keepsakes.
 * Compresses videos to high-quality 720p HD (1.25 Mbps) with 64 kbps audio before uploading to Cloudflare R2,
 * saving ~75% to 85% cloud storage space while preserving crisp visual clarity.
 */

export interface VideoCompressionOptions {
  maxDimension?: number;       // Default: 1280 (720p HD standard)
  videoBitrate?: number;       // Default: 1,250,000 (1.25 Mbps)
  audioBitrate?: number;       // Default: 64,000 (64 kbps voice)
  targetFps?: number;          // Default: 30
  onProgress?: (progress: number, details?: { currentSeconds: number; totalSeconds: number }) => void;
  signal?: AbortSignal;
}

export interface VideoCompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  durationSeconds: number;
  width: number;
  height: number;
  wasCompressed: boolean;
}

/**
 * Checks if the current browser environment supports client-side video transcoding via MediaRecorder & Canvas.
 */
export function isClientCompressionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const hasMediaRecorder = typeof window.MediaRecorder !== 'undefined';
  const hasCanvas = typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function';
  return hasMediaRecorder && hasCanvas;
}

/**
 * Format bytes into readable human format (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Compresses a video File or Blob client-side to 720p HD (~1.25 Mbps).
 * If the file is already under `skipIfUnderBytes` (default 12MB) or if compression
 * does not yield savings, returns the original file.
 */
export async function compressVideoFile(
  file: File | Blob,
  options: VideoCompressionOptions = {},
  skipIfUnderBytes: number = 12 * 1024 * 1024 // 12 MB threshold
): Promise<VideoCompressionResult> {
  const originalSize = file.size;

  // 1. If file is already small (e.g. <= 12MB), skip compression to save processing time
  if (originalSize <= skipIfUnderBytes || !isClientCompressionSupported()) {
    const defaultDuration = await getVideoMetadata(file).catch(() => ({ duration: 0, width: 0, height: 0 }));
    return {
      blob: file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      durationSeconds: defaultDuration.duration,
      width: defaultDuration.width,
      height: defaultDuration.height,
      wasCompressed: false,
    };
  }

  const {
    maxDimension = 1280,
    videoBitrate = 1_250_000,
    audioBitrate = 64_000,
    targetFps = 30,
    onProgress,
    signal,
  } = options;

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = objectUrl;
  video.playsInline = true;
  video.muted = false; // Need non-muted for audio graph capture (silenced via destination)
  video.volume = 1.0;
  video.crossOrigin = 'anonymous';
  video.preload = 'auto';

  let audioCtx: AudioContext | null = null;

  try {
    // Wait for video metadata
    await new Promise<void>((resolve, reject) => {
      const handleLoaded = () => {
        cleanupListeners();
        resolve();
      };
      const handleError = () => {
        cleanupListeners();
        reject(new Error('Failed to load video file for compression'));
      };
      const cleanupListeners = () => {
        video.removeEventListener('loadedmetadata', handleLoaded);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('loadedmetadata', handleLoaded);
      video.addEventListener('error', handleError);
      video.load();
    });

    const duration = video.duration || 1;
    const rawW = video.videoWidth || 1280;
    const rawH = video.videoHeight || 720;

    // Calculate dimensions scaled proportionally so max dimension is at most 1280
    let targetW = rawW;
    let targetH = rawH;

    if (Math.max(rawW, rawH) > maxDimension) {
      if (rawW >= rawH) {
        targetW = maxDimension;
        targetH = Math.round((rawH * maxDimension) / rawW);
      } else {
        targetH = maxDimension;
        targetW = Math.round((rawW * maxDimension) / rawH);
      }
    }

    // Dimension integers must be even for standard video encoders
    targetW = Math.max(2, Math.floor(targetW / 2) * 2);
    targetH = Math.max(2, Math.floor(targetH / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    // Set up silent Web Audio routing to capture audio without playing to speakers
    let audioTrack: MediaStreamTrack | null = null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaElementSource(video);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        // Do NOT connect to audioCtx.destination, so speakers remain silent
        if (dest.stream.getAudioTracks().length > 0) {
          audioTrack = dest.stream.getAudioTracks()[0];
        }
      }
    } catch (audioErr) {
      console.warn('Silent WebAudio routing note:', audioErr);
      // Fallback: Check if captureStream on video provides an audio track
      try {
        const vStream = (video as any).captureStream ? (video as any).captureStream() : null;
        if (vStream && vStream.getAudioTracks().length > 0) {
          audioTrack = vStream.getAudioTracks()[0];
        }
      } catch {
        // Continue even if audio cannot be captured
      }
    }

    // Create canvas stream
    const canvasStream = canvas.captureStream(targetFps);
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (audioTrack) {
      combinedTracks.push(audioTrack);
    }
    const combinedStream = new MediaStream(combinedTracks);

    // Determine optimal supported MIME type
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      mimeType = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
      audioBitsPerSecond: audioBitrate,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      let animFrameId: number;
      let isAborted = false;

      const cleanup = () => {
        cancelAnimationFrame(animFrameId);
        video.pause();
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
      };

      const onAbort = () => {
        isAborted = true;
        cleanup();
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        reject(new Error('Compression aborted'));
      };

      if (signal) {
        signal.addEventListener('abort', onAbort);
      }

      recorder.onstop = () => {
        cleanup();
        if (isAborted) return;
        const cleanType = mimeType.split(';')[0].trim() || 'video/webm';
        const finalBlob = new Blob(chunks, { type: cleanType });
        resolve(finalBlob);
      };

      recorder.onerror = (recErr) => {
        cleanup();
        reject(recErr);
      };

      // Frame rendering loop
      const renderLoop = () => {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, targetW, targetH);

        const currentSec = video.currentTime;
        const progress = Math.min(0.99, currentSec / duration);
        if (onProgress) {
          onProgress(progress, { currentSeconds: currentSec, totalSeconds: duration });
        }

        animFrameId = requestAnimationFrame(renderLoop);
      };

      video.onended = () => {
        if (onProgress) onProgress(1.0, { currentSeconds: duration, totalSeconds: duration });
        if (recorder.state === 'recording') {
          setTimeout(() => {
            recorder.stop();
          }, 200);
        }
      };

      // Start recording and playback
      recorder.start(500);
      video.play().then(() => {
        renderLoop();
      }).catch((playErr) => {
        cleanup();
        reject(playErr);
      });
    });

    // Verify compressed output
    if (compressedBlob.size > 0 && compressedBlob.size < originalSize) {
      const savedPercent = Math.round(((originalSize - compressedBlob.size) / originalSize) * 100);
      return {
        blob: compressedBlob,
        originalSize,
        compressedSize: compressedBlob.size,
        savedPercent,
        durationSeconds: duration,
        width: targetW,
        height: targetH,
        wasCompressed: true,
      };
    }

    // If compressed output is somehow not smaller, return original
    return {
      blob: file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      durationSeconds: duration,
      width: rawW,
      height: rawH,
      wasCompressed: false,
    };
  } catch (err) {
    console.warn('Client-side video compression fallback:', err);
    // Return original file if transcoding is not supported on this device/file
    return {
      blob: file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      durationSeconds: 0,
      width: 0,
      height: 0,
      wasCompressed: false,
    };
  } finally {
    if (audioCtx && audioCtx.state !== 'closed') {
      try {
        audioCtx.close();
      } catch {}
    }
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Extracts basic metadata (duration, resolution) from a video file.
 */
export function getVideoMetadata(file: File | Blob): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration || 0,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video metadata'));
    };
  });
}
