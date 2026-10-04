import React, { useState } from 'react';
import { Play, Download, Maximize2, Cloud, Film, X, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface VideoBlessingPlayerProps {
  videoUrl: string;
  authorName: string;
  relationship?: string;
  duration?: number;
  inline?: boolean;
}

export const VideoBlessingPlayer: React.FC<VideoBlessingPlayerProps> = ({
  videoUrl,
  authorName,
  relationship,
  duration,
  inline = true
}) => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="mt-2.5">
      {hasError ? (
        <div className="aspect-video max-h-48 w-full bg-slate-900 border border-amber-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 text-slate-300">
          <AlertCircle className="w-6 h-6 text-amber-400" />
          <p className="font-serif text-xs text-slate-200">
            Video playback unavailable or format unsupported in this browser
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-sky-950/60 hover:bg-sky-900 text-sky-300 text-[11px] rounded-lg border border-sky-700/50 transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Directly</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setHasError(false);
                setIsPlayingInline(true);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-lg border border-slate-600 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : inline && !isPlayingInline ? (
        <div
          onClick={() => setIsPlayingInline(true)}
          className="group relative aspect-video max-h-48 w-full bg-slate-950 rounded-xl overflow-hidden cursor-pointer border border-[#c8d7e3] shadow-xs flex items-center justify-center transition hover:border-[#3A5A74]"
        >
          {/* Subtle video background preview */}
          <video
            src={videoUrl}
            preload="metadata"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition group-hover:scale-105"
          />

          {/* Centered Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#3A5A74]/90 group-hover:bg-[#274155] text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 border border-white/40 backdrop-blur-xs">
              <Play className="w-5 h-5 fill-white text-white translate-x-0.5" />
            </div>
          </div>

          {/* Bottom Video Badge & Info */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <div className="flex items-center space-x-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-serif text-white">
              <Film className="w-3 h-3 text-sky-300" />
              <span>Captured Moment</span>
            </div>
            <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-200">
              <Cloud className="w-2.5 h-2.5 text-sky-300" />
              <span>R2</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video max-h-56 w-full bg-black rounded-xl overflow-hidden border border-[#c8d7e3] shadow-xs">
          <video
            src={videoUrl}
            controls
            autoPlay={isPlayingInline}
            playsInline
            onError={() => setHasError(true)}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Quick Action links */}
      <div className="flex items-center justify-between text-[11px] font-serif text-[#64748b] mt-1.5 px-0.5">
        <button
          type="button"
          onClick={() => setIsOpenModal(true)}
          className="inline-flex items-center space-x-1 hover:text-[#3A5A74] transition"
        >
          <Maximize2 className="w-3 h-3 text-[#3A5A74]" />
          <span>Watch Fullscreen</span>
        </button>

        <a
          href={videoUrl}
          download={`wedding_blessing_${authorName.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 hover:text-[#3A5A74] transition"
          title="Download keepsake video"
        >
          <Download className="w-3 h-3 text-[#3A5A74]" />
          <span>Save Video</span>
        </a>
      </div>

      {/* Fullscreen Player Modal */}
      {isOpenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsOpenModal(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <span className="text-[#c5a059] text-xs">❦</span>
                <span className="font-serif font-bold text-sm tracking-wide">
                  {authorName}'s Captured Moment
                </span>
                {relationship && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-serif bg-slate-800 text-slate-300 border border-slate-700">
                    {relationship}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                onError={() => setHasError(true)}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-serif">
              <div className="flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span>Stored on Cloudflare R2</span>
              </div>
              <a
                href={videoUrl}
                download={`wedding_blessing_${authorName.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-sky-300 hover:text-sky-200 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Keepsake</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
