import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, X, Loader2, Cloud, Check, AlertCircle } from 'lucide-react';
import { uploadImageToImageKit } from '../lib/imagekitClient';

interface GuestbookPhotoUploaderProps {
  attachedImageUrl?: string;
  onImageAttached: (url: string) => void;
  onRemove: () => void;
  folder?: string;
  compact?: boolean;
}

export const GuestbookPhotoUploader: React.FC<GuestbookPhotoUploaderProps> = ({
  attachedImageUrl,
  onImageAttached,
  onRemove,
  folder = '/guestbook-photos',
  compact = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP, GIF).');
      return;
    }

    // Limit size to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setError('Image size should be under 25MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const cleanName = `gb_photo_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const result = await uploadImageToImageKit(file, cleanName, folder);

      if (result.success && result.url) {
        onImageAttached(result.url);
        setJustUploaded(true);
        setTimeout(() => setJustUploaded(false), 3000);
      } else {
        // Fallback: If ImageKit credentials need attention, provide preview URL
        const localPreviewUrl = URL.createObjectURL(file);
        onImageAttached(localPreviewUrl);
        setError(result.error || 'Notice: ImageKit upload could not be completed, using local preview.');
      }
    } catch (err: any) {
      console.error('Photo upload to ImageKit failed:', err);
      setError(err?.message || 'Failed to upload photo to ImageKit.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (attachedImageUrl) {
    return (
      <div className="p-3 bg-[#f3f7fa] border border-[#c8d7e3] rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-200">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#b8d5e8] shrink-0 bg-slate-100">
            <img
              src={attachedImageUrl}
              alt="Attached Memory"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-xs font-serif font-bold text-[#18232c] truncate">
                Photo Attached
              </span>
              <span className="text-[10px] font-serif bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded flex items-center space-x-1 border border-sky-200">
                <Cloud className="w-2.5 h-2.5 text-sky-600" />
                <span>ImageKit Cloud</span>
              </span>
            </div>
            <p className="text-[11px] font-serif text-[#475569] truncate">
              {justUploaded ? 'Successfully saved to ImageKit CDN' : 'Ready to be posted with your wish'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer shrink-0"
          title="Remove attached photo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full ${
          compact ? 'py-2 px-3' : 'py-2.5 px-3.5'
        } rounded-xl border border-dashed border-[#3A5A74]/35 bg-[#f7fafc] hover:bg-[#ebf2f7] hover:border-[#3A5A74] text-[#3A5A74] transition flex items-center justify-between text-xs font-serif font-medium cursor-pointer group shadow-2xs`}
      >
        <div className="flex items-center space-x-2">
          {isUploading ? (
            <Loader2 className="w-4 h-4 text-[#3A5A74] animate-spin" />
          ) : (
            <div className="w-6 h-6 rounded-md bg-[#3A5A74] text-white flex items-center justify-center group-hover:scale-105 transition">
              <ImageIcon className="w-3.5 h-3.5 text-sky-200" />
            </div>
          )}
          <span className="font-semibold text-[#18232c]">
            {isUploading ? 'Uploading to ImageKit CDN...' : 'Attach a Photo / Memory'}
          </span>
        </div>

        <span className="text-[10px] font-serif text-[#3A5A74] bg-[#ebf2f7] group-hover:bg-white px-2 py-0.5 rounded-full border border-[#c8d7e3] flex items-center space-x-1">
          <Cloud className="w-2.5 h-2.5 text-[#3A5A74]" />
          <span>ImageKit Storage</span>
        </span>
      </button>

      {error && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-serif text-rose-700 flex items-center space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
