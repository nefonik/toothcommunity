import React, { useState, useRef } from "react";
import { ToothLogoIcon } from "./ToothIcons";
import { X, Upload, Check, Camera, Trash2 } from "lucide-react";
import { UserIdentity } from "../types";

interface AvatarUploadModalProps {
  isOpen?: boolean;
  currentUser: UserIdentity;
  onClose: () => void;
  onSaveAvatar?: (avatarUrl: string, customStatus?: string) => Promise<void> | void;
  onSave?: (avatarUrl: string, customStatus?: string) => Promise<void> | void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen = true,
  currentUser,
  onClose,
  onSaveAvatar,
  onSave,
}) => {
  if (isOpen === false) return null;

  const [previewUrl, setPreviewUrl] = useState<string>(currentUser.avatarUrl || "");
  const [customStatus, setCustomStatus] = useState<string>(currentUser.customStatus || "");
  const [isSaving, setIsSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Proszę wybrać plik graficzny (PNG, JPG, WebP, GIF).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(previewUrl, customStatus);
      } else if (onSaveAvatar) {
        await onSaveAvatar(previewUrl, customStatus);
      }
      onClose();
    } catch (err) {
      console.error("Błąd zapisu awatara:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#313338] border border-[#202225] rounded-[8px] shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202225] bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#5865F2]" />
            <h3 className="font-bold text-white text-lg tracking-tight">
              Zmień zdjęcie profilowe
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white transition-colors p-1 rounded hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-lg border-2 border-[#5865F2]"
                style={{ backgroundColor: currentUser.avatarColor || "#5865F2" }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Podgląd profilowego"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ToothLogoIcon className="w-14 h-14 text-white" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold"
              >
                <Camera className="w-6 h-6 mb-1" />
                Zmień
              </button>
            </div>
            <p className="text-xs text-[#949ba4]">
              {currentUser.displayName} • Podgląd zdjęcia
            </p>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[8px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragOver
                ? "border-[#5865F2] bg-[#5865F2]/10"
                : "border-[#4e5058] hover:border-[#5865F2] bg-[#2b2d31]/50 hover:bg-[#2b2d31]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-[#5865F2] mb-2" />
            <p className="text-sm font-semibold text-white">
              Wybierz plik z komputera lub przeciągnij tutaj
            </p>
            <p className="text-xs text-[#949ba4] mt-1">
              Obsługuje PNG, JPG, GIF lub WebP (max 5 MB)
            </p>
          </div>

          {/* Reset button if avatar is chosen */}
          {previewUrl && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPreviewUrl("")}
                className="flex items-center gap-1.5 text-xs text-[#da373c] hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Usuń zdjęcie (przywróć domyślny ząbek)
              </button>
            </div>
          )}

          {/* Custom Status Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              Własny Status / Opis
            </label>
            <input
              type="text"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="np. Gra w ToothChat, Dostępny, Pracuje..."
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-[4px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
            />
            <p className="text-[11px] text-[#949ba4]">
              Ten tekst będzie widoczny pod Twoim nickiem zamiast e-maila.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#2b2d31] border-t border-[#202225] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white hover:underline cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-sm font-medium rounded-[4px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isSaving ? (
              <span>Zapisywanie...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Zapisz zmiany</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
