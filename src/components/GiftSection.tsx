import React, { useState } from 'react';
import { 
  Gift, 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Heart, 
  Smartphone, 
  CreditCard, 
  Sparkles, 
  Maximize2, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { EventConfig, getNormalizedGiftQrList, GiftQrItem } from '../types';

interface GiftSectionProps {
  config: EventConfig;
  onOpenModal?: () => void;
}

export const GiftSection: React.FC<GiftSectionProps> = ({ config }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [zoomedQrIndex, setZoomedQrIndex] = useState<number | null>(null);

  // If gift registry is explicitly disabled, do not render
  if (config.giftEnabled === false) {
    return null;
  }

  const giftEyebrow = config.giftEyebrow || 'Wedding Registry & Blessings';
  const giftTitle = config.giftTitle || 'Monetary Gift & Blessings';
  const giftSubtitle =
    config.giftSubtitle ||
    'Your love, presence, and prayers on our special day are the greatest gifts of all. Should you wish to honor us with a gift, a monetary blessing is warmly appreciated.';

  const qrList: GiftQrItem[] = getNormalizedGiftQrList(config);

  const handleCopyAccountNumber = (accountNumber: string, id: string) => {
    if (accountNumber && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(accountNumber);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDownloadSpecificQr = (qr: GiftQrItem) => {
    if (!qr.qrImage) return;
    const link = document.createElement('a');
    link.href = qr.qrImage;
    link.download = `Wedding-Gift-QR-${(qr.bankName || 'Channel').replace(/\s+/g, '-')}-${(qr.accountName || 'Account').replace(/\s+/g, '-')}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openZoomModal = (index: number) => {
    setZoomedQrIndex(index);
  };

  const closeZoomModal = () => {
    setZoomedQrIndex(null);
  };

  // Determine optimal responsive grid columns based on number of items
  const gridLayoutClass = 
    qrList.length === 1
      ? 'max-w-md mx-auto'
      : qrList.length === 2
      ? 'grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto'
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto';

  const activeZoomedQr = zoomedQrIndex !== null ? qrList[zoomedQrIndex] : null;

  return (
    <section id="gift" className="romantic-stationery-card rounded-3xl p-6 sm:p-12 relative overflow-hidden">
      {/* Delicate Inner Stationery Border */}
      <div className="absolute inset-3 sm:inset-4 border border-[#c5a059]/30 rounded-2xl pointer-events-none"></div>

      {/* Header Eyebrow & Title */}
      <div className="text-center max-w-xl mx-auto mb-10 relative z-10">
        <div className="inline-flex items-center space-x-2 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.25em] mb-1.5">
          <span>❦</span>
          <span>{giftEyebrow}</span>
          <span>❦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-[#18232c] tracking-wide font-normal flex items-center justify-center gap-2.5">
          <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-[#3A5A74] shrink-0" />
          <span>{giftTitle}</span>
        </h2>
        {giftSubtitle && (
          <p className="text-[#475569] font-serif italic text-sm sm:text-base mt-2.5 leading-relaxed text-balance">
            "{giftSubtitle}"
          </p>
        )}
      </div>

      {/* Responsive Grid Layout of All Gift Options */}
      <div className={`${gridLayoutClass} relative z-10`}>
        {qrList.map((qr, idx) => {
          const itemKey = qr.id || `gift-qr-${idx}`;
          const isCopied = copiedId === itemKey;
          const displayImage = qr.qrImage || 'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80';

          return (
            <div
              key={itemKey}
              className="group relative bg-[#ffffff] rounded-2xl sm:rounded-3xl border border-[#c8d7e3] p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#3A5A74]/50 flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle Gilded Corner Fleurons */}
              <div className="absolute top-2.5 left-2.5 text-[#c5a059]/30 text-xs pointer-events-none select-none font-serif transition-opacity duration-300 group-hover:text-[#c5a059]">
                ❦
              </div>
              <div className="absolute top-2.5 right-2.5 text-[#c5a059]/30 text-xs pointer-events-none select-none font-serif transition-opacity duration-300 group-hover:text-[#c5a059]">
                ❦
              </div>

              {/* Delicate Gold-Foil Border Shimmer on Hover */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-transparent group-hover:border-[#c5a059]/35 pointer-events-none transition-colors duration-300"></div>

              {/* Card Header: Channel Brand & Verified Badge */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#e2ecf4] relative z-10">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#ebf2f7] group-hover:bg-[#3A5A74] text-[#3A5A74] group-hover:text-white flex items-center justify-center transition-colors duration-300 shadow-2xs border border-[#c8d7e3] shrink-0">
                    <Smartphone className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#18232c] group-hover:text-[#3A5A74] transition-colors truncate">
                      {qr.bankName || 'Digital Payment'}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider font-serif text-[#506173] block truncate">
                      Registry Channel {idx + 1}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-serif font-semibold text-[#3A5A74] uppercase tracking-wider bg-[#ebf2f7] group-hover:bg-[#dbe7f0] px-2.5 py-0.5 rounded-full border border-[#c8d7e3] shrink-0 transition-colors">
                  Instant QR
                </span>
              </div>

              {/* Prominent QR Code Interactive Frame with Hover Animations */}
              <div 
                onClick={() => openZoomModal(idx)}
                className="relative my-4 p-3.5 bg-gradient-to-b from-[#fafcff] to-[#f4f7fa] group-hover:from-[#f5f9fc] group-hover:to-[#edf3f8] rounded-2xl border border-[#c8d7e3] group/qr cursor-pointer overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:border-[#3A5A74]/40 z-10"
                title="Click to enlarge & scan QR code"
              >
                {/* Animated Scanner Corner Brackets */}
                <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#3A5A74]/50 group-hover/qr:border-[#3A5A74] group-hover/qr:w-4 group-hover/qr:h-4 transition-all duration-300 pointer-events-none"></div>
                <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#3A5A74]/50 group-hover/qr:border-[#3A5A74] group-hover/qr:w-4 group-hover/qr:h-4 transition-all duration-300 pointer-events-none"></div>
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#3A5A74]/50 group-hover/qr:border-[#3A5A74] group-hover/qr:w-4 group-hover/qr:h-4 transition-all duration-300 pointer-events-none"></div>
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#3A5A74]/50 group-hover/qr:border-[#3A5A74] group-hover/qr:w-4 group-hover/qr:h-4 transition-all duration-300 pointer-events-none"></div>

                {/* QR Code Container with Image Hover Animation */}
                <div className="bg-white rounded-xl p-2.5 border border-slate-200/90 shadow-inner aspect-square max-w-[210px] mx-auto flex items-center justify-center relative overflow-hidden group-hover:ring-4 group-hover:ring-[#3A5A74]/10 transition-all duration-300">
                  <img
                    src={displayImage}
                    alt={`${qr.bankName} QR Code`}
                    className="w-full h-full object-contain rounded-lg transition-transform duration-300 ease-out group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* Prominent Hover Overlay Button & Shimmer */}
                  <div className="absolute inset-0 bg-[#18232c]/60 backdrop-blur-[1.5px] opacity-0 group-hover/qr:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center text-white">
                    <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md border border-white/50 flex items-center justify-center mb-1.5 transform translate-y-2 group-hover/qr:translate-y-0 transition-transform duration-300 shadow-md">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-serif font-bold tracking-wider text-amber-200 drop-shadow-sm">
                      Tap to Enlarge &amp; Scan
                    </span>
                    <span className="text-[10px] text-white/90 font-serif italic mt-0.5">
                      Full-resolution display
                    </span>
                  </div>
                </div>

                {/* Quick Prominent Action Links Bar */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-2.5 border-t border-[#e2ecf4]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openZoomModal(idx);
                    }}
                    className="flex-1 py-1.5 px-3 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold transition-all shadow-2xs hover:shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5 active:scale-95 border border-[#274155]"
                    title="Enlarge QR code for easy scanning"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Enlarge QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSpecificQr(qr);
                    }}
                    className="py-1.5 px-3 bg-[#ffffff] hover:bg-[#ebf2f7] text-[#18232c] rounded-xl text-xs font-serif font-semibold transition-all border border-[#c8d7e3] hover:border-[#3A5A74]/50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    title="Download QR code image to device"
                  >
                    <Download className="w-3.5 h-3.5 text-[#3A5A74]" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Account Details Section */}
              <div className="space-y-3 relative z-10 pt-1">
                {/* Account Name */}
                <div>
                  <span className="text-[10px] font-serif uppercase tracking-widest text-[#506173] block mb-0.5">
                    Account Name
                  </span>
                  <p className="font-serif font-bold text-sm sm:text-base text-[#18232c] truncate">
                    {qr.accountName || 'Mark Alain Sim & Karla'}
                  </p>
                </div>

                {/* Account / Mobile Number with 1-Click Copy */}
                <div className="p-3 bg-[#f8fafc] group-hover:bg-[#f2f6fa] transition-colors rounded-xl border border-[#c8d7e3] flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-serif uppercase tracking-wider text-[#506173] block truncate">
                      Account / Mobile No.
                    </span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-[#3A5A74] tracking-wider select-all block truncate">
                      {qr.accountNumber || '0917-888-2027'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAccountNumber(qr.accountNumber, itemKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-serif font-semibold flex items-center space-x-1.5 transition-all shadow-2xs shrink-0 cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white border border-emerald-700'
                        : 'bg-[#3A5A74] hover:bg-[#274155] text-white border border-[#274155] active:scale-95'
                    }`}
                    title="Copy number to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Channel-Specific Note (if any) */}
                {qr.notes && (
                  <p className="text-[11px] font-serif text-[#506173] italic pt-1 text-center leading-relaxed">
                    "{qr.notes}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Couple's Registry Note Banner */}
      <div className="mt-10 text-center max-w-xl mx-auto relative z-10">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#fdfbf7] to-[#ffffff] border border-[#c5a059]/40 shadow-xs space-y-1.5">
          <div className="flex items-center justify-center space-x-2 text-[#8a6e38] text-xs font-serif font-semibold uppercase tracking-widest">
            <Heart className="w-3.5 h-3.5 text-[#c5a059] fill-[#c5a059]/20" />
            <span>A Gentle Note from the Couple</span>
            <Heart className="w-3.5 h-3.5 text-[#c5a059] fill-[#c5a059]/20" />
          </div>
          <p className="text-xs sm:text-sm text-[#475569] font-serif italic leading-relaxed text-balance">
            {config.giftNotes ||
              'Kindly include your name in the payment reference or note so Mark and Karla can express their warmest gratitude!'}
          </p>
        </div>
      </div>

      {/* Lightbox / Zoom Modal for Enlarged Scanning */}
      {zoomedQrIndex !== null && activeZoomedQr && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={closeZoomModal}
        >
          <div
            className="romantic-stationery-card bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center space-y-4 shadow-2xl border border-[#c5a059]/40 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Delicate Inner Frame */}
            <div className="absolute inset-2.5 sm:inset-3 border border-[#c5a059]/30 rounded-[20px] pointer-events-none"></div>

            <div className="flex items-center justify-between pb-2 border-b border-[#e2ecf4] relative z-10">
              <div className="text-left min-w-0 pr-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#18232c] truncate">
                  {activeZoomedQr.bankName || 'Digital QR'}
                </h3>
                <p className="text-xs text-[#506173] font-serif truncate">
                  {activeZoomedQr.accountName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeZoomModal}
                className="w-8 h-8 rounded-full bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] flex items-center justify-center text-sm font-bold transition cursor-pointer shrink-0"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Multiple QR Selector Tabs in Modal (if > 1) */}
            {qrList.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 flex-wrap relative z-10">
                {qrList.map((qr, idx) => (
                  <button
                    key={`modal-tab-${idx}`}
                    type="button"
                    onClick={() => setZoomedQrIndex(idx)}
                    className={`px-3 py-1 text-xs font-serif rounded-lg border transition-all cursor-pointer ${
                      idx === zoomedQrIndex
                        ? 'bg-[#3A5A74] text-white border-[#274155] shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {qr.bankName || `Option ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* High-Res QR Display */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-inner relative z-10">
              <img
                src={
                  activeZoomedQr.qrImage ||
                  'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80'
                }
                alt={`${activeZoomedQr.bankName} QR Code`}
                className="w-full h-auto object-contain rounded-xl max-h-[300px] sm:max-h-[340px] mx-auto"
              />
            </div>

            {/* Account Number Monospace Box */}
            <div className="p-2.5 bg-[#f8fafc] rounded-xl border border-[#c8d7e3] text-xs sm:text-sm font-mono font-bold text-[#3A5A74] relative z-10 tracking-wider select-all">
              {activeZoomedQr.accountNumber}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 relative z-10">
              <button
                type="button"
                onClick={() =>
                  handleCopyAccountNumber(
                    activeZoomedQr.accountNumber,
                    activeZoomedQr.id || `modal-qr-${zoomedQrIndex}`
                  )
                }
                className="flex-1 py-2.5 bg-[#3A5A74] hover:bg-[#274155] text-white rounded-xl text-xs font-serif font-semibold flex items-center justify-center gap-1.5 shadow-sm transition border border-[#274155] cursor-pointer active:scale-95"
              >
                {copiedId === (activeZoomedQr.id || `modal-qr-${zoomedQrIndex}`) ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadSpecificQr(activeZoomedQr)}
                className="flex-1 py-2.5 bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] rounded-xl text-xs font-serif font-semibold flex items-center justify-center gap-1.5 border border-[#c8d7e3] transition cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
