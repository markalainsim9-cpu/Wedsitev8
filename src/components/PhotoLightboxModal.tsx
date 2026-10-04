import React, { useEffect } from 'react';
import { X, Download, ExternalLink, Calendar, User } from 'lucide-react';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  authorName?: string;
  relationship?: string;
  caption?: string;
  createdAt?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  authorName,
  relationship,
  caption,
  createdAt,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[90vh] bg-[#1e293b] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a]/90 border-b border-slate-700/80 text-white">
          <div className="flex items-center space-x-2">
            <span className="text-[#c5a059] text-xs">❦</span>
            <span className="font-serif font-semibold text-sm truncate">
              {authorName ? `${authorName}'s Photo Memory` : 'Keepsake Photo'}
            </span>
            {relationship && (
              <span className="text-[10px] font-serif bg-slate-800 text-sky-300 px-2 py-0.5 rounded-full border border-slate-700">
                {relationship}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Open full size"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High Resolution Image Body */}
        <div className="flex-1 overflow-auto bg-black flex items-center justify-center min-h-[300px] max-h-[70vh]">
          <img
            src={imageUrl}
            alt={caption || 'Guestbook Memory Photo'}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[70vh] object-contain select-none"
          />
        </div>

        {/* Footer with note & cloud badge */}
        <div className="px-4 py-3 bg-[#0f172a] border-t border-slate-800 text-slate-300 text-xs flex flex-wrap items-center justify-between gap-2">
          {caption ? (
            <p className="font-serif italic text-slate-200 truncate max-w-lg">
              "{caption}"
            </p>
          ) : (
            <span className="text-slate-400 font-serif italic">Wedding Keepsake Memory</span>
          )}

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">
              ImageKit CDN
            </span>
            {createdAt && (
              <span>
                {new Date(createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
