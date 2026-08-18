import React from "react";
import { Image as ImageIcon, Sparkles, Camera } from "lucide-react";

export interface ProfileBannerPreset {
  id: string;
  name: string;
  category: string;
  cssBackground: string;
  previewGradient: string;
  badge?: string;
}

export const PROFILE_BANNER_PRESETS: ProfileBannerPreset[] = [
  {
    id: "preset_supernova",
    name: "Eksplozja Supernowej 💥",
    category: "Ogień & Kosmos",
    cssBackground: "radial-gradient(ellipse at center, #ff0055 0%, #7928ca 45%, #000000 100%)",
    previewGradient: "from-pink-600 via-purple-600 to-black",
    badge: "HOT 🔥",
  },
  {
    id: "preset_nebula",
    name: "Kosmiczna Mgławica 🌌",
    category: "Kosmos",
    cssBackground: "radial-gradient(circle at top right, #3b82f6, #8b5cf6 50%, #090a0f 100%)",
    previewGradient: "from-blue-500 via-purple-500 to-slate-950",
  },
  {
    id: "preset_synthwave",
    name: "Neon Synthwave 🌆",
    category: "Retro & Neon",
    cssBackground: "linear-gradient(135deg, #ff007f 0%, #7928ca 50%, #00d2ff 100%)",
    previewGradient: "from-rose-500 via-purple-600 to-cyan-400",
  },
  {
    id: "preset_emerald_abyss",
    name: "Szmaragdowa Otchłań 🐉",
    category: "Natura & Magia",
    cssBackground: "linear-gradient(135deg, #059669 0%, #064e3b 60%, #022c22 100%)",
    previewGradient: "from-emerald-500 via-teal-800 to-emerald-950",
  },
  {
    id: "preset_gold_royale",
    name: "Królewski Złoty Ząb 👑",
    category: "Luksus",
    cssBackground: "linear-gradient(135deg, #d97706 0%, #fbbf24 35%, #78350f 70%, #451a03 100%)",
    previewGradient: "from-amber-600 via-yellow-400 to-amber-950",
    badge: "ROYAL 👑",
  },
  {
    id: "preset_cyber_matrix",
    name: "Cyber Matrix ⚡",
    category: "Technologia",
    cssBackground: "radial-gradient(circle at center, #10b981 0%, #065f46 40%, #051410 100%)",
    previewGradient: "from-emerald-400 via-teal-900 to-black",
  },
  {
    id: "preset_sakura_twilight",
    name: "Sakura Dream 🌸",
    category: "Anime & Pastel",
    cssBackground: "linear-gradient(135deg, #f472b6 0%, #ec4899 40%, #831843 100%)",
    previewGradient: "from-pink-400 via-pink-600 to-rose-950",
  },
  {
    id: "preset_dark_obsidian",
    name: "Ciemny Obsydian 🖤",
    category: "Minimalizm",
    cssBackground: "linear-gradient(135deg, #27272a 0%, #18181b 50%, #09090b 100%)",
    previewGradient: "from-zinc-700 via-zinc-800 to-zinc-950",
  },
  {
    id: "preset_pearl_aurora",
    name: "Boska Perłowa Zorza ✨",
    category: "Legendarne",
    cssBackground: "linear-gradient(135deg, #a855f7 0%, #6366f1 35%, #ec4899 70%, #f59e0b 100%)",
    previewGradient: "from-purple-500 via-indigo-500 to-amber-400",
    badge: "LEGEND ✨",
  },
  {
    id: "preset_flame_inferno",
    name: "Piekielny Żar 🔥",
    category: "Żywioły",
    cssBackground: "linear-gradient(135deg, #ea580c 0%, #dc2626 40%, #7f1d1d 100%)",
    previewGradient: "from-orange-500 via-red-600 to-red-950",
  },
];

export function getBannerStyle(
  bannerUrl?: string,
  bannerColor?: string,
  fallbackColor?: string
): React.CSSProperties {
  if (bannerUrl) {
    if (bannerUrl.startsWith("preset:")) {
      const presetId = bannerUrl.replace("preset:", "");
      const found = PROFILE_BANNER_PRESETS.find((p) => p.id === presetId);
      if (found) {
        return {
          backgroundImage: found.cssBackground,
          backgroundColor: "#1e1f22",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        };
      }
    } else {
      return {
        backgroundImage: `url(${bannerUrl})`,
        backgroundColor: bannerColor || fallbackColor || "#2b2d31",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
  }

  if (bannerColor) {
    return {
      backgroundImage: "none",
      backgroundColor: bannerColor,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  return {
    backgroundImage: fallbackColor
      ? `linear-gradient(135deg, ${fallbackColor} 0%, #1e1f22 100%)`
      : "linear-gradient(135deg, #5865F2 0%, #2b2d31 100%)",
    backgroundColor: fallbackColor || "#5865F2",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}

interface ProfileBannerViewProps {
  bannerUrl?: string;
  bannerColor?: string;
  fallbackColor?: string;
  heightClass?: string;
  isEditable?: boolean;
  onEdit?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const ProfileBannerView: React.FC<ProfileBannerViewProps> = ({
  bannerUrl,
  bannerColor,
  fallbackColor,
  heightClass = "h-28",
  isEditable = false,
  onEdit,
  className = "",
  children,
}) => {
  const isImage = bannerUrl && !bannerUrl.startsWith("preset:");
  const style = getBannerStyle(bannerUrl, bannerColor, fallbackColor);

  return (
    <div
      className={`w-full relative overflow-hidden select-none transition-all ${heightClass} ${className}`}
      style={style}
    >
      {/* Decorative gradient overlay at bottom for smooth contrast into avatar */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent pointer-events-none" />

      {/* Top subtle shine / vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />

      {/* Edit button if owner */}
      {isEditable && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Zmień baner profilu"
          className="absolute top-2.5 right-10 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold rounded-full border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <Camera className="w-3.5 h-3.5 text-amber-300" />
          <span>Edytuj baner</span>
        </button>
      )}

      {children}
    </div>
  );
};
