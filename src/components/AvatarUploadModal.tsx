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
} from "lucide-react";
import { UserIdentity } from "../types";
import {
  AvatarWithDecoration,
  AVATAR_DECORATIONS,
  AvatarDecorationDef,
} from "./AvatarWithDecoration";

interface AvatarUploadModalProps {
  isOpen?: boolean;
  currentUser: UserIdentity;
  onClose: () => void;
  onSaveAvatar?: (
    avatarUrl: string,
    customStatus?: string,
    avatarDecoration?: string
  ) => Promise<void> | void;
  onSave?: (
    avatarUrl: string,
    customStatus?: string,
    avatarDecoration?: string
  ) => Promise<void> | void;
  onRedeemCode?: (
    code: string
  ) => Promise<{ success: boolean; message: string; pointsAdded?: number; newBalance?: number }>;
  onUnlockDecoration?: (
    decorationId: string,
    cost: number
  ) => Promise<{ success: boolean; message: string; newBalance?: number }>;
  onEquipDecoration?: (decorationId: string | null) => Promise<void>;
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
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<"avatar" | "decorations" | "promo" | "account">("avatar");
  const [previewUrl, setPreviewUrl] = useState<string>(currentUser?.avatarUrl || "");
  const [customStatus, setCustomStatus] = useState<string>(currentUser?.customStatus || "");
  const [selectedDecoration, setSelectedDecoration] = useState<string>(
    currentUser?.avatarDecoration || ""
  );
  const [userPoints, setUserPoints] = useState<number>(currentUser?.points ?? 150);
  const [unlockedList, setUnlockedList] = useState<string[]>(
    currentUser?.unlockedDecorations || []
  );
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [promoInput, setPromoInput] = useState("");
  const [promoFeedback, setPromoFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

            // Center square crop
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

            // Compress to lightweight webp / jpeg
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
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
        await onSave(previewUrl, customStatus, selectedDecoration);
      } else if (onSaveAvatar) {
        await onSaveAvatar(previewUrl, customStatus, selectedDecoration);
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
      // Toggle equip / unequip
      const nextDec = selectedDecoration === dec.id ? "" : dec.id;
      setSelectedDecoration(nextDec);
      if (onEquipDecoration) {
        await onEquipDecoration(nextDec || null);
      }
    } else {
      // Buy
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

  if (isOpen === false || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#313338] border border-[#202225] rounded-[10px] shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202225] bg-[#2b2d31]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg tracking-tight">
                Personalizacja Profilu & Ozdoby
              </h3>
              <p className="text-xs text-[#949ba4]">
                Zmień zdjęcie, wybierz animowaną ozdobę lub odbierz punkty
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
        <div className="flex border-b border-[#202225] bg-[#2b2d31]/50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab("avatar")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "avatar"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Zdjęcie & Status</span>
          </button>

          <button
            onClick={() => setActiveTab("decorations")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "decorations"
                ? "border-[#5865F2] text-white"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Sklep Animacji ({AVATAR_DECORATIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("promo")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "promo"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-[#949ba4] hover:text-amber-400"
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Kody na Punkty 🎁</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "account"
                ? "border-[#da373c] text-[#da373c]"
                : "border-transparent text-[#949ba4] hover:text-[#da373c]"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Konto</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* TAB 1: AVATAR & STATUS */}
          {activeTab === "avatar" && (
            <div className="space-y-6">
              {/* Avatar Live Preview */}
              <div className="flex flex-col items-center justify-center gap-3 bg-[#2b2d31]/40 p-4 rounded-[8px] border border-[#202225]">
                <div className="relative">
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
                    <Camera className="w-6 h-6 mb-1" />
                    Zmień
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                    {currentUser.displayName}
                    {selectedDecoration && (
                      <span className="text-xs bg-[#5865F2]/30 text-[#8ea1e1] px-2 py-0.5 rounded-full border border-[#5865F2]/40">
                        {AVATAR_DECORATIONS.find((d) => d.id === selectedDecoration)?.name}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[#949ba4]">
                    {customStatus ? `"${customStatus}"` : "Brak ustawionego statusu"}
                  </p>
                </div>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewUrl("")}
                    className="text-xs text-[#da373c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Usuń zdjęcie (przywróć domyślny ząb)
                  </button>
                )}
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
                className={`border-2 border-dashed rounded-[8px] p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-[#5865F2] bg-[#5865F2]/10"
                    : "border-[#4e5058] hover:border-[#5865F2] bg-[#2b2d31]/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-7 h-7 text-[#949ba4] mb-2" />
                <p className="text-sm font-medium text-white mb-0.5">
                  Wybierz plik ze zdjęciem lub przeciągnij tutaj
                </p>
                <p className="text-xs text-[#949ba4]">
                  Obsługiwane formaty: PNG, JPG, GIF, WebP (maks. 5MB)
                </p>
              </div>

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
                  className="w-full bg-[#1e1f22] text-white px-3.5 py-2.5 rounded-[4px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
                />
                <p className="text-[11px] text-[#949ba4]">
                  Zdjęcie i status są synchronizowane w czasie rzeczywistym z całą siecią.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ANIMATED DECORATIONS SHOP */}
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

          {/* TAB 3: PROMO CODES & FREE POINTS */}
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

          {/* TAB 4: ACCOUNT MANAGEMENT & DANGER ZONE */}
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
