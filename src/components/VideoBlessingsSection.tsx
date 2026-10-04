import React, { useState, useMemo } from 'react';
import { 
  Video, 
  Film, 
  Heart, 
  Send, 
  Check, 
  Sparkles, 
  User, 
  Users, 
  Lock, 
  Cloud, 
  Trash2,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  Camera,
  Maximize2,
  Layers,
  Zap,
  Pin
} from 'lucide-react';
import { EventConfig, GuestbookEntry } from '../types';
import { VideoBlessingRecorder } from './VideoBlessingRecorder';
import { VideoBlessingPlayer } from './VideoBlessingPlayer';
import { GuestbookPhotoUploader } from './GuestbookPhotoUploader';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { deleteVideoFromR2 } from '../utils/r2Client';

interface VideoBlessingsSectionProps {
  config: EventConfig;
  entries: GuestbookEntry[];
  onSubmitEntry: (entry: Omit<GuestbookEntry, 'id'>) => Promise<void> | void;
}

export const VideoBlessingsSection: React.FC<VideoBlessingsSectionProps> = ({
  config,
  entries,
  onSubmitEntry
}) => {
  // Uploader media type: 'video' (Cloudflare R2) or 'photo' (ImageKit)
  const [mediaUploadType, setMediaUploadType] = useState<'video' | 'photo'>('video');

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [videoDuration, setVideoDuration] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Video camera preview section expansion toggle
  const [isVideoPreviewExpanded, setIsVideoPreviewExpanded] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justPosted, setJustPosted] = useState(false);
  const [lastPostedType, setLastPostedType] = useState<'video' | 'photo'>('video');

  // Gallery filter: 'all' | 'video' | 'photo'
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'video' | 'photo'>('all');

  // Lightbox Modal state for full-screen photo viewing
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    authorName?: string;
    relationship?: string;
    caption?: string;
    createdAt?: string;
  } | null>(null);

  // Filter entries that have a valid videoUrl OR imageUrl
  const allMediaEntries = useMemo(() => {
    const map = new Map<string, GuestbookEntry>();
    for (const item of entries) {
      if (item && item.id && (item.videoUrl || item.imageUrl)) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const aF = Boolean(a.isFeatured);
      const bF = Boolean(b.isFeatured);
      if (aF !== bF) return aF ? -1 : 1;
      const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [entries]);

  const videoCount = useMemo(() => {
    return allMediaEntries.filter((item) => !!item.videoUrl).length;
  }, [allMediaEntries]);

  const photoCount = useMemo(() => {
    return allMediaEntries.filter((item) => !!item.imageUrl).length;
  }, [allMediaEntries]);

  const displayedEntries = useMemo(() => {
    if (galleryFilter === 'video') {
      return allMediaEntries.filter((item) => !!item.videoUrl);
    }
    if (galleryFilter === 'photo') {
      return allMediaEntries.filter((item) => !!item.imageUrl);
    }
    return allMediaEntries;
  }, [allMediaEntries, galleryFilter]);

  if (config.videoBlessingsEnabled === false) {
    return null;
  }

  const eyebrow = config.videoBlessingsEyebrow || 'Cinematic & Photographic Keepsakes';
  const title = config.videoBlessingsTitle || 'Video & Photo Blessings';
  const subtitle =
    config.videoBlessingsSubtitle ||
    'Record a live video toast (Cloudflare R2) or upload cherished photo memories (ImageKit CDN) for Mark & Karla.';

  const isFormValid =
    name.trim().length > 0 &&
    ((mediaUploadType === 'video' && !!videoUrl) ||
     (mediaUploadType === 'photo' && !!imageUrl.trim()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const isVideo = mediaUploadType === 'video';
      const fallbackMsg = isVideo
        ? 'Sent a video blessing with love and joy!'
        : 'Shared a cherished photo memory with love!';

      const entryPayload: Omit<GuestbookEntry, 'id'> = {
        name: name.trim(),
        relationship: relationship.trim() || 'Well-Wisher',
        message: message.trim() || fallbackMsg,
        createdAt: new Date().toISOString(),
        ...(isVideo && videoUrl ? { videoUrl: videoUrl.trim() } : {}),
        ...(isVideo && typeof videoDuration === 'number' && !isNaN(videoDuration) ? { videoDuration } : {}),
        ...(!isVideo && imageUrl ? { imageUrl: imageUrl.trim() } : {}),
      };

      await onSubmitEntry(entryPayload);

      setLastPostedType(mediaUploadType);
      setJustPosted(true);
      setName('');
      setRelationship('');
      setMessage('');
      setVideoUrl(undefined);
      setVideoDuration(undefined);
      setImageUrl('');
      
      // Auto-set gallery to show the newly posted item
      setGalleryFilter('all');
      setTimeout(() => setJustPosted(false), 6000);
    } catch (err) {
      console.error('Error posting media blessing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAttachedVideo = () => {
    if (videoUrl) {
      deleteVideoFromR2(videoUrl).catch(() => {});
    }
    setVideoUrl(undefined);
    setVideoDuration(undefined);
  };

  return (
    <section id="videos" className="romantic-stationery-card rounded-3xl p-6 sm:p-12 relative overflow-hidden">
      {/* Delicate Inner Stationery Gold Border */}
      <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none" />

      {/* Header Eyebrow & Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1.5">
          <span>❦</span>
          <span>{eyebrow}</span>
          <span>❦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-[#18232c] tracking-wide font-normal">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[#475569] font-serif italic text-sm sm:text-base mt-2 leading-relaxed">
            "{subtitle}"
          </p>
        )}
      </div>

      {/* Responsive Layout with Preview Expansion Support */}
      <div className={`grid grid-cols-1 ${isVideoPreviewExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8 items-start relative z-10 transition-all duration-300`}>
        {/* Left Column: Unified Video & Photo Blessing Uploader */}
        <div className={`${isVideoPreviewExpanded ? 'w-full' : 'lg:col-span-6'} bg-[#ffffff] border border-[#c8d7e3] rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 transition-all duration-300`}>
          <div className="flex flex-wrap items-center justify-between border-b border-[#e2ecf4] pb-3 gap-2">
            <div className="flex items-center space-x-2 text-[#3A5A74] font-serif font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-[#3A5A74]" />
              <span>Share a Media Keepsake</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-serif">
              {mediaUploadType === 'video' ? (
                <span className="flex items-center space-x-1 text-[#3A5A74] bg-[#ebf2f7] px-2 py-0.5 rounded-full border border-[#c8d7e3]">
                  <Cloud className="w-3 h-3 text-[#3A5A74]" />
                  <span>Cloudflare R2</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  <ImageIcon className="w-3 h-3 text-sky-600" />
                  <span>ImageKit CDN</span>
                </span>
              )}
            </div>
          </div>

          {config.videoBlessingsPostingEnabled === false ? (
            <div className="py-8 text-center space-y-3 bg-[#f7fafc] rounded-xl border border-[#c8d7e3] p-5">
              <div className="w-11 h-11 bg-[#ebf2f7] text-[#3A5A74] rounded-full flex items-center justify-center mx-auto border border-[#c8d7e3] shadow-xs">
                <Lock className="w-5 h-5 text-[#3A5A74]" />
              </div>
              <h4 className="font-serif text-lg text-[#18232c] font-semibold">Media Submissions Closed</h4>
              <p className="font-serif italic text-xs text-[#475569] leading-relaxed">
                Media blessing submissions have been closed by the hosts. You can enjoy the keepsake videos and photos recorded and shared by friends and family in the gallery!
              </p>
            </div>
          ) : justPosted ? (
            <div className="py-8 text-center space-y-3 bg-[#f7fafc] rounded-xl border border-emerald-200 p-6 animate-in fade-in duration-300">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-xl text-[#18232c]">
                Your {lastPostedType === 'video' ? 'Video' : 'Photo'} Blessing Has Been Posted!
              </h4>
              <p className="font-serif italic text-xs text-[#475569] leading-relaxed">
                Thank you so much! Your keepsake is now securely stored and part of Mark & Karla's wedding memories.
              </p>
              <button
                type="button"
                onClick={() => setJustPosted(false)}
                className="mt-2 text-xs font-serif text-[#3A5A74] hover:underline cursor-pointer"
              >
                Send Another Media Blessing
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Media Type Selector Tabs */}
              <div className="bg-[#f1f6fa] p-1 rounded-xl border border-[#c8d7e3] flex">
                <button
                  type="button"
                  id="media-tab-video"
                  onClick={() => setMediaUploadType('video')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-serif font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    mediaUploadType === 'video'
                      ? 'bg-white text-[#3A5A74] shadow-xs border border-[#c8d7e3]'
                      : 'text-[#64748b] hover:text-[#18232c]'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span>Video Toast</span>
                  <span className="text-[10px] opacity-75 font-mono hidden sm:inline">(R2)</span>
                </button>

                <button
                  type="button"
                  id="media-tab-photo"
                  onClick={() => setMediaUploadType('photo')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-serif font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                    mediaUploadType === 'photo'
                      ? 'bg-white text-[#3A5A74] shadow-xs border border-[#c8d7e3]'
                      : 'text-[#64748b] hover:text-[#18232c]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span>Photo Memory</span>
                  <span className="text-[10px] opacity-75 font-mono hidden sm:inline">(ImageKit)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span>Your Full Name(s) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aunt Elena & Uncle Robert"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c8d7e3] bg-[#fbfdfd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] font-serif text-sm text-[#18232c] placeholder:text-[#94a3b8] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span>Connection or From (Optional)</span>
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. College Friend, Ninang, Cousin"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c8d7e3] bg-[#fbfdfd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] font-serif text-sm text-[#18232c] placeholder:text-[#94a3b8] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center space-x-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#3A5A74]" />
                  <span>Caption or Message (Optional)</span>
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    mediaUploadType === 'video'
                      ? 'e.g. Wishing you a lifetime of laughter, travel, and joy!'
                      : 'e.g. Can’t wait to celebrate! Here’s a favorite memory together.'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-[#c8d7e3] bg-[#fbfdfd] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3A5A74] font-serif text-sm text-[#18232c] placeholder:text-[#94a3b8] transition"
                />
              </div>

              {/* Media Uploader Container (Video or Photo) */}
              <div>
                {mediaUploadType === 'video' ? (
                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Video className="w-3.5 h-3.5 text-[#3A5A74]" />
                        <span>Your Video Toast *</span>
                      </span>
                      {videoUrl && (
                        <span className="text-[11px] text-emerald-700 font-serif font-semibold">
                          ✓ Ready to post
                        </span>
                      )}
                    </label>

                    {!videoUrl ? (
                      <div className="rounded-2xl overflow-hidden border border-[#c8d7e3]">
                        <VideoBlessingRecorder
                          onVideoAttached={(url, dur) => {
                            setVideoUrl(url);
                            setVideoDuration(dur);
                          }}
                          onSwitchToPhotoTab={() => setMediaUploadType('photo')}
                          isExpanded={isVideoPreviewExpanded}
                          onToggleExpand={(expanded) => setIsVideoPreviewExpanded(expanded)}
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-[#eef6fa] border border-[#b8d5e8] rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#3A5A74] text-white flex items-center justify-center">
                            <Film className="w-4 h-4 text-sky-200" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-serif font-bold text-[#18232c]">
                                Video Attached
                              </span>
                              {videoDuration && (
                                <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono">
                                  {videoDuration}s
                                </span>
                              )}
                              <span className="inline-flex items-center space-x-1 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-serif font-semibold">
                                <Zap className="w-2.5 h-2.5 text-emerald-600" />
                                <span>720p HD Space Saver</span>
                              </span>
                            </div>
                            <span className="text-[11px] font-serif text-[#475569]">
                              Stored in Cloudflare R2
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={handleRemoveAttachedVideo}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Remove attached video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-serif font-bold uppercase tracking-wider text-[#3A5A74] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <ImageIcon className="w-3.5 h-3.5 text-[#3A5A74]" />
                        <span>Your Photo Memory *</span>
                      </span>
                      {imageUrl ? (
                        <span className="text-[11px] text-emerald-700 font-serif font-semibold">
                          ✓ Ready to post
                        </span>
                      ) : (
                        <span className="text-[10px] text-sky-700 font-serif">
                          ImageKit CDN
                        </span>
                      )}
                    </label>

                    <div className="border border-[#c8d7e3] rounded-2xl p-3 bg-[#fbfdfd]">
                      <GuestbookPhotoUploader
                        attachedImageUrl={imageUrl}
                        onImageAttached={(url) => setImageUrl(url)}
                        onRemove={() => setImageUrl('')}
                        folder="/guestbook-photos"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="media-submit-btn"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-3 bg-[#3A5A74] hover:bg-[#274155] disabled:opacity-50 text-white rounded-xl text-xs font-serif font-semibold tracking-wider transition shadow-sm flex items-center justify-center space-x-2 border border-[#4D708E] cursor-pointer"
              >
                {mediaUploadType === 'video' ? (
                  <Film className="w-4 h-4 text-sky-200" />
                ) : (
                  <Camera className="w-4 h-4 text-sky-200" />
                )}
                <span>
                  {isSubmitting
                    ? 'Publishing Keepsake...'
                    : mediaUploadType === 'video'
                    ? 'Post Captured Moments'
                    : 'Post Photo Memory'}
                </span>
                <Send className="w-3.5 h-3.5 text-sky-200" />
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Video & Photo Blessings Showcase Gallery */}
        <div className={`${isVideoPreviewExpanded ? 'w-full' : 'lg:col-span-6'} space-y-4 transition-all duration-300`}>
          {/* Gallery Header and Filter Bar */}
          <div className="space-y-3 pb-2 border-b border-[#c8d7e3]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#3A5A74]" />
                <span className="font-serif font-bold text-sm text-[#18232c] tracking-wide">
                  Celebration Media Gallery
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-serif font-semibold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                {allMediaEntries.length} {allMediaEntries.length === 1 ? 'Keepsake' : 'Keepsakes'}
              </span>
            </div>

            {/* Sub-Filters: All, Videos (R2), Photos (ImageKit) */}
            <div className="flex items-center space-x-2 text-xs font-serif">
              <button
                type="button"
                onClick={() => setGalleryFilter('all')}
                className={`px-3 py-1 rounded-full border transition flex items-center space-x-1 cursor-pointer ${
                  galleryFilter === 'all'
                    ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                    : 'bg-white text-[#475569] border-[#c8d7e3] hover:bg-[#f1f5f9]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>All ({allMediaEntries.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setGalleryFilter('video')}
                className={`px-3 py-1 rounded-full border transition flex items-center space-x-1 cursor-pointer ${
                  galleryFilter === 'video'
                    ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                    : 'bg-white text-[#475569] border-[#c8d7e3] hover:bg-[#f1f5f9]'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>Videos ({videoCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setGalleryFilter('photo')}
                className={`px-3 py-1 rounded-full border transition flex items-center space-x-1 cursor-pointer ${
                  galleryFilter === 'photo'
                    ? 'bg-[#3A5A74] text-white border-[#3A5A74]'
                    : 'bg-white text-[#475569] border-[#c8d7e3] hover:bg-[#f1f5f9]'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span>Photos ({photoCount})</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[660px] overflow-y-auto pr-1">
            {displayedEntries.length === 0 ? (
              <div className="p-10 text-center bg-white/90 rounded-2xl border border-dashed border-[#c8d7e3] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#ebf2f7] text-[#3A5A74] flex items-center justify-center mx-auto">
                  {galleryFilter === 'photo' ? (
                    <Camera className="w-6 h-6 text-[#3A5A74]" />
                  ) : (
                    <Video className="w-6 h-6 text-[#3A5A74]" />
                  )}
                </div>
                <h4 className="font-serif text-base text-[#18232c] font-semibold">
                  {galleryFilter === 'photo'
                    ? 'No Photos Shared Yet'
                    : galleryFilter === 'video'
                    ? 'No Captured Moments Yet'
                    : 'No Captured Moments or Photos Yet'}
                </h4>
                <p className="font-serif italic text-xs text-[#64748b] max-w-sm mx-auto leading-relaxed">
                  {galleryFilter === 'photo'
                    ? 'Be the first to upload a cherished wedding photo memory using the uploader on the left!'
                    : galleryFilter === 'video'
                    ? 'Be the first to record a live toast or upload a video clip for Mark and Karla!'
                    : 'Be the first to record a video toast or share a photo memory using the uploader on the left!'}
                </p>
              </div>
            ) : (
              displayedEntries.map((item) => {
                const isPinned = Boolean(item.isFeatured);
                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl transition space-y-3 ${
                      isPinned
                        ? 'bg-gradient-to-br from-[#fffdfa] via-white to-[#fbf7ee] border-2 border-[#c5a059] shadow-sm ring-1 ring-[#c5a059]/20'
                        : 'bg-[#ffffff] border border-[#c8d7e3] shadow-xs hover:border-[#3A5A74]/50'
                    }`}
                  >
                    {/* Top Author & Metadata Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {isPinned ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-serif font-bold tracking-wider uppercase bg-[#fbf5e6] text-[#8a6417] border border-[#e5d4a6] shadow-2xs">
                            <Pin className="w-3 h-3 fill-[#c5a059] text-[#8a6417] -rotate-45" />
                            <span>Featured Keepsake</span>
                          </span>
                        ) : (
                          <span className="text-[#3A5A74] text-xs">❦</span>
                        )}
                        <span className="font-serif font-bold text-sm text-[#18232c]">
                          {item.name}
                        </span>
                        {item.relationship && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-serif font-semibold border ${
                              isPinned
                                ? 'bg-[#fbf5e6]/80 text-[#8a6417] border-[#e5d4a6]'
                                : 'bg-[#ebf2f7] text-[#3A5A74] border-[#c8d7e3]'
                            }`}
                          >
                            {item.relationship}
                          </span>
                        )}
                      </div>

                    <div className="flex items-center space-x-2">
                      {item.videoUrl && (
                        <span className="text-[10px] font-mono text-[#3A5A74] bg-[#ebf2f7] px-1.5 py-0.5 rounded border border-[#c8d7e3] flex items-center space-x-1">
                          <Film className="w-2.5 h-2.5" />
                          <span>R2 Video</span>
                        </span>
                      )}
                      {item.imageUrl && (
                        <span className="text-[10px] font-mono text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 flex items-center space-x-1">
                          <Camera className="w-2.5 h-2.5" />
                          <span>ImageKit Photo</span>
                        </span>
                      )}
                      <span className="text-[11px] font-serif text-[#64748b] flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#94a3b8]" />
                        <span>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : ''}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Caption / Toast Message */}
                  {item.message && (
                    <p className="font-serif text-[#334155] text-xs sm:text-sm leading-relaxed italic pl-3 border-l-2 border-[#3A5A74]/25">
                      "{item.message}"
                    </p>
                  )}

                  {/* High Quality Video Player (Cloudflare R2) */}
                  {item.videoUrl && (
                    <VideoBlessingPlayer
                      videoUrl={item.videoUrl}
                      authorName={item.name}
                      relationship={item.relationship}
                      duration={item.videoDuration}
                    />
                  )}

                  {/* High Quality Photo Card (ImageKit Cloud Storage) */}
                  {item.imageUrl && (
                    <div className="pt-1">
                      <div
                        onClick={() =>
                          setSelectedPhoto({
                            url: item.imageUrl!,
                            authorName: item.name,
                            relationship: item.relationship,
                            caption: item.message,
                            createdAt: item.createdAt,
                          })
                        }
                        className="group relative block cursor-pointer overflow-hidden rounded-xl border border-[#c8d7e3] bg-[#f8fafc] max-w-sm shadow-xs hover:shadow-md transition"
                      >
                        <img
                          src={item.imageUrl}
                          alt={`${item.name}'s keepsake`}
                          referrerPolicy="no-referrer"
                          className="h-52 w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition bg-white/95 text-[#18232c] text-xs font-serif px-3 py-1.5 rounded-full shadow-md flex items-center space-x-1.5 transform translate-y-1 group-hover:translate-y-0 duration-200">
                            <Maximize2 className="w-3.5 h-3.5 text-[#3A5A74]" />
                            <span className="font-semibold">View Full Photo</span>
                          </span>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded font-mono">
                          ImageKit CDN
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>

      {/* Full Resolution Photo Lightbox Modal */}
      {selectedPhoto && (
        <PhotoLightboxModal
          isOpen={true}
          onClose={() => setSelectedPhoto(null)}
          imageUrl={selectedPhoto.url}
          authorName={selectedPhoto.authorName}
          relationship={selectedPhoto.relationship}
          caption={selectedPhoto.caption}
          createdAt={selectedPhoto.createdAt}
        />
      )}
    </section>
  );
};
