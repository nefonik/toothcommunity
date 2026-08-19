import React, { useEffect } from "react";
import { X, Download, ZoomIn, ExternalLink, Image as ImageIcon } from "lucide-react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  senderName?: string;
  timestamp?: number;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  senderName,
  timestamp,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `toothchat_image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn("Download error:", e);
    }
  };

  const handleOpenNewTab = () => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${imageUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Header Controls Bar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between px-4 py-3 bg-[#111214]/80 backdrop-blur rounded-[12px] border border-[#2b2d31] mb-3 text-[#dbdee1] shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#5865f2]/20 border border-[#5865f2]/40 flex items-center justify-center text-purple-300">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white truncate">
              {senderName ? `Zdjęcie od ${senderName}` : "Podgląd zdjęcia"}
            </h3>
            {timestamp && (
              <p className="text-[11px] text-[#949ba4]">
                {new Date(timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-white rounded-[6px] text-xs font-semibold border border-[#3f4147] transition-colors cursor-pointer"
            title="Pobierz zdjęcie"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pobierz</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="p-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white rounded-[6px] transition-colors cursor-pointer border border-[#3f4147]"
            title="Otwórz w nowej karcie"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#da373c]/20 hover:bg-[#da373c] text-[#da373c] hover:text-white rounded-[6px] transition-colors cursor-pointer border border-[#da373c]/30 ml-1"
            title="Zamknij (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative max-w-5xl max-h-[80vh] flex items-center justify-center overflow-hidden rounded-[12px] shadow-2xl border border-[#2b2d31] bg-[#1e1f22]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Zdjęcie ToothChat"
          className="max-w-full max-h-[80vh] object-contain rounded-[10px] transition-all"
        />
      </div>

      <div className="mt-2 text-xs text-[#949ba4] font-mono">
        Kliknij w dowolne miejsce poza zdjęciem lub wciśnij <kbd className="px-1.5 py-0.5 bg-[#2b2d31] rounded text-white text-[10px]">Esc</kbd>, aby zamknąć
      </div>
    </div>
  );
};
