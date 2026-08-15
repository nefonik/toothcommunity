import React, { useState } from "react";
import {
  ToothLogoIcon,
  ToothShieldIcon,
  ToothPlusIcon,
  ToothSpeakerIcon,
} from "./ToothIcons";
import {
  Users,
  BookOpen,
  Plus,
} from "lucide-react";
import { ServerGuild } from "../types";

interface NavigationSidebarProps {
  activeTab: "server" | "dms" | "friends" | "crypto" | "docs" | "voice";
  setActiveTab: (tab: "server" | "dms" | "friends" | "crypto" | "docs" | "voice") => void;
  servers: ServerGuild[];
  activeServer: ServerGuild | null;
  onSelectServer: (server: ServerGuild) => void;
  onOpenCreateServer: () => void;
  unreadCount?: number;
  activeVoiceRoom?: string | null;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  setActiveTab,
  servers,
  activeServer,
  onSelectServer,
  onOpenCreateServer,
  activeVoiceRoom,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      id="discord-guild-rail"
      className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 select-none z-30 shrink-0 gap-2 h-full"
    >
      {/* 1. ToothChat Discord Direct Messages / Home Button (Duszek / Ząb) */}
      <div className="relative group flex items-center justify-center w-full">
        <div
          className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            activeTab === "dms"
              ? "h-10"
              : hoveredItem === "home"
              ? "h-5"
              : "h-0"
          }`}
        />

        <button
          id="btn-toothchat-home"
          onClick={() => setActiveTab("dms")}
          onMouseEnter={() => setHoveredItem("home")}
          onMouseLeave={() => setHoveredItem(null)}
          title="Wiadomości bezpośrednie i znajomi (ToothChat)"
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === "dms"
              ? "bg-[#5865f2] rounded-[16px] text-white shadow-lg"
              : "bg-[#313338] text-[#dbdee1] rounded-[24px] hover:rounded-[16px] hover:bg-[#5865f2] hover:text-white"
          }`}
        >
          <ToothLogoIcon className="w-7 h-7" />
        </button>
      </div>

      {/* Discord Divider Line */}
      <div className="w-8 h-[2px] bg-[#35363c] rounded-[1px] my-0.5" />

      {/* 2. Servers / Guilds List */}
      <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {servers.map((server) => {
          const isSelected = activeTab === "server" && activeServer?.id === server.id;
          const isHovered = hoveredItem === server.id;

          return (
            <div key={server.id} className="relative group flex items-center justify-center w-full">
              <div
                className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isSelected
                    ? "h-10"
                    : isHovered
                    ? "h-5"
                    : "h-0"
                }`}
              />
              <button
                id={`guild-${server.id}`}
                onClick={() => {
                  onSelectServer(server);
                  setActiveTab("server");
                }}
                onMouseEnter={() => setHoveredItem(server.id)}
                onMouseLeave={() => setHoveredItem(null)}
                title={`Serwer: ${server.name}`}
                className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? "bg-[#5865f2] rounded-[16px] text-white shadow-md"
                    : "bg-[#313338] text-[#dbdee1] rounded-[24px] hover:rounded-[16px] hover:bg-[#5865f2] hover:text-white"
                }`}
              >
                {server.icon && (server.icon.length <= 4 || server.icon.startsWith("http")) ? (
                  <span className="text-xl">{server.icon}</span>
                ) : (
                  <div className="flex flex-col items-center justify-center font-bold text-xs">
                    <ToothShieldIcon className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-black tracking-tighter">
                      {server.name.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Global Voice Mesh Room shortcut */}
        <div className="relative group flex items-center justify-center w-full">
          <div
            className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
              activeTab === "voice"
                ? "h-10"
                : hoveredItem === "voice"
                ? "h-5"
                : "h-0"
            }`}
          />
          <button
            id="guild-voice-mesh"
            onClick={() => setActiveTab("voice")}
            onMouseEnter={() => setHoveredItem("voice")}
            onMouseLeave={() => setHoveredItem(null)}
            title="Kanał Głosowy Mesh (WebRTC Full-Mesh)"
            className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              activeTab === "voice"
                ? "bg-[#23a55a] rounded-[16px] text-white"
                : activeVoiceRoom
                ? "bg-[#23a55a]/20 text-[#23a55a] rounded-[16px] border border-[#23a55a]/40 animate-pulse"
                : "bg-[#313338] text-[#dbdee1] rounded-[24px] hover:rounded-[16px] hover:bg-[#23a55a] hover:text-white"
            }`}
          >
            <ToothSpeakerIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Discord Add Server Button (+) */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={onOpenCreateServer}
            title="Dodaj serwer"
            className="w-12 h-12 bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 cursor-pointer group shadow"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
          </button>
        </div>
      </div>

      {/* Architecture Masterclass Docs Button */}
      <div className="relative group flex items-center justify-center w-full shrink-0">
        <button
          id="guild-docs"
          onClick={() => setActiveTab("docs")}
          title="Dokumentacja ToothChat"
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === "docs"
              ? "bg-[#5865f2] rounded-[16px] text-white shadow-lg"
              : "bg-[#313338] text-[#949ba4] rounded-[24px] hover:rounded-[16px] hover:bg-[#5865f2] hover:text-white"
          }`}
        >
          <BookOpen className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

