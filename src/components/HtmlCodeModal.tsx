import React, { useState, useEffect } from 'react';
import { X, Copy, Download, Check, Code, RefreshCw } from 'lucide-react';
import { EventConfig, Guest } from '../types';
import { generateStandaloneHtml } from '../utils/generateHtml';

interface HtmlCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
  guests: Guest[];
}

export const HtmlCodeModal: React.FC<HtmlCodeModalProps> = ({
  isOpen,
  onClose,
  config,
  guests
}) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHtmlContent(generateStandaloneHtml(config, guests));
    }
  }, [isOpen, config, guests]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_invitation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    setHtmlContent(generateStandaloneHtml(config, guests));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border-2 border-stone-900 relative max-h-[92vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-black hover:text-stone-600 transition"
          title="Close HTML modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pb-3 border-b-2 border-stone-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-black border-2 border-stone-900 flex items-center justify-center">
              <Code className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-serif font-extrabold text-black">
                Standalone HTML Code & Exporter
              </h3>
              <p className="text-xs text-black font-semibold">
                Direct single-file HTML code with Tailwind, fonts, music, and your custom details.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mr-8">
            <button
              onClick={handleRegenerate}
              className="p-2 text-black hover:bg-stone-100 rounded-lg border-2 border-stone-900"
              title="Refresh HTML with current changes"
            >
              <RefreshCw className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>

        {/* Code Editor / Viewer */}
        <div className="flex-1 overflow-hidden py-3">
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="w-full h-full p-4 rounded-2xl bg-stone-950 text-emerald-400 font-mono text-xs leading-relaxed border-2 border-stone-900 outline-none resize-none selection:bg-emerald-900 selection:text-white"
            spellCheck={false}
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t-2 border-stone-900 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-black font-semibold">
            You can copy or download this standalone HTML file to run anywhere.
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-white hover:bg-stone-100 text-black font-bold rounded-xl text-xs flex items-center space-x-1.5 transition border-2 border-stone-900"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 font-extrabold" />
                  <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-black" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-black hover:bg-stone-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-md border border-black"
            >
              <Download className="w-4 h-4" />
              <span>Download .html File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
