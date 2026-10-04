import React, { useState } from 'react';
import { Gift, QrCode, Copy, Check, Download, X, Smartphone, ChevronLeft, ChevronRight, CreditCard, Sparkles } from 'lucide-react';
import { EventConfig, getNormalizedGiftQrList, GiftQrItem } from '../types';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
}

export const GiftModal: React.FC<GiftModalProps> = ({ isOpen, onClose, config }) => {
  const [copied, setCopied] = useState(false);
  const [selectedQrIndex, setSelectedQrIndex] = useState(0);

  if (!isOpen) return null;

  const giftEyebrow = config.giftEyebrow || 'Wedding Registry & Blessings';
  const giftTitle = config.giftTitle || 'Monetary Gift & Blessings';
  const giftSubtitle =
    config.giftSubtitle ||
    'Your presence and love on our special day are the greatest gifts of all. Should you wish to honor us with a gift, a monetary blessing is warmly appreciated.';

  const qrList: GiftQrItem[] = getNormalizedGiftQrList(config);
  const safeIndex = Math.min(Math.max(0, selectedQrIndex), qrList.length - 1);
  const activeQr = qrList[safeIndex] || qrList[0];

  const bankName = activeQr.bankName || 'GCash / Bank Transfer';
  const accountName = activeQr.accountName || 'Mark Alain Sim & Karla';
  const accountNumber = activeQr.accountNumber || '0917-888-2027';
  const qrImage =
    activeQr.qrImage ||
    'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80';
  const notes =
    activeQr.notes ||
    config.giftNotes ||
    'Kindly include your name in the payment reference or note so we can express our deepest gratitude!';

  const handleCopyAccountNumber = () => {
    if (accountNumber && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!qrImage) return;
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `Wedding-Gift-QR-${bankName.replace(/\s+/g, '-')}-${accountName.replace(/\s+/g, '-')}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="gift-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="gift-modal-content"
        className="bg-white rounded-3xl p-5 sm:p-8 max-w-lg w-full relative shadow-2xl border-2 border-[#c8d7e3] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Decorative Background Stationery Flourish */}
        <div className="absolute inset-3 border border-[#c5a059]/25 rounded-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          type="button"
          id="gift-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] flex items-center justify-center transition border border-[#c8d7e3] z-20 cursor-pointer shadow-xs"
          title="Close Gift QR Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center relative z-10 mb-5">
          <div className="inline-flex items-center space-x-1.5 text-[#3A5A74] text-xs font-serif font-semibold uppercase tracking-[0.2em] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3A5A74]" />
            <span>{giftEyebrow}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif text-[#18232c] font-normal flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-[#3A5A74]" />
            <span>{giftTitle}</span>
          </h3>
          {giftSubtitle && (
            <p className="text-[#475569] font-serif italic text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
              "{giftSubtitle}"
            </p>
          )}
        </div>

        {/* Multiple QR Option Selector Tabs */}
        {qrList.length > 1 && (
          <div className="relative z-10 mb-4">
            <div className="flex items-center justify-center gap-1.5 flex-wrap p-1 bg-[#f0f4f8] rounded-xl border border-[#c8d7e3]/80">
              {qrList.map((qr, idx) => {
                const isActive = idx === safeIndex;
                return (
                  <button
                    key={qr.id || `modal-tab-${idx}`}
                    type="button"
                    id={`modal-qr-tab-${idx}`}
                    onClick={() => {
                      setSelectedQrIndex(idx);
                      setCopied(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-serif font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#3A5A74] text-white shadow-xs border border-[#274155]'
                        : 'bg-white/80 text-[#475569] hover:bg-white hover:text-[#18232c]'
                    }`}
                  >
                    <Smartphone className={`w-3 h-3 ${isActive ? 'text-white' : 'text-[#3A5A74]'}`} />
                    <span className="truncate max-w-[120px]">{qr.bankName || `QR ${idx + 1}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* QR Code Card */}
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="p-4 bg-white rounded-2xl border-2 border-[#c8d7e3] shadow-md text-center max-w-xs w-full">
            {/* Header / Next-Prev bar */}
            <div className="flex items-center justify-between mb-2 px-1">
              {qrList.length > 1 ? (
                <button
                  type="button"
                  id="modal-qr-prev-btn"
                  onClick={() => setSelectedQrIndex((prev) => (prev > 0 ? prev - 1 : qrList.length - 1))}
                  className="w-6 h-6 rounded-full bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] flex items-center justify-center transition border border-[#c8d7e3] cursor-pointer"
                  title="Previous QR Code"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              ) : <div className="w-6"></div>}

              {/* Provider Pill */}
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-serif font-semibold bg-[#ebf2f7] text-[#3A5A74] border border-[#c8d7e3]">
                <Smartphone className="w-3.5 h-3.5 text-[#3A5A74]" />
                <span className="truncate max-w-[140px]">{bankName}</span>
              </div>

              {qrList.length > 1 ? (
                <button
                  type="button"
                  id="modal-qr-next-btn"
                  onClick={() => setSelectedQrIndex((prev) => (prev < qrList.length - 1 ? prev + 1 : 0))}
                  className="w-6 h-6 rounded-full bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] flex items-center justify-center transition border border-[#c8d7e3] cursor-pointer"
                  title="Next QR Code"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : <div className="w-6"></div>}
            </div>

            {/* QR Image Container */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-inner aspect-square flex items-center justify-center overflow-hidden">
              <img
                src={qrImage}
                alt={`Gift QR Code - ${bankName}`}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1595079672139-545c60e557b7?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>

            {qrList.length > 1 && (
              <p className="text-[10px] font-serif text-[#3A5A74] font-semibold mt-1 tracking-wider uppercase">
                Payment Channel {safeIndex + 1} of {qrList.length}
              </p>
            )}

            <p className="text-[11px] font-serif text-[#506173] mt-1.5 flex items-center justify-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-[#3A5A74]" />
              <span>Scan using your mobile banking or e-wallet app</span>
            </p>
          </div>

          {/* Account Details Box */}
          <div className="w-full bg-[#f8fafc] rounded-2xl p-4 border border-[#c8d7e3] space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-[#e2ecf4] pb-2">
              <span className="font-serif text-[#506173]">Account Name:</span>
              <span className="font-serif font-bold text-[#18232c] text-sm">{accountName}</span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-wider text-[#506173] block">
                  Account / Mobile Number:
                </span>
                <span className="font-mono font-bold text-sm sm:text-base text-[#3A5A74] select-all">
                  {accountNumber}
                </span>
              </div>
              <button
                type="button"
                id="modal-copy-number-btn"
                onClick={handleCopyAccountNumber}
                className={`px-3 py-1.5 rounded-lg text-xs font-serif font-semibold flex items-center space-x-1 transition shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white border border-emerald-700'
                    : 'bg-[#3A5A74] hover:bg-[#274155] text-white border border-[#274155]'
                }`}
                title="Copy account number"
              >
                {copied ? (
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

            {notes && (
              <div className="pt-2 text-[11px] font-serif italic text-[#475569] border-t border-[#e2ecf4]">
                {notes}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2.5 w-full pt-1">
            <button
              type="button"
              id="modal-download-qr-btn"
              onClick={handleDownloadQr}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#ebf2f7] hover:bg-[#dbe7f0] text-[#3A5A74] font-serif font-semibold text-xs sm:text-sm border border-[#c8d7e3] transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#3A5A74]" />
              <span>Save QR to Photos</span>
            </button>
            <button
              type="button"
              id="modal-done-btn"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-[#3A5A74] hover:bg-[#274155] text-white font-serif font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
