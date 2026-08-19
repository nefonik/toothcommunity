import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Check,
  Camera,
  Trash2,
  Sparkles,
  Gift,
  Coins,
  Shield,
  CheckCircle2,
  Flame,
  Zap,
  Crown,
  Palette,
  Image as ImageIcon,
  Link,
  RotateCcw,
} from "lucide-react";
import { UserIdentity } from "../types";
import {
  AvatarWithDecoration,
  AVATAR_DECORATIONS,
  AvatarDecorationDef,
} from "./AvatarWithDecoration";
import {
  PROFILE_BANNER_PRESETS,
  ProfileBannerView,
  ProfileBannerPreset,
} from "./ProfileBannerHelper";
import {
  ProfileEffectCanvas,
  PROFILE_EFFECTS,
  ProfileEffectDef,
} from "./ProfileEffectCanvas";

interface AvatarUploadModalProps {
  isOpen?: boolean;
  currentUser: UserIdentity;
  onClose: () => void;
  onSaveAvatar?: (
    avatarUrl: string,
    customStatus?: string,
    avatarDecoration?: string,
    bannerUrl?: string,
    bannerColor?: string,
    profileEffect?: string
  ) => Promise<void> | void;
  onSave?: (
    avatarUrl: string,
    customStatus?: string,
    avatarDecoration?: string,
    bannerUrl?: string,
    bannerColor?: string,
    profileEffect?: string
  ) => Promise<void> | void;
  onRedeemCode?: (
    code: string
  ) => Promise<{ success: boolean; message: string; pointsAdded?: number; newBalance?: number }>;
  onUnlockDecoration?: (
    decorationId: string,
    cost: number
  ) => Promise<{ success: boolean; message: string; newBalance?: number }>;
  onEquipDecoration?: (decorationId: string | null) => Promise<void>;
  onUnlockProfileEffect?: (
    effectId: string,
    cost: number
  ) => Promise<{ success: boolean; message: string; newBalance?: number }>;
  onEquipProfileEffect?: (effectId: string | null) => Promise<void>;
  onDeleteAccount?: () => Promise<void> | void;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen = true,
  currentUser,
  onClose,
  onSaveAvatar,
  onSave,
  onRedeemCode,
  onUnlockDecoration,
  onEquipDecoration,
  onUnlockProfileEffect,
  onEquipProfileEffect,
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<
    "avatar" | "banner" | "decorations" | "effects" | "promo" | "account"
  >("avatar");
  const [previewUrl, setPreviewUrl] = useState<string>(currentUser?.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState<string>(currentUser?.bannerUrl || "");
  const [bannerColor, setBannerColor] = useState<string>(currentUser?.bannerColor || "");
  const [customStatus, setCustomStatus] = useState<string>(currentUser?.customStatus || "");
  const [selectedDecoration, setSelectedDecoration] = useState<string>(
    currentUser?.avatarDecoration || ""
  );
  const [selectedProfileEffect, setSelectedProfileEffect] = useState<string>(
    currentUser?.profileEffect || ""
  );
  const [previewHoverEffect, setPreviewHoverEffect] = useState<string | null>(null);
  const [effectsFilter, setEffectsFilter] = useState<string>("All");
  const [userPoints, setUserPoints] = useState<number>(currentUser?.points ?? 150);
  const [unlockedList, setUnlockedList] = useState<string[]>(
    currentUser?.unlockedDecorations || []
  );
  const [unlockedEffectsList, setUnlockedEffectsList] = useState<string[]>(
    currentUser?.unlockedProfileEffects || []
  );
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [dragOverAvatar, setDragOverAvatar] = useState(false);
  const [dragOverBanner, setDragOverBanner] = useState(false);
  const [bannerUrlInput, setBannerUrlInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const compressAvatarImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 256;
            const width = img.width;
            const height = img.height;

            let sx = 0, sy = 0, sWidth = width, sHeight = height;
            if (width > height) {
              sx = (width - height) / 2;
              sWidth = height;
            } else if (height > width) {
              sy = (height - width) / 2;
              sHeight = width;
            }

            canvas.width = MAX_SIZE;
            canvas.height = MAX_SIZE;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, MAX_SIZE, MAX_SIZE);

            const compressed = canvas.toDataURL("image/webp", 0.85);
            if (compressed && compressed.startsWith("data:image/webp")) {
              resolve(compressed);
            } else {
              resolve(canvas.toDataURL("image/jpeg", 0.85));
            }
          } catch (err) {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressBannerImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const TARGET_WIDTH = 760;
            const TARGET_HEIGHT = 280;

            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            const imgRatio = img.width / img.height;
            const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

            let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
            if (imgRatio > targetRatio) {
              sWidth = img.height * targetRatio;
              sx = (img.width - sWidth) / 2;
            } else {
              sHeight = img.width / targetRatio;
              sy = (img.height - sHeight) / 2;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

            const compressed = canvas.toDataURL("image/webp", 0.82);
            if (compressed && compressed.startsWith("data:image/webp")) {
              resolve(compressed);
            } else {
              resolve(canvas.toDataURL("image/jpeg", 0.82));
            }
          } catch (err) {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processBannerFile(file);
    }
  };

  const processAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Proszę wybrać plik graficzny (PNG, JPG, WebP, GIF).");
      return;
    }
    try {
      const compressed = await compressAvatarImage(file);
      setPreviewUrl(compressed);
    } catch (err) {
      console.warn("Avatar compression error:", err);
    }
  };

  const processBannerFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Proszę wybrać plik graficzny na baner (PNG, JPG, WebP, GIF).");
      return;
    }
    try {
      const compressed = await compressBannerImage(file);
      setBannerUrl(compressed);
    } catch (err) {
      console.warn("Banner compression error:", err);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(
          previewUrl,
          customStatus,
          selectedDecoration,
          bannerUrl,
          bannerColor,
          selectedProfileEffect
        );
      } else if (onSaveAvatar) {
        await onSaveAvatar(
          previewUrl,
          customStatus,
          selectedDecoration,
          bannerUrl,
          bannerColor,
          selectedProfileEffect
        );
      }
      onClose();
    } catch (err) {
      console.error("Błąd zapisu profilu:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBuyOrEquipDecoration = async (dec: AvatarDecorationDef) => {
    const isUnlocked = unlockedList.includes(dec.id);

    if (isUnlocked) {
      const nextDec = selectedDecoration === dec.id ? "" : dec.id;
      setSelectedDecoration(nextDec);
      if (onEquipDecoration) {
        await onEquipDecoration(nextDec || null);
      }
    } else {
      if (onUnlockDecoration) {
        const res = await onUnlockDecoration(dec.id, dec.cost);
        if (res.success) {
          setUnlockedList((prev) => [...prev, dec.id]);
          setSelectedDecoration(dec.id);
          if (res.newBalance !== undefined) {
            setUserPoints(res.newBalance);
          }
        } else {
          alert(res.message);
        }
      }
    }
  };

  const handleBuyOrEquipProfileEffect = async (effect: ProfileEffectDef) => {
    const isUnlocked = unlockedEffectsList.includes(effect.id);

    if (isUnlocked) {
      const nextEff = selectedProfileEffect === effect.id ? "" : effect.id;
      setSelectedProfileEffect(nextEff);
      if (onEquipProfileEffect) {
        await onEquipProfileEffect(nextEff || null);
      }
    } else {
      if (onUnlockProfileEffect) {
        const res = await onUnlockProfileEffect(effect.id, effect.price);
        if (res.success) {
          setUnlockedEffectsList((prev) => [...prev, effect.id]);
          setSelectedProfileEffect(effect.id);
          if (res.newBalance !== undefined) {
            setUserPoints(res.newBalance);
          }
        } else {
          alert(res.message);
        }
      }
    }
  };

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    if (onRedeemCode) {
      const res = await onRedeemCode(promoInput.trim());
      setPromoFeedback(res);
      if (res.success && res.newBalance !== undefined) {
        setUserPoints(res.newBalance);
        setPromoInput("");
      }
    }
  };

  const quickColorOptions = [
    { name: "Discord Indigo", value: "#5865F2" },
    { name: "Krwisty Rubin", value: "#DA373C" },
    { name: "Szmaragdowy Ząb", value: "#23A55A" },
    { name: "Ciemny Fiolet", value: "#7B2CBF" },
    { name: "Morski Turkus", value: "#06B6D4" },
    { name: "Ciemny Węgiel", value: "#1E1F22" },
    { name: "Czyste Złoto", value: "#F59E0B" },
    { name: "Różowa Furia", value: "#EC4899" },
  ];

  if (isOpen === false || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#313338] border border-[#202225] rounded-[14px] shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202225] bg-[#2b2d31]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg tracking-tight">
                Personalizacja Profilu & Baner
              </h3>
              <p className="text-xs text-[#949ba4]">
                Ustaw własny baner, zdjęcie, animowane aury oraz status
              </p>
            </div>
          </div>

          {/* Points Pill */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => setActiveTab("promo")}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1e1f22] hover:bg-[#35373c] border border-amber-500/30 rounded-full text-xs font-bold text-amber-400 cursor-pointer shadow-sm transition-colors"
              title="Twoje punkty ToothPoints! Kliknij, aby wpisać sekretny kod."
            >
              <span>🦷</span>
              <span>{userPoints.toLocaleString()}</span>
              <span className="hidden sm:inline text-[10px] text-[#949ba4]">pkt</span>
            </div>

            <button
              onClick={onClose}
              className="text-[#949ba4] hover:text-white transition-colors p-1.5 rounded hover:bg-[#35373c] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#202225] bg-[#2b2d31]/50 px-3 sm:px-5 gap-1 pt-1.5 justify-between items-center no-scrollbar">
          <button
            onClick={() => setActiveTab("avatar")}
            className={`flex-1 min-w-0 pb-2 px-1 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "avatar"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Zdjęcie</span>
          </button>

          <button
            onClick={() => setActiveTab("banner")}
            className={`flex-1 min-w-0 pb-2 px-1 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "banner"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">Baner 🎨</span>
          </button>

          <button
            onClick={() => setActiveTab("decorations")}
            className={`flex-1 min-w-0 pb-2 px-1 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "decorations"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Aury ({AVATAR_DECORATIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("effects")}
            className={`flex-1 min-w-0 pb-2 px-1 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "effects"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-[#949ba4] hover:text-purple-300"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">Efekty Karty ({PROFILE_EFFECTS.length}) ✨</span>
          </button>

          <button
            onClick={() => setActiveTab("promo")}
            className={`flex-1 min-w-0 pb-2 px-1 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "promo"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-[#949ba4] hover:text-amber-400"
            }`}
          >
            <Gift className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Kody 🎁</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`flex-1 min-w-0 pb-2 px-1 text-[11px] sm:text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "account"
                ? "border-[#da373c] text-[#da373c]"
                : "border-transparent text-[#949ba4] hover:text-[#da373c]"
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Konto</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* TAB 1: AVATAR & STATUS */}
          {activeTab === "avatar" && (
            <div className="space-y-6">
              {/* Profile Card Live Preview */}
              <div className="bg-[#232428] rounded-[12px] border border-[#1e1f22] overflow-hidden shadow-lg relative">
                {selectedProfileEffect && (
                  <ProfileEffectCanvas
                    effectId={selectedProfileEffect}
                    className="pointer-events-none absolute inset-0 z-20 opacity-90 rounded-[12px]"
                  />
                )}
                <ProfileBannerView
                  bannerUrl={bannerUrl}
                  bannerColor={bannerColor}
                  fallbackColor={currentUser.avatarColor}
                  heightClass="h-24"
                />

                <div className="px-5 pb-4 relative">
                  <div className="relative -top-10 mb-[-24px] flex items-end justify-between">
                    <div className="relative p-1 bg-[#232428] rounded-full inline-block">
                      <AvatarWithDecoration
                        avatarUrl={previewUrl}
                        displayName={currentUser.displayName}
                        avatarColor={currentUser.avatarColor}
                        decorationId={selectedDecoration}
                        status={currentUser.status}
                        size="xl"
                        showStatus={true}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold z-30"
                      >
                        <Camera className="w-5 h-5 mb-1" />
                        Zmień
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("banner")}
                      className="text-xs bg-[#35373c] hover:bg-[#5865F2] text-white px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer"
                    >
                      Dostosuj Baner 🎨
                    </button>
                  </div>

                  <div className="mt-2 space-y-1">
                    <p className="text-base font-bold text-white flex items-center gap-1.5">
                      {currentUser.displayName}
                      {selectedDecoration && (
                        <span className="text-[10px] bg-[#5865F2]/30 text-[#8ea1e1] px-2 py-0.5 rounded-full border border-[#5865F2]/40">
                          {AVATAR_DECORATIONS.find((d) => d.id === selectedDecoration)?.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#949ba4]">
                      {customStatus ? `"${customStatus}"` : "Brak ustawionego statusu"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverAvatar(true);
                }}
                onDragLeave={() => setDragOverAvatar(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverAvatar(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processAvatarFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[8px] p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragOverAvatar
                    ? "border-[#5865F2] bg-[#5865F2]/10"
                    : "border-[#4e5058] hover:border-[#5865F2] bg-[#2b2d31]/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <Upload className="w-7 h-7 text-[#949ba4] mb-2" />
                <p className="text-sm font-medium text-white mb-0.5">
                  Wybierz plik ze zdjęciem profilowym lub przeciągnij tutaj
                </p>
                <p className="text-xs text-[#949ba4]">
                  Obsługiwane formaty: PNG, JPG, GIF, WebP (automatyczne dopasowanie do koła)
                </p>
              </div>

              {previewUrl && (
                <button
                  type="button"
                  onClick={() => setPreviewUrl("")}
                  className="text-xs text-[#da373c] hover:underline flex items-center gap-1 cursor-pointer mx-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Usuń zdjęcie profilowe (przywróć domyślny ząb)
                </button>
              )}

              {/* Custom Status Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4]">
                  Twój własny status (widoczny dla wszystkich)
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="np. Gra w ToothChat, Zarobiony, Myję zęby 🪥"
                  maxLength={100}
                  className="w-full bg-[#1e1f22] text-white px-3.5 py-2.5 rounded-[6px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE BANNER STUDIO */}
          {activeTab === "banner" && (
            <div className="space-y-6">
              {/* Banner Live Card Preview */}
              <div className="bg-[#232428] rounded-[12px] border border-[#1e1f22] overflow-hidden shadow-xl">
                <div className="relative">
                  <ProfileBannerView
                    bannerUrl={bannerUrl}
                    bannerColor={bannerColor}
                    fallbackColor={currentUser.avatarColor}
                    heightClass="h-28 sm:h-32"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                    Podgląd na żywo
                  </div>
                </div>

                <div className="px-5 pb-4 relative">
                  <div className="relative -top-10 mb-[-24px] flex items-end justify-between">
                    <div className="relative p-1 bg-[#232428] rounded-full inline-block">
                      <AvatarWithDecoration
                        avatarUrl={previewUrl}
                        displayName={currentUser.displayName}
                        avatarColor={currentUser.avatarColor}
                        decorationId={selectedDecoration}
                        status={currentUser.status}
                        size="lg"
                        showStatus={true}
                      />
                    </div>

                    {(bannerUrl || bannerColor) && (
                      <button
                        type="button"
                        onClick={() => {
                          setBannerUrl("");
                          setBannerColor("");
                        }}
                        className="text-xs text-[#da373c] hover:underline flex items-center gap-1 cursor-pointer bg-[#1e1f22] px-2.5 py-1 rounded border border-[#da373c]/30"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Resetuj baner
                      </button>
                    )}
                  </div>

                  <div className="mt-1">
                    <h4 className="font-bold text-white text-base">{currentUser.displayName}</h4>
                    <p className="text-xs text-[#949ba4]">
                      {customStatus || "Ten baner będzie widoczny dla każdego po kliknięciu w Twój profil!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Option A: Upload Custom Banner Image */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4] flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#5865F2]" />
                  1. Wgraj własne zdjęcie lub GIF na Baner
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverBanner(true);
                  }}
                  onDragLeave={() => setDragOverBanner(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverBanner(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processBannerFile(file);
                  }}
                  onClick={() => bannerFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[8px] p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragOverBanner
                      ? "border-[#5865F2] bg-[#5865F2]/10"
                      : "border-[#4e5058] hover:border-[#5865F2] bg-[#2b2d31]/60"
                  }`}
                >
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />
                  <ImageIcon className="w-6 h-6 text-[#949ba4] mb-1.5" />
                  <p className="text-xs sm:text-sm font-medium text-white">
                    Kliknij, aby wybrać grafikę lub przeciągnij plik tutaj
                  </p>
                  <p className="text-[11px] text-[#949ba4]">
                    Zalecane proporcje 16:9 lub 3:1 (PNG, JPG, WebP, GIF)
                  </p>
                </div>

                {/* Direct Image URL input */}
                <div className="flex gap-2 pt-1">
                  <div className="relative flex-1">
                    <Link className="w-4 h-4 text-[#80848e] absolute left-3 top-3" />
                    <input
                      type="url"
                      value={bannerUrlInput}
                      onChange={(e) => setBannerUrlInput(e.target.value)}
                      placeholder="Lub wklej bezpośredni link URL do zdjęcia/GIFa..."
                      className="w-full bg-[#1e1f22] text-white pl-9 pr-3 py-2 rounded-[6px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-xs placeholder:text-[#80848e]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (bannerUrlInput.trim()) {
                        setBannerUrl(bannerUrlInput.trim());
                        setBannerUrlInput("");
                      }
                    }}
                    disabled={!bannerUrlInput.trim()}
                    className="px-3 py-2 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-semibold rounded-[6px] transition-colors cursor-pointer shrink-0"
                  >
                    Zastosuj URL
                  </button>
                </div>
              </div>

              {/* Option B: Preset Animated / Gradient Banners */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  2. Wybierz z gotowych Motywów & Eksplozji Banerów
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PROFILE_BANNER_PRESETS.map((preset) => {
                    const isSelected = bannerUrl === `preset:${preset.id}`;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setBannerUrl(`preset:${preset.id}`);
                        }}
                        className={`h-20 rounded-[8px] p-2 relative text-left overflow-hidden border transition-all cursor-pointer flex flex-col justify-between group shadow ${
                          isSelected
                            ? "border-white ring-2 ring-[#5865F2] scale-[1.02]"
                            : "border-black/30 hover:border-white/60 hover:scale-[1.01]"
                        }`}
                        style={{
                          backgroundImage: preset.cssBackground,
                        }}
                      >
                        {/* Overlay vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                        {preset.badge && (
                          <span className="relative z-10 self-start text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-400/40">
                            {preset.badge}
                          </span>
                        )}

                        <div className="relative z-10 mt-auto">
                          <p className="text-xs font-bold text-white drop-shadow truncate">
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-white/75 truncate">{preset.category}</p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 z-10 bg-[#5865F2] text-white p-1 rounded-full shadow">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option C: Solid / Custom Color */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4] flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  3. Lub wybierz jednolity kolor tła
                </label>

                <div className="flex items-center gap-2 flex-wrap">
                  {quickColorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setBannerUrl("");
                        setBannerColor(c.value);
                      }}
                      title={c.name}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer shadow relative"
                      style={{
                        backgroundColor: c.value,
                        borderColor: bannerColor === c.value && !bannerUrl ? "#ffffff" : "transparent",
                      }}
                    >
                      {bannerColor === c.value && !bannerUrl && (
                        <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow" />
                      )}
                    </button>
                  ))}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-xs text-[#949ba4]">Własny HEX:</span>
                    <input
                      type="color"
                      value={bannerColor || currentUser.avatarColor || "#5865f2"}
                      onChange={(e) => {
                        setBannerUrl("");
                        setBannerColor(e.target.value);
                      }}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANIMATED DECORATIONS SHOP */}
          {activeTab === "decorations" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gradient-to-r from-[#5865F2]/20 to-purple-500/20 p-4 rounded-[8px] border border-[#5865F2]/30">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Sklep Animowanych Ozdób Profilu
                  </h4>
                  <p className="text-xs text-[#b5bac1]">
                    Zdobywaj punkty ToothPoints za pisanie wiadomości (+10 🦷) i odblokowuj aury!
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#949ba4] block uppercase font-bold">
                    Twój stan konta
                  </span>
                  <span className="text-base font-extrabold text-amber-400">
                    🦷 {userPoints.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Decorations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVATAR_DECORATIONS.map((dec) => {
                  const isUnlocked = unlockedList.includes(dec.id);
                  const isEquipped = selectedDecoration === dec.id;
                  const canAfford = userPoints >= dec.cost;
                  const isUltimate = dec.id === "perlowy_zab";

                  return (
                    <div
                      key={dec.id}
                      onClick={() => handleBuyOrEquipDecoration(dec)}
                      className={`p-3.5 rounded-[8px] border transition-all cursor-pointer flex items-center gap-3.5 relative overflow-hidden ${
                        isUltimate && !isEquipped
                          ? "bg-gradient-to-r from-amber-500/15 via-red-500/10 to-pink-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:border-amber-400"
                          : isEquipped
                          ? "bg-[#5865F2]/20 border-[#5865F2] shadow-[0_0_10px_rgba(88,101,242,0.3)]"
                          : isUnlocked
                          ? "bg-[#2b2d31] border-[#3f4147] hover:border-[#5865F2]/60"
                          : "bg-[#232428] border-[#2b2d31] hover:border-[#4e5058]"
                      }`}
                    >
                      {/* Avatar preview with this decoration */}
                      <div className="shrink-0">
                        <AvatarWithDecoration
                          avatarUrl={previewUrl}
                          displayName={currentUser.displayName}
                          avatarColor={currentUser.avatarColor}
                          decorationId={dec.id}
                          size="md"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className={`font-bold text-xs sm:text-sm truncate ${isUltimate ? "text-amber-300" : "text-white"}`}>
                            {dec.name}
                          </h5>
                          {isEquipped ? (
                            <span className="text-[10px] bg-[#23a55a] text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Założona
                            </span>
                          ) : isUltimate ? (
                            <span className="text-[9px] bg-gradient-to-r from-amber-500 to-red-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 animate-pulse">
                              ULTIMATE 💥
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[#949ba4] line-clamp-1 mb-1.5">
                          {dec.description}
                        </p>

                        {/* Action badge */}
                        <div className="flex items-center justify-between text-xs">
                          {isUnlocked ? (
                            <span className="text-[#23a55a] font-semibold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isEquipped ? "Kliknij, by zdjąć" : "Kliknij, by założyć"}
                            </span>
                          ) : (
                            <span
                              className={`font-bold flex items-center gap-1 text-[11px] ${
                                canAfford ? "text-amber-400" : "text-[#da373c]"
                              }`}
                            >
                              <span>🦷 {dec.cost.toLocaleString()} pkt</span>
                              {!canAfford && (
                                <span className="text-[10px] text-[#80848e] font-normal">
                                  (brak)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedDecoration && (
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedDecoration("");
                    if (onEquipDecoration) await onEquipDecoration(null);
                  }}
                  className="w-full py-2 bg-[#2b2d31] hover:bg-[#35373c] text-xs font-semibold text-[#949ba4] hover:text-white rounded border border-[#3f4147] transition-colors cursor-pointer"
                >
                  Zdejmij aktualną ozdobę profilu
                </button>
              )}
            </div>
          )}

          {/* TAB 4: DISCORD-LIKE PROFILE EFFECTS SHOP & EQUIPPED */}
          {activeTab === "effects" && (
            <div className="space-y-5">
              {/* Header with ToothPoints banner */}
              <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-[#5865F2]/20 p-4 rounded-[10px] border border-purple-500/40 shadow-inner">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Efekty Karty Profilu (Styl Discord)</span>
                    <span className="text-[10px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      NOWOŚĆ 2026
                    </span>
                  </h4>
                  <p className="text-xs text-[#b5bac1] mt-0.5">
                    Animacje przelatujących duchów, ptaków, płatków i ognia wypełniające całą planszę Twojego profilu!
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#949ba4] block uppercase font-bold">
                    Stan Konta
                  </span>
                  <span className="text-base font-extrabold text-amber-400 flex items-center justify-end gap-1">
                    <span>🦷</span>
                    <span>{userPoints.toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {/* Live Interactive Profile Card Preview with the Effect */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#949ba4]">
                  <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-[#dbdee1]">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Podgląd na żywo Twojej karty profilu:
                  </span>
                  {previewHoverEffect && (
                    <span className="text-purple-300 text-[11px] font-medium animate-pulse">
                      Testujesz: {PROFILE_EFFECTS.find((e) => e.id === previewHoverEffect)?.name}
                    </span>
                  )}
                </div>

                <div className="bg-[#232428] rounded-[14px] border border-purple-500/30 overflow-hidden shadow-2xl relative min-h-[160px]">
                  {/* Active or Hovered Profile Effect Canvas */}
                  {(previewHoverEffect || selectedProfileEffect) && (
                    <ProfileEffectCanvas
                      effectId={previewHoverEffect || selectedProfileEffect}
                      className="pointer-events-none absolute inset-0 z-20 opacity-95 rounded-[14px]"
                    />
                  )}

                  {/* Banner */}
                  <ProfileBannerView
                    bannerUrl={bannerUrl}
                    bannerColor={bannerColor}
                    fallbackColor={currentUser.avatarColor}
                    heightClass="h-24"
                  />

                  {/* Profile contents */}
                  <div className="px-5 pb-3.5 relative bg-[#232428]/95 z-10">
                    <div className="relative -top-10 mb-[-24px] flex items-end justify-between">
                      <div className="relative p-1 bg-[#232428] rounded-full inline-block">
                        <AvatarWithDecoration
                          avatarUrl={previewUrl}
                          displayName={currentUser.displayName}
                          avatarColor={currentUser.avatarColor}
                          decorationId={selectedDecoration}
                          status={currentUser.status}
                          size="lg"
                          showStatus={true}
                        />
                      </div>

                      {/* Status indicator pill */}
                      <div className="mb-2">
                        {selectedProfileEffect ? (
                          <span className="text-[11px] bg-purple-500/20 text-purple-200 border border-purple-500/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                            <span>{PROFILE_EFFECTS.find((e) => e.id === selectedProfileEffect)?.icon}</span>
                            <span>Założony: {PROFILE_EFFECTS.find((e) => e.id === selectedProfileEffect)?.name}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] bg-[#1e1f22] text-[#949ba4] px-2.5 py-1 rounded-full border border-[#2b2d31]">
                            Brak aktywnego efektu
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        {currentUser.displayName}
                      </p>
                      <p className="text-xs text-[#949ba4]">
                        {customStatus || "Animacja profilu będzie odtwarzana dla każdego, kto otworzy Twój profil!"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {["All", "Spooky", "Nature", "Fantasy", "Cyber", "Cosmic", "Luxury"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEffectsFilter(cat)}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                      effectsFilter === cat
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-[#2b2d31] text-[#949ba4] hover:text-white hover:bg-[#35373c]"
                    }`}
                  >
                    {cat === "All"
                      ? "Wszystkie"
                      : cat === "Spooky"
                      ? "👻 Duchy & Spooky"
                      : cat === "Nature"
                      ? "🌿 Natura & Ptaki"
                      : cat === "Fantasy"
                      ? "🔥 Smoczy Ogień"
                      : cat === "Cyber"
                      ? "⚡ Cyber & Matrix"
                      : cat === "Cosmic"
                      ? "🌌 Kosmos"
                      : "💰 Złoto CFX"}
                  </button>
                ))}
              </div>

              {/* Effects Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROFILE_EFFECTS.filter(
                  (eff) => effectsFilter === "All" || eff.category === effectsFilter
                ).map((effect) => {
                  const isUnlocked = unlockedEffectsList.includes(effect.id);
                  const isEquipped = selectedProfileEffect === effect.id;
                  const canAfford = userPoints >= effect.price;
                  const isTesting = previewHoverEffect === effect.id;

                  return (
                    <div
                      key={effect.id}
                      onMouseEnter={() => setPreviewHoverEffect(effect.id)}
                      onMouseLeave={() => setPreviewHoverEffect(null)}
                      className={`p-3.5 rounded-[10px] border transition-all flex flex-col justify-between relative overflow-hidden group ${
                        isEquipped
                          ? "bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                          : isUnlocked
                          ? "bg-[#2b2d31] border-[#3f4147] hover:border-purple-500/60"
                          : "bg-[#232428] border-[#2b2d31] hover:border-[#4e5058]"
                      }`}
                    >
                      {/* Top Row: Icon + Name + Tag */}
                      <div className="flex items-start gap-3">
                        {/* Animated Gradient Icon Bubble */}
                        <div
                          className={`w-12 h-12 rounded-[10px] flex items-center justify-center text-2xl shrink-0 shadow-md bg-gradient-to-br ${effect.previewBg} border border-white/10`}
                        >
                          <span className="transform group-hover:scale-125 transition-transform duration-300">
                            {effect.icon}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-bold text-sm text-white truncate">
                              {effect.name}
                            </h5>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                              {effect.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#949ba4] line-clamp-2 mt-0.5">
                            {effect.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Controls Row */}
                      <div className="mt-3 pt-2.5 border-t border-[#35373c]/50 flex items-center justify-between gap-2">
                        {/* Price / Unlocked badge */}
                        <div>
                          {isUnlocked ? (
                            <span className="text-[#23a55a] font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Odblokowane</span>
                            </span>
                          ) : (
                            <span
                              className={`font-extrabold text-xs flex items-center gap-1 ${
                                canAfford ? "text-amber-400" : "text-[#da373c]"
                              }`}
                            >
                              <span>🦷 {effect.price.toLocaleString()} pkt</span>
                              {!canAfford && (
                                <span className="text-[10px] text-[#80848e] font-normal">
                                  (brak)
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewHoverEffect((prev) => (prev === effect.id ? null : effect.id))
                            }
                            className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                              isTesting
                                ? "bg-purple-500 text-white"
                                : "bg-[#1e1f22] text-[#949ba4] hover:text-white"
                            }`}
                            title="Przetestuj animację na podglądzie powyżej"
                          >
                            {isTesting ? "Testujesz 👀" : "Podgląd"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBuyOrEquipProfileEffect(effect)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1 ${
                              isEquipped
                                ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                                : isUnlocked
                                ? "bg-[#23a55a] hover:bg-[#1f934f] text-white"
                                : canAfford
                                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                                : "bg-[#35373c] opacity-50 cursor-not-allowed text-[#949ba4]"
                            }`}
                          >
                            {isEquipped
                              ? "Zdejmij"
                              : isUnlocked
                              ? "Załóż efekt"
                              : "Kup efekt"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedProfileEffect && (
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedProfileEffect("");
                    if (onEquipProfileEffect) await onEquipProfileEffect(null);
                  }}
                  className="w-full py-2 bg-[#2b2d31] hover:bg-[#35373c] text-xs font-semibold text-[#949ba4] hover:text-white rounded border border-[#3f4147] transition-colors cursor-pointer"
                >
                  Zdejmij aktualny efekt profilu
                </button>
              )}
            </div>
          )}

          {/* TAB 5: PROMO CODES & FREE POINTS */}
          {activeTab === "promo" && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 p-5 rounded-[8px] border border-amber-500/30 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto mb-2.5">
                  <Gift className="w-6 h-6 animate-bounce" />
                </div>
                <h4 className="font-extrabold text-white text-base mb-1">
                  Sekretne Kody Promocyjne na ToothPoints!
                </h4>
                <p className="text-xs text-[#dbdee1] max-w-md mx-auto">
                  Wpisz sekretny kod od administracji lub dewelopera, aby natychmiast otrzymać
                  tysiące punktów na zakup wszystkich animowanych ozdób!
                </p>
              </div>

              {/* Promo Code Form */}
              <form onSubmit={handleRedeemPromo} className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4]">
                  Wpisz Kod Promocyjny
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="np. TOOTH-RICH-777"
                    className="flex-1 bg-[#1e1f22] text-amber-300 font-mono tracking-wider px-3.5 py-2.5 rounded-[4px] border border-[#202225] focus:border-amber-400 focus:outline-none text-sm placeholder:text-[#80848e] uppercase"
                  />
                  <button
                    type="submit"
                    disabled={!promoInput.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-bold text-xs sm:text-sm rounded-[4px] shadow-md transition-all cursor-pointer shrink-0"
                  >
                    Aktywuj Kod ✨
                  </button>
                </div>

                {promoFeedback && (
                  <div
                    className={`p-3 rounded-[6px] text-xs font-semibold flex items-center gap-2 border ${
                      promoFeedback.success
                        ? "bg-[#23a55a]/15 text-[#23a55a] border-[#23a55a]/30"
                        : "bg-[#da373c]/15 text-[#da373c] border-[#da373c]/30"
                    }`}
                  >
                    {promoFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 shrink-0" />
                    )}
                    <span>{promoFeedback.message}</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 5: ACCOUNT MANAGEMENT & DANGER ZONE */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="bg-[#1e1f22] p-4 rounded-[8px] border border-[#232428] space-y-3">
                <h4 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                  Informacje o Koncie
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#2b2d31] p-3 rounded border border-[#35373c]">
                    <span className="text-[#949ba4] block text-[10px]">Nazwa użytkownika</span>
                    <span className="font-bold text-white text-sm">{currentUser.displayName}</span>
                  </div>
                  <div className="bg-[#2b2d31] p-3 rounded border border-[#35373c]">
                    <span className="text-[#949ba4] block text-[10px]">Adres Email</span>
                    <span className="font-bold text-white text-sm">{currentUser.email || "Brak"}</span>
                  </div>
                  <div className="bg-[#2b2d31] p-3 rounded border border-[#35373c]">
                    <span className="text-[#949ba4] block text-[10px]">Identyfikator (ID)</span>
                    <span className="font-mono text-[#dbdee1] text-[11px] truncate block">{currentUser.id}</span>
                  </div>
                  <div className="bg-[#2b2d31] p-3 rounded border border-[#35373c]">
                    <span className="text-[#949ba4] block text-[10px]">ToothPoints</span>
                    <span className="font-bold text-amber-400 text-sm font-mono">{userPoints.toLocaleString()} 🦷</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-[#da373c]/10 border border-[#da373c]/30 p-5 rounded-[8px] space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-[#da373c]" />
                  <h4 className="text-sm font-bold text-[#da373c] uppercase tracking-wider">
                    Strefa Niebezpieczna — Usunięcie Konta
                  </h4>
                </div>

                <p className="text-xs text-[#dbdee1] leading-relaxed">
                  Usunięcie konta jest <strong className="text-white">nieodwracalne</strong>. Twoje konto zostanie trwale usunięte z bazy danych Firebase, a Ty zostaniesz usunięty ze wszystkich serwerów.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isDeletingAccount}
                    onClick={async () => {
                      if (currentUser.displayName.toLowerCase() === "cfx" || currentUser.id === "usr_cfx_admin") {
                        alert("Główne konto administratora (cfx) nie może zostać usunięte!");
                        return;
                      }
                      if (
                        confirm(
                          "CZY NA PEWNO CHCESZ TRWALE USUNĄĆ SWOJE KONTO?\n\nTej operacji nie można cofnąć. Wszystkie Twoje dane zostaną bezpowrotnie usunięte."
                        )
                      ) {
                        try {
                          setIsDeletingAccount(true);
                          if (onDeleteAccount) {
                            await onDeleteAccount();
                          }
                          onClose();
                        } catch (e) {
                          console.error("Błąd podczas usuwania konta:", e);
                          alert("Wystąpił błąd podczas usuwania konta.");
                        } finally {
                          setIsDeletingAccount(false);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-[#da373c] hover:bg-[#c03135] disabled:opacity-50 text-white text-xs font-bold rounded-[4px] flex items-center gap-2 transition-colors cursor-pointer shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeletingAccount ? "Usuwanie konta..." : "Usuń Moje Konto Trwale"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#202225] bg-[#2b2d31] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-white hover:underline cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-sm font-semibold rounded-[4px] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? "Zapisywanie..." : "Zapisz i zastosuj"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

