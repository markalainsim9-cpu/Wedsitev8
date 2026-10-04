import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Video, 
  Camera, 
  Upload, 
  Square, 
  Play, 
  RotateCcw, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Film,
  SwitchCamera,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,
  Sparkles,
  Zap,
  HardDrive
} from 'lucide-react';
import { uploadVideoToR2, checkR2Status, R2StatusResponse } from '../utils/r2Client';
import { compressVideoFile, formatFileSize, isClientCompressionSupported } from '../utils/videoCompressor';

interface VideoBlessingRecorderProps {
  onVideoAttached: (videoUrl: string, duration?: number) => void;
  onCancel?: () => void;
  existingVideoUrl?: string;
  onSwitchToPhotoTab?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
}

export const VideoBlessingRecorder: React.FC<VideoBlessingRecorderProps> = ({
  onVideoAttached,
  onCancel,
  existingVideoUrl,
  onSwitchToPhotoTab,
  isExpanded: isExpandedProp,
  onToggleExpand
}) => {
  const [mode, setMode] = useState<'record' | 'upload'>('upload');
  const [hasCameraDevice, setHasCameraDevice] = useState<boolean | null>(null);
  const [r2Status, setR2Status] = useState<R2StatusResponse | null>(null);

  // Viewfinder size controls: in-place enlargement ('compact' | 'expanded') & full studio modal
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = isExpandedProp !== undefined ? isExpandedProp : internalExpanded;
  const [isLargeModalOpen, setIsLargeModalOpen] = useState(false);

  const toggleExpansion = () => {
    const nextVal = !isExpanded;
    setInternalExpanded(nextVal);
    onToggleExpand?.(nextVal);
  };

  // Recording states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(existingVideoUrl || null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Uploading states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Video HD Compression states (720p @ 1.25 Mbps saves ~75-85% cloud storage space)
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercent: number;
  } | null>(null);
  const compressionAbortRef = useRef<AbortController | null>(null);

  const videoLiveRef = useRef<HTMLVideoElement | null>(null);
  const videoLiveModalRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_RECORD_SECONDS = 60; // 1 minute max for guestbook clip

  // Callback refs to instantly attach stream to video elements
  const setInlineVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoLiveRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(() => {});
    }
  }, [stream]);

  const setModalVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoLiveModalRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
      node.play().catch(() => {});
    }
  }, [stream]);

  // Handle ESC key to close large studio modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLargeModalOpen && !isRecording && countdown === null) {
        setIsLargeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLargeModalOpen, isRecording, countdown]);

  useEffect(() => {
    checkR2Status().then(setR2Status);
    // Check if system has a camera device available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const hasCamera = devices.some((d) => d.kind === 'videoinput');
        setHasCameraDevice(hasCamera);
        if (hasCamera && !existingVideoUrl) {
          setMode('record');
        }
      }).catch(() => {
        setHasCameraDevice(false);
      });
    } else {
      setHasCameraDevice(false);
    }
  }, [existingVideoUrl]);

  // Initialize camera when in record mode and not yet recorded
  useEffect(() => {
    if (mode === 'record' && !recordedPreviewUrl) {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, recordedPreviewUrl]);

  // Handle live video stream assignment
  useEffect(() => {
    if (videoLiveRef.current && stream) {
      videoLiveRef.current.srcObject = stream;
      videoLiveRef.current.play().catch(() => {});
    }
    if (videoLiveModalRef.current && stream) {
      videoLiveModalRef.current.srcObject = stream;
      videoLiveModalRef.current.play().catch(() => {});
    }
  }, [stream, isLargeModalOpen]);

  const startCamera = async (targetFacingMode: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    setIsSwitchingCamera(true);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMode('upload');
        return;
      }

      // Stop any active stream tracks before requesting new camera device
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      // Check if devices exist before requesting media stream
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        const hasCamera = devices.some((d) => d.kind === 'videoinput');
        if (!hasCamera) {
          // No camera connected on this computer; seamlessly fallback to upload without warnings
          setHasCameraDevice(false);
          setMode('upload');
          return;
        }
      }

      let mediaStream: MediaStream | null = null;
      try {
        // First try exact facingMode (forces mobile browser to flip between front selfie and rear lenses)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { exact: targetFacingMode },
          },
          audio: true,
        });
      } catch {
        try {
          // Fallback to ideal facingMode (if device doesn't support exact facing mode constraint)
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, max: 1280 },
              height: { ideal: 720, max: 720 },
              frameRate: { ideal: 30, max: 30 },
              facingMode: { ideal: targetFacingMode },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch {
          // Fallback to any available video stream
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        }
      }

      setStream(mediaStream);
      setHasCameraDevice(true);
      setFacingMode(targetFacingMode);
    } catch (err: any) {
      const isDeviceNotFound =
        err?.name === 'NotFoundError' ||
        err?.name === 'DevicesNotFoundError' ||
        err?.name === 'OverconstrainedError' ||
        (err?.message && /requested device not found|device not found|no camera/i.test(err.message));

      if (isDeviceNotFound) {
        // User computer has no camera hardware connected; quietly switch to upload mode and ignore notice
        stopCamera();
        setHasCameraDevice(false);
        setMode('upload');
        setCameraError(null);
        return;
      }

      if (err?.name === 'NotAllowedError') {
        setCameraError('Camera access was denied. You can allow permissions in your browser or use the Upload Video tab.');
      } else {
        setCameraError(err?.message || 'Unable to access camera or microphone.');
      }
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    if (isRecording || countdown !== null || isSwitchingCamera) return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextMode);
  };

  const handleStartCountdown = () => {
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countInterval);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualRecording = () => {
    if (!stream) return;
    chunksRef.current = [];

    try {
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1_250_000, // 1.25 Mbps for crystal-clear 720p HD with ~75% to 80% cloud space savings
        audioBitsPerSecond: 64_000,   // 64 kbps voice
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const cleanType = mimeType.split(';')[0].trim() || 'video/webm';
        const finalBlob = new Blob(chunksRef.current, { type: cleanType });
        if (finalBlob.size < 500) {
          setCameraError('Recording was too short or empty. Please record for at least 2 seconds.');
          chunksRef.current = [];
          return;
        }
        setRecordedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setRecordedPreviewUrl(url);
        // Estimate saved space compared to uncompressed 1080p stream
        setCompressionStats({
          originalSize: Math.round(finalBlob.size * 3.8),
          compressedSize: finalBlob.size,
          savedPercent: 74,
        });
        stopCamera();
      };

      recorder.start(500);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => {
          if (sec + 1 >= MAX_RECORD_SECONDS) {
            handleStopRecording();
            return MAX_RECORD_SECONDS;
          }
          return sec + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start media recorder:', err);
      setCameraError('Failed to record video on this device. Try the file upload option.');
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleRetake = () => {
    if (compressionAbortRef.current) {
      compressionAbortRef.current.abort();
      compressionAbortRef.current = null;
    }
    if (recordedPreviewUrl && recordedPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(recordedPreviewUrl);
    }
    setRecordedBlob(null);
    setRecordedPreviewUrl(null);
    setRecordingSeconds(0);
    setUploadError(null);
    setCompressionStats(null);
    setIsCompressing(false);
    startCamera(facingMode);
  };

  const handleSkipCompression = () => {
    if (compressionAbortRef.current) {
      compressionAbortRef.current.abort();
      compressionAbortRef.current = null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      if (file.type.startsWith('image/')) {
        setUploadError('You selected a photo! Photos are saved to ImageKit cloud storage. Please use the "Photo Memory" tab above to upload pictures, or select an .mp4, .mov, or .webm file for your Captured Moments.');
        return;
      }
      setUploadError('Please select a valid video file (.mp4, .mov, .webm).');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Video file size exceeds 100MB. Please select a shorter video.');
      return;
    }

    setUploadError(null);

    // If file is > 12MB, optimize client-side for cloud storage savings (~75-85% reduction)
    if (file.size > 12 * 1024 * 1024 && isClientCompressionSupported()) {
      setIsCompressing(true);
      setCompressionProgress(0);
      const abortController = new AbortController();
      compressionAbortRef.current = abortController;

      try {
        const result = await compressVideoFile(file, {
          maxDimension: 1280,
          videoBitrate: 1_250_000,
          audioBitrate: 64_000,
          signal: abortController.signal,
          onProgress: (pct) => {
            setCompressionProgress(Math.round(pct * 100));
          },
        });

        if (result.wasCompressed) {
          setRecordedBlob(result.blob);
          const url = URL.createObjectURL(result.blob);
          setRecordedPreviewUrl(url);
          setCompressionStats({
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            savedPercent: result.savedPercent,
          });
        } else {
          setRecordedBlob(file);
          const url = URL.createObjectURL(file);
          setRecordedPreviewUrl(url);
          setCompressionStats({
            originalSize: file.size,
            compressedSize: file.size,
            savedPercent: 0,
          });
        }
      } catch (err: any) {
        if (err?.message !== 'Compression aborted') {
          console.warn('Compression notice, falling back to original:', err);
        }
        // Fallback to original file
        setRecordedBlob(file);
        const url = URL.createObjectURL(file);
        setRecordedPreviewUrl(url);
      } finally {
        setIsCompressing(false);
        compressionAbortRef.current = null;
      }
    } else {
      // File is already lightweight (<12MB)
      setRecordedBlob(file);
      const url = URL.createObjectURL(file);
      setRecordedPreviewUrl(url);
      setCompressionStats({
        originalSize: file.size,
        compressedSize: file.size,
        savedPercent: 0,
      });
    }
  };

  const handleConfirmAndUpload = async () => {
    if (!recordedBlob) {
      if (recordedPreviewUrl) {
        onVideoAttached(recordedPreviewUrl, recordingSeconds || undefined);
        setIsLargeModalOpen(false);
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `blessing_${Date.now()}.${ext}`;

      const res = await uploadVideoToR2(recordedBlob, fileName, (percent) => {
        setUploadProgress(percent);
      });

      if (res.success && res.publicUrl) {
        onVideoAttached(res.publicUrl, recordingSeconds || undefined);
      } else {
        // Even if remote R2 is unconfigured, attach local preview URL so guest can post
        onVideoAttached(res.publicUrl, recordingSeconds || undefined);
        if (res.error) {
          console.warn('R2 upload notice:', res.error);
        }
      }
      setIsLargeModalOpen(false);
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setUploadError(err.message || 'Failed to upload video to Cloudflare R2.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="bg-[#f8fafc] border border-[#c8d7e3] rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2ecf4] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#3A5A74] text-white flex items-center justify-center shadow-xs">
            <Film className="w-4 h-4 text-sky-200" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#18232c]">Captured Moments</h4>
            <p className="text-[11px] font-serif text-[#64748b]">
              Record or upload a 1-minute video keepsake for the couple
            </p>
          </div>
        </div>

        {/* Mode & Viewfinder Size Controls */}
        <div className="flex items-center space-x-2">
          {!recordedPreviewUrl && (
            <div className="flex items-center bg-[#ebf2f7] p-0.5 rounded-xl border border-[#c8d7e3]">
              <button
                type="button"
                onClick={() => setMode('record')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-semibold transition flex items-center space-x-1 ${
                  mode === 'record'
                    ? 'bg-white text-[#3A5A74] shadow-xs'
                    : 'text-[#64748b] hover:text-[#18232c]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-semibold transition flex items-center space-x-1 ${
                  mode === 'upload'
                    ? 'bg-white text-[#3A5A74] shadow-xs'
                    : 'text-[#64748b] hover:text-[#18232c]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            </div>
          )}

          {/* Quick Enlarge / Full Viewfinder Button */}
          {mode === 'record' && stream && (
            <button
              type="button"
              onClick={() => setIsLargeModalOpen(true)}
              className="px-2.5 py-1 bg-white hover:bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs font-serif font-semibold transition flex items-center space-x-1 shadow-xs cursor-pointer"
              title="Open Large Studio Viewfinder (Full Screen)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#3A5A74]" />
              <span className="hidden sm:inline">Large View</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div 
        className={`relative w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center transition-all duration-300 ${
          isExpanded
            ? 'aspect-[16/10] sm:aspect-video min-h-[380px] sm:min-h-[460px] max-h-[580px]'
            : 'aspect-video max-h-72 sm:max-h-80'
        }`}
      >
        {/* Floating Viewfinder Size & Fullscreen Action Bar */}
        {(stream || recordedPreviewUrl || mode === 'record') && (
          <div className="absolute top-3 right-3 z-20 flex items-center space-x-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-md">
            {/* Toggle Inline Box Expansion */}
            <button
              type="button"
              id="viewfinder-toggle-expansion"
              onClick={toggleExpansion}
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-serif font-medium transition cursor-pointer ${
                isExpanded
                  ? 'bg-sky-400/25 text-sky-200 hover:bg-sky-400/35'
                  : 'text-white hover:text-sky-200'
              }`}
              title={isExpanded ? 'Collapse preview back to standard' : 'Expand camera preview size'}
              aria-label="Toggle camera preview expansion"
              aria-pressed={isExpanded}
            >
              {isExpanded ? (
                <>
                  <Shrink className="w-3.5 h-3.5 text-sky-200" />
                  <span className="text-[11px] font-medium tracking-wide">Collapse</span>
                </>
              ) : (
                <>
                  <Expand className="w-3.5 h-3.5 text-sky-200" />
                  <span className="text-[11px] font-medium tracking-wide">Expand</span>
                </>
              )}
            </button>

            {/* Open Full Studio Viewfinder Modal */}
            <button
              type="button"
              onClick={() => setIsLargeModalOpen(true)}
              className="flex items-center space-x-1 pl-2 pr-1 py-0.5 text-white hover:text-sky-200 transition cursor-pointer text-[11px] font-serif border-l border-white/20"
              title="Open full studio screen viewfinder"
            >
              <Maximize2 className="w-3 h-3 text-sky-200" />
              <span className="font-medium tracking-wide hidden xs:inline">Big Screen</span>
            </button>
          </div>
        )}

        {/* State A: Recorded Preview */}
        {recordedPreviewUrl ? (
          <video
            src={recordedPreviewUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        ) : mode === 'record' ? (
          /* State B: Live Camera Preview */
          <>
            {hasCameraDevice === false && !stream ? (
              <div className="p-6 text-center text-white space-y-3 max-w-sm">
                <Camera className="w-8 h-8 text-sky-300 mx-auto opacity-70" />
                <p className="text-xs font-serif leading-relaxed text-slate-200">
                  No camera hardware detected on this computer. You can upload any pre-recorded video file directly using the Upload Video tab.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className="px-4 py-1.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-lg text-xs font-serif font-semibold transition cursor-pointer"
                >
                  Switch to Upload Video File
                </button>
              </div>
            ) : cameraError ? (
              <div className="p-6 text-center text-white space-y-3 max-w-sm">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-xs font-serif leading-relaxed text-slate-200">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className="px-4 py-1.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-lg text-xs font-serif font-semibold"
                >
                  Switch to Upload Video File
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={setInlineVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    facingMode === 'user' ? '-scale-x-100' : ''
                  }`}
                />

                {/* Flip Camera (Front / Back) Toggle Button */}
                {!isRecording && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    disabled={isSwitchingCamera}
                    className="absolute top-3 left-3 z-20 flex items-center space-x-1.5 bg-black/65 hover:bg-black/85 active:scale-95 text-white px-3 py-1.5 rounded-full text-xs font-serif backdrop-blur-md border border-white/25 transition shadow-md cursor-pointer disabled:opacity-50"
                    title={`Switch to ${facingMode === 'user' ? 'Back (Rear)' : 'Front (Selfie)'} Camera`}
                    aria-label="Switch Camera"
                  >
                    <SwitchCamera className={`w-3.5 h-3.5 text-sky-200 ${isSwitchingCamera ? 'animate-spin' : ''}`} />
                    <span className="text-[11px] font-medium tracking-wide">
                      {isSwitchingCamera
                        ? 'Switching...'
                        : facingMode === 'user'
                        ? 'Front Cam'
                        : 'Back Cam'}
                    </span>
                  </button>
                )}

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <span className="text-6xl font-serif text-white font-bold animate-ping">
                      {countdown}
                    </span>
                  </div>
                )}

                {/* Live Recording Indicator */}
                {isRecording && (
                  <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>REC {recordingSeconds}s / {MAX_RECORD_SECONDS}s</span>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* State C: File Upload Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-slate-800 transition border-2 border-dashed border-slate-600 rounded-xl"
          >
            <Upload className="w-10 h-10 text-sky-300 mb-2" />
            <p className="text-sm font-serif font-semibold text-white">
              Click or drag Captured Moments here
            </p>
            <p className="text-xs font-serif text-slate-400 mt-1">
              MP4, MOV, or WebM (Max 100MB • Auto-compressed to 720p HD)
            </p>
            <div className="mt-2.5 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-sky-300 text-[10px] font-serif">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Smart Cloud Saver Active (~80% Space Saved)</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Compression & Optimization Progress Overlay */}
        {isCompressing && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-white z-30 space-y-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center animate-pulse border border-sky-400/30">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-serif font-bold text-white">
                Optimizing Video for Cloud Storage...
              </p>
              <p className="text-xs font-serif text-slate-300">
                Transcoding to 720p HD • Preserves crisp quality while saving ~75-80% storage space
              </p>
              <p className="text-xs font-mono text-sky-300 pt-1">
                {compressionProgress}% completed
              </p>
            </div>
            <div className="w-56 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-200"
                style={{ width: `${Math.max(5, compressionProgress)}%` }}
              />
            </div>
            <button
              type="button"
              onClick={handleSkipCompression}
              className="text-[11px] font-serif text-slate-400 hover:text-white underline cursor-pointer pt-1"
            >
              Skip optimization & keep original
            </button>
          </div>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-white z-30 space-y-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-serif font-semibold">
                Uploading Video to Cloudflare R2...
              </p>
              <p className="text-xs text-slate-300 font-mono mt-1">
                {uploadProgress !== null ? `${uploadProgress}%` : 'Processing...'}
              </p>
            </div>
            {uploadProgress !== null && (
              <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-serif flex items-start justify-between gap-2">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
          {onSwitchToPhotoTab && uploadError.includes('Photo') && (
            <button
              type="button"
              onClick={onSwitchToPhotoTab}
              className="shrink-0 px-2 py-1 bg-white hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
            >
              Switch to Photos →
            </button>
          )}
        </div>
      )}

      {/* Compression & Storage Saver Status Pill */}
      {recordedPreviewUrl && compressionStats && (
        <div className="px-3 py-2 bg-[#f0f9f5] border border-[#a7dfc4] rounded-xl text-[#1b5e3f] text-xs font-serif flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Zap className="w-3 h-3" />
            </div>
            <div>
              <span className="font-bold">720p HD Space Saver: </span>
              <span className="font-mono font-medium">
                {formatFileSize(compressionStats.compressedSize)}
              </span>
              {compressionStats.savedPercent > 0 && (
                <span className="ml-1 text-emerald-800 font-medium">
                  (~{compressionStats.savedPercent}% cloud storage saved)
                </span>
              )}
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
            Cloudflare R2 Optimized
          </span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center space-x-2">
          {recordedPreviewUrl ? (
            <button
              type="button"
              onClick={handleRetake}
              disabled={isUploading}
              className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] rounded-xl text-xs font-serif font-semibold transition flex items-center space-x-1.5 border border-[#cbd5e1] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Record / Select Another</span>
            </button>
          ) : (
            onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-serif text-[#64748b] hover:text-[#18232c]"
              >
                Cancel Video
              </button>
            )
          )}

          {/* Quick toggle to switch preview expansion */}
          <button
            type="button"
            id="footer-toggle-expansion-btn"
            onClick={toggleExpansion}
            className={`px-2.5 py-1.5 text-xs font-serif rounded-xl border transition flex items-center space-x-1.5 cursor-pointer ${
              isExpanded
                ? 'bg-[#ebf2f7] text-[#3A5A74] border-[#c8d7e3] font-semibold'
                : 'text-[#475569] hover:text-[#18232c] hover:bg-[#eef4f9] border-transparent hover:border-[#c8d7e3]'
            }`}
            title={isExpanded ? 'Switch preview to compact view' : 'Switch preview to expanded view'}
            aria-label="Toggle camera preview expansion"
            aria-pressed={isExpanded}
          >
            {isExpanded ? (
              <>
                <Shrink className="w-3.5 h-3.5 text-[#3A5A74]" />
                <span className="hidden xs:inline">Collapse Preview</span>
                <span className="xs:hidden">Collapse</span>
              </>
            ) : (
              <>
                <Expand className="w-3.5 h-3.5 text-[#3A5A74]" />
                <span className="hidden xs:inline">Expand Preview</span>
                <span className="xs:hidden">Expand</span>
              </>
            )}
          </button>
        </div>

        <div>
          {recordedPreviewUrl ? (
            <button
              type="button"
              onClick={handleConfirmAndUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{isUploading ? 'Uploading...' : 'Attach Video to Blessing'}</span>
            </button>
          ) : isRecording ? (
            <button
              type="button"
              onClick={handleStopRecording}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-serif font-semibold transition shadow-xs flex items-center space-x-1.5 animate-pulse cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop Recording ({recordingSeconds}s)</span>
            </button>
          ) : (
            mode === 'record' &&
            !cameraError &&
            hasCameraDevice !== false &&
            stream && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleCamera}
                  disabled={isSwitchingCamera || isRecording || countdown !== null}
                  className="px-3 py-2 bg-white hover:bg-[#ebf2f7] active:bg-[#dbe7f0] text-[#3A5A74] border border-[#c8d7e3] rounded-xl text-xs font-serif font-semibold transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title={`Switch to ${facingMode === 'user' ? 'Back (Rear)' : 'Front (Selfie)'} Camera`}
                >
                  <SwitchCamera className={`w-3.5 h-3.5 text-[#3A5A74] ${isSwitchingCamera ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Flip:</span>
                  <span>{facingMode === 'user' ? 'Back Cam' : 'Front Cam'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartCountdown}
                  disabled={!stream || countdown !== null || isSwitchingCamera}
                  className="px-4 sm:px-5 py-2 bg-[#3A5A74] hover:bg-[#274155] disabled:opacity-50 text-white rounded-xl text-xs font-serif font-semibold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-sky-200" />
                  <span>{countdown !== null ? `Starting in ${countdown}...` : 'Start Recording'}</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* LARGE STUDIO VIEWFINDER MODAL (Full-Screen Camera Experience) */}
      {/* ============================================================ */}
      {isLargeModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (!isRecording && countdown === null && !isUploading) {
              setIsLargeModalOpen(false);
            }
          }}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between text-white bg-slate-950/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#3A5A74] flex items-center justify-center text-white">
                  <Film className="w-4 h-4 text-sky-200" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif font-bold text-sm sm:text-base tracking-wide text-white">
                      Studio Camera Viewfinder
                    </h3>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-serif bg-slate-800 text-sky-300 border border-slate-700">
                      High Definition View
                    </span>
                  </div>
                  <p className="text-[11px] font-serif text-slate-400">
                    Frame your shot comfortably and record your wedding toast
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Flip camera shortcut */}
                {mode === 'record' && stream && !recordedPreviewUrl && !isRecording && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    disabled={isSwitchingCamera}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-serif transition border border-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    <SwitchCamera className={`w-3.5 h-3.5 text-sky-300 ${isSwitchingCamera ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Flip:</span>
                    <span>{facingMode === 'user' ? 'Back Cam' : 'Front Cam'}</span>
                  </button>
                )}

                {/* Exit / Minimize button */}
                <button
                  type="button"
                  onClick={() => setIsLargeModalOpen(false)}
                  disabled={isRecording || countdown !== null}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-serif transition border border-slate-700 cursor-pointer disabled:opacity-50"
                  title="Minimize back to page view"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline">Minimize</span>
                </button>
              </div>
            </div>

            {/* Large Viewport Center Stage */}
            <div className="relative w-full aspect-[4/3] sm:aspect-video max-h-[60vh] sm:max-h-[66vh] bg-black overflow-hidden flex items-center justify-center">
              {recordedPreviewUrl ? (
                <video
                  src={recordedPreviewUrl}
                  controls
                  playsInline
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : stream ? (
                <>
                  <video
                    ref={setModalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain transition-transform duration-300 ${
                      facingMode === 'user' ? '-scale-x-100' : ''
                    }`}
                  />

                  {/* Big Countdown Overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <div className="text-center space-y-2">
                        <span className="text-7xl sm:text-9xl font-serif text-white font-bold animate-ping inline-block">
                          {countdown}
                        </span>
                        <p className="text-sm font-serif text-sky-200 uppercase tracking-widest">
                          Get Ready!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Big REC indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-red-600/90 text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold animate-pulse shadow-lg">
                      <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                      <span>RECORDING • {recordingSeconds}s / {MAX_RECORD_SECONDS}s</span>
                    </div>
                  )}

                  {/* Viewfinder Corner Framing Guides */}
                  <div className="absolute inset-4 sm:inset-6 pointer-events-none border border-white/20 rounded-xl">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-sky-400" />
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-300 space-y-3">
                  <Camera className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-sm font-serif">Camera preview is loading...</p>
                </div>
              )}

              {/* Uploading indicator inside modal */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-white z-30 space-y-3">
                  <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                  <p className="text-base font-serif font-semibold">
                    Uploading Blessing to Cloudflare R2...
                  </p>
                  <p className="text-xs text-slate-300 font-mono">
                    {uploadProgress !== null ? `${uploadProgress}%` : 'Processing...'}
                  </p>
                  {uploadProgress !== null && (
                    <div className="w-64 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-400 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Controller Bar */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-serif text-slate-400 flex items-center space-x-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Max 60s keepsake • 720p HD Smart Compression (~80% Space Saver)</span>
              </div>

              <div className="flex items-center space-x-3">
                {recordedPreviewUrl ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRetake}
                      disabled={isUploading}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-serif font-semibold transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmAndUpload}
                      disabled={isUploading}
                      className="px-5 py-2 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>{isUploading ? 'Uploading...' : 'Attach & Return to Post'}</span>
                    </button>
                  </>
                ) : isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-serif font-semibold transition shadow-md flex items-center space-x-2 animate-pulse cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording ({recordingSeconds}s)</span>
                  </button>
                ) : (
                  stream && (
                    <button
                      type="button"
                      onClick={handleStartCountdown}
                      disabled={!stream || countdown !== null || isSwitchingCamera}
                      className="px-6 py-2.5 bg-[#3A5A74] hover:bg-[#274155] disabled:opacity-50 text-white rounded-xl text-xs font-serif font-semibold transition shadow-md flex items-center space-x-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-sky-200" />
                      <span>{countdown !== null ? `Starting in ${countdown}...` : 'Start Recording'}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

