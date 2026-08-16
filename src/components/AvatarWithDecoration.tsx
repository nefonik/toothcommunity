import React from "react";
import { ToothLogoIcon } from "./ToothIcons";
import { UserIdentity } from "../types";

export interface AvatarDecorationDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: "legendary" | "epic" | "rare";
}

export const AVATAR_DECORATIONS: AvatarDecorationDef[] = [
  {
    id: "fire_flames",
    name: "Płomienie Ognia",
    description: "Animowany, pulsujący ognisty płomień z gorącymi iskrami",
    cost: 100,
    icon: "🔥",
    category: "rare",
  },
  {
    id: "neon_cyber",
    name: "Cyber Neon Ring",
    description: "Obracający się neonowy pierścień z matrycą elektryczną",
    cost: 200,
    icon: "⚡",
    category: "rare",
  },
  {
    id: "golden_crown",
    name: "Złota Korona Władcy",
    description: "Mistyczna, lewitująca korona z błyszczącymi diamentami",
    cost: 350,
    icon: "👑",
    category: "epic",
  },
  {
    id: "sakura_blossom",
    name: "Płatki Wiśni Sakura",
    description: "Subtelna, wirująca aura różowych płatków japońskiej sakury",
    cost: 400,
    icon: "🌸",
    category: "rare",
  },
  {
    id: "cosmic_galaxy",
    name: "Kosmiczna Galaktyka",
    description: "Wirująca mgławica gwiezdna w odcieniach głębokiego fioletu",
    cost: 500,
    icon: "🌌",
    category: "epic",
  },
  {
    id: "diamond_frost",
    name: "Diamentowy Mróz",
    description: "Krystaliczna tarcza lodowa z mieniącymi się refleksami",
    cost: 650,
    icon: "💎",
    category: "epic",
  },
  {
    id: "rainbow_aura",
    name: "Tęczowa Aura RGB",
    description: "Dynamiczny, wielobarwny pierścień spektralnego światła",
    cost: 800,
    icon: "🌈",
    category: "legendary",
  },
  {
    id: "pixel_tooth",
    name: "Legendarny Złoty Ząb",
    description: "Epicka korona zębowa z błyskawicami i złotym blaskiem",
    cost: 1000,
    icon: "🦷",
    category: "legendary",
  },
];

interface AvatarWithDecorationProps {
  user?: Partial<UserIdentity> | null;
  avatarUrl?: string;
  displayName?: string;
  avatarColor?: string;
  decorationId?: string;
  status?: "online" | "idle" | "dnd" | "offline";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AvatarWithDecoration: React.FC<AvatarWithDecorationProps> = ({
  user,
  avatarUrl,
  displayName,
  avatarColor,
  decorationId,
  status,
  size = "md",
  showStatus = false,
  className = "",
  onClick,
}) => {
  const url = avatarUrl ?? user?.avatarUrl;
  const name = displayName ?? user?.displayName ?? "Użytkownik";
  const bg = avatarColor ?? user?.avatarColor ?? "#5865F2";
  const activeDecoration = decorationId ?? user?.avatarDecoration;
  const userStatus = status ?? user?.status;

  // Size mapping
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-24 h-24 text-3xl",
  };

  const statusDotSizes = {
    xs: "w-2 h-2 -bottom-0.5 -right-0.5 border-[1.5px]",
    sm: "w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-2",
    md: "w-3.5 h-3.5 -bottom-0.5 -right-0.5 border-2",
    lg: "w-5 h-5 bottom-0 right-0 border-[3px]",
    xl: "w-6 h-6 bottom-0.5 right-0.5 border-[3px]",
  };

  const statusColors = {
    online: "bg-[#23a55a]",
    idle: "bg-[#f0b232]",
    dnd: "bg-[#f23f43]",
    offline: "bg-[#80848e]",
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* 1. Base Avatar Container */}
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-md relative z-10`}
        style={{ backgroundColor: bg }}
      >
        {url ? (
          <img
            src={url}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <ToothLogoIcon className="w-3/5 h-3/5 text-white drop-shadow" />
        )}
      </div>

      {/* 2. Animated Avatar Decoration Overlays */}
      {activeDecoration === "fire_flames" && (
        <div className="absolute -inset-1.5 rounded-full pointer-events-none z-20 overflow-visible animate-pulse">
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/80 shadow-[0_0_12px_#ff4500] animate-spin [animation-duration:8s]" />
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs drop-shadow-[0_0_8px_#ff4500] animate-bounce [animation-duration:1.5s]">
            🔥
          </span>
        </div>
      )}

      {activeDecoration === "neon_cyber" && (
        <div className="absolute -inset-1.5 rounded-full pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/90 shadow-[0_0_14px_#00ffff,inset_0_0_6px_#00ffff] animate-spin [animation-duration:4s]" />
          <div className="absolute -inset-0.5 rounded-full border border-fuchsia-500/60 animate-ping [animation-duration:3s]" />
          <span className="absolute -top-1.5 -right-1 text-[10px] drop-shadow-[0_0_6px_#00ffff]">
            ⚡
          </span>
        </div>
      )}

      {activeDecoration === "golden_crown" && (
        <div className="absolute -inset-1.5 rounded-full pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 shadow-[0_0_14px_#ffd700]" />
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-sm drop-shadow-[0_0_10px_#ffd700] animate-bounce [animation-duration:2s]">
            👑
          </div>
          <span className="absolute -bottom-1 -right-0.5 text-[9px] drop-shadow-[0_0_4px_#ffd700]">
            ✨
          </span>
        </div>
      )}

      {activeDecoration === "sakura_blossom" && (
        <div className="absolute -inset-1.5 rounded-full pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-pink-400/80 shadow-[0_0_12px_#ff69b4] animate-spin [animation-duration:12s]" />
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs drop-shadow-[0_0_6px_#ff69b4]">
            🌸
          </span>
          <span className="absolute -bottom-1 -left-1 text-[10px] animate-pulse">
            🌸
          </span>
        </div>
      )}

      {activeDecoration === "cosmic_galaxy" && (
        <div className="absolute -inset-2 rounded-full pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/90 shadow-[0_0_16px_#8a2be2,inset_0_0_8px_#4b0082] animate-spin [animation-duration:6s]" />
          <span className="absolute -top-2 left-1 text-xs drop-shadow-[0_0_8px_#da70d6] animate-pulse">
            🌌
          </span>
          <span className="absolute -bottom-1 right-0 text-[10px]">✨</span>
        </div>
      )}

      {activeDecoration === "diamond_frost" && (
        <div className="absolute -inset-1.5 rounded-full pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-200 shadow-[0_0_15px_#7df9ff] animate-pulse [animation-duration:2s]" />
          <div className="absolute -top-2 right-1 text-xs drop-shadow-[0_0_8px_#00ffff]">
            💎
          </div>
          <span className="absolute -bottom-1.5 left-0 text-[10px] animate-spin [animation-duration:5s]">
            ❄️
          </span>
        </div>
      )}

      {activeDecoration === "rainbow_aura" && (
        <div className="absolute -inset-2 rounded-full pointer-events-none z-20">
          <div
            className="absolute inset-0 rounded-full p-[2.5px] animate-spin [animation-duration:3s]"
            style={{
              background:
                "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          <div className="absolute inset-0 rounded-full shadow-[0_0_12px_#ff00ff] opacity-60" />
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[11px]">
            🌈
          </span>
        </div>
      )}

      {activeDecoration === "pixel_tooth" && (
        <div className="absolute -inset-2 rounded-full pointer-events-none z-20">
          <div className="absolute inset-0 rounded-full border-2 border-yellow-300 shadow-[0_0_16px_#ffd700,inset_0_0_6px_#ffd700] animate-pulse [animation-duration:1.5s]" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm drop-shadow-[0_0_10px_#ffd700] animate-bounce">
            🦷
          </div>
          <span className="absolute -bottom-1.5 right-0 text-[10px] drop-shadow-[0_0_6px_#ffd700]">
            ⚡
          </span>
        </div>
      )}

      {/* 3. Status Dot */}
      {showStatus && userStatus && (
        <span
          className={`absolute rounded-full border-[#1e1f22] z-30 ${
            statusDotSizes[size]
          } ${statusColors[userStatus] || statusColors.offline}`}
          title={`Status: ${userStatus}`}
        />
      )}
    </div>
  );
};
