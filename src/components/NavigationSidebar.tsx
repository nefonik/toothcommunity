import React, { useState, useEffect, useRef } from "react";
import {
  ToothLogoIcon,
  ToothShieldIcon,
  ToothCrownIcon,
  ToothSpeakerIcon,
} from "./ToothIcons";
import {
  Plus,
  ShieldAlert,
  LogOut,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Settings,
  Bell,
  X,
  AlertTriangle,
} from "lucide-react";
import { ServerGuild, UserIdentity } from "../types";
import { AvatarWithDecoration } from "./AvatarWithDecoration";

interface NavigationSidebarProps {
  activeTab: "server" | "dms" | "friends" | "crypto" | "voice";
  setActiveTab: (tab: "server" | "dms" | "friends" | "crypto" | "voice") => void;
  servers: ServerGuild[];
  activeServer: ServerGuild | null;
  onSelectServer: (server: ServerGuild) => void;
  onOpenCreateServer: () => void;
  unreadCount?: number;
  activeVoiceRoom?: string | null;
  currentUser?: UserIdentity | null;
  recentDmSenders?: UserIdentity[];
  activeDmUser?: UserIdentity | null;
  onSelectDmUser?: (user: UserIdentity) => void;
  onDismissDmSender?: (senderId: string) => void;
  onOpenAdminPanel?: () => void;
  onLeaveServer?: (serverId: string) => Promise<void> | void;
  onOpenInviteModal?: (server?: ServerGuild) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  setActiveTab,
  servers,
  activeServer,
  onSelectServer,
  onOpenCreateServer,
  activeVoiceRoom,
  currentUser,
  recentDmSenders = [],
  activeDmUser,
  onSelectDmUser,
  onDismissDmSender,
  onOpenAdminPanel,
  onLeaveServer,
  onOpenInviteModal,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Context Menu State for Server Right Click
  const [contextMenu, setContextMenu] = useState<{
    server: ServerGuild;
    x: number;
    y: number;
  } | null>(null);

  // Leave Confirmation Dialog State
  const [serverToLeave, setServerToLeave] = useState<ServerGuild | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isSuperadmin =
    currentUser?.email === "cfx@gmail.com" ||
    currentUser?.email === "antekzagora@gmail.com" ||
    currentUser?.displayName?.toLowerCase() === "cfx" ||
    currentUser?.role === "superadmin" ||
    currentUser?.role === "admin";

  // Close context menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const handleServerContextMenu = (e: React.MouseEvent, server: ServerGuild) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate position keeping it within screen bounds
    const x = Math.min(e.clientX + 5, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 200);

    setContextMenu({ server, x, y });
  };

  const handleCopyServerId = (serverId: string) => {
    navigator.clipboard?.writeText(serverId);
    setCopiedId(true);
    setTimeout(() => {
      setCopiedId(false);
      setContextMenu(null);
    }, 1200);
  };

  const handleConfirmLeave = async () => {
    if (!serverToLeave || !onLeaveServer) return;
    const sId = serverToLeave.id;
    setServerToLeave(null);
    setContextMenu(null);
    await onLeaveServer(sId);
  };

  return (
    <aside
      id="discord-guild-rail"
      className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 select-none z-30 shrink-0 gap-2 h-full relative"
    >
      {/* 1. ToothChat Discord Direct Messages / Home Button (Duszek / Ząb) */}
      <div className="relative group flex items-center justify-center w-full">
        <div
          className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
            activeTab === "dms" && !activeDmUser
              ? "h-10"
              : hoveredItem === "home"
              ? "h-5"
              : "h-0"
          }`}
        />

        <button
          id="btn-toothchat-home"
          onClick={() => {
            setActiveTab("dms");
            if (onSelectDmUser && activeDmUser) {
              // Stay in DMs or switch to home
            }
          }}
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

      {/* 1b. Sender Avatars Under Ghost Icon (Pokazuje profilowe osób, które do nas napisały) */}
      {recentDmSenders.length > 0 && (
        <div className="flex flex-col gap-1.5 w-full items-center">
          {recentDmSenders.map((sender) => {
            const isCurrentDm = activeTab === "dms" && activeDmUser?.id === sender.id;
            return (
              <div key={sender.id} className="relative group flex items-center justify-center w-full">
                <div
                  className={`absolute left-0 w-1 bg-white rounded-r-full transition-all duration-200 ${
                    isCurrentDm ? "h-10" : hoveredItem === `dm_${sender.id}` ? "h-5" : "h-0"
                  }`}
                />
                <button
                  onClick={() => {
                    if (onDismissDmSender) onDismissDmSender(sender.id);
                    if (onSelectDmUser) onSelectDmUser(sender);
                    setActiveTab("dms");
                  }}
                  onMouseEnter={() => setHoveredItem(`dm_${sender.id}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={`Wiadomość prywatna od: ${sender.displayName} (Kliknij, aby odczytać)`}
                  className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
                    isCurrentDm
                      ? "rounded-[16px] ring-2 ring-[#5865F2] ring-offset-2 ring-offset-[#1e1f22]"
                      : "rounded-[24px] hover:rounded-[16px]"
                  }`}
                >
                  <AvatarWithDecoration
                    user={sender}
                    avatarUrl={sender.avatarUrl}
                    displayName={sender.displayName}
                    avatarColor={sender.avatarColor}
                    decorationId={sender.avatarDecoration}
                    status={sender.status || "online"}
                    size="md"
                    showStatus={true}
                  />
                  {/* Glowing unread badge */}
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#da373c] rounded-full border-2 border-[#1e1f22] flex items-center justify-center animate-pulse" />
                </button>

                {/* Instant dismiss X button on hover/tap */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDismissDmSender) onDismissDmSender(sender.id);
                  }}
                  title="Oznacz jako przeczytane i usuń powiadomienie"
                  className="absolute -top-1 -left-1 w-4 h-4 bg-[#2b2d31] hover:bg-[#da373c] text-[#949ba4] hover:text-white rounded-full border border-[#1e1f22] flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

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
                onContextMenu={(e) => handleServerContextMenu(e, server)}
                onMouseEnter={() => setHoveredItem(server.id)}
                onMouseLeave={() => setHoveredItem(null)}
                title={`Serwer: ${server.name} (Kliknij prawym, aby otworzyć menu)`}
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

      {/* Superadmin Panel Button (Only for cfx / superadmin) */}
      {isSuperadmin && onOpenAdminPanel && (
        <div className="relative group flex items-center justify-center w-full shrink-0">
          <button
            id="btn-superadmin-panel"
            onClick={onOpenAdminPanel}
            title="Panel Głównego Administratora (CFX)"
            className="w-12 h-12 bg-gradient-to-tr from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg animate-pulse"
          >
            <ToothCrownIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* Custom Discord-styled Right Click Server Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-56 bg-[#111214] border border-[#202225] rounded-[8px] p-1.5 shadow-2xl text-[#dbdee1] text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Server info */}
          <div className="px-2.5 py-2 border-b border-[#202225] mb-1">
            <p className="font-bold text-white text-xs truncate">
              {contextMenu.server.name}
            </p>
            <p className="text-[10px] text-[#949ba4] mt-0.5">
              {(contextMenu.server.memberIds || []).length} członków
            </p>
          </div>

          {/* Invite friends */}
          <button
            onClick={() => {
              const srv = contextMenu.server;
              setContextMenu(null);
              if (onOpenInviteModal) onOpenInviteModal(srv);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-[#5865F2] hover:bg-[#5865F2] hover:text-white transition-colors cursor-pointer"
          >
            <span className="font-semibold">Zaproś ludzi</span>
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Copy Server ID */}
          <button
            onClick={() => handleCopyServerId(contextMenu.server.id)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] hover:bg-[#35373c] hover:text-white transition-colors cursor-pointer"
          >
            <span>{copiedId ? "Skopiowano ID!" : "Kopiuj ID serwera"}</span>
            {copiedId ? <Check className="w-4 h-4 text-[#23a55a]" /> : <Copy className="w-4 h-4 text-[#949ba4]" />}
          </button>

          {/* Divider */}
          <div className="h-[1px] bg-[#202225] my-1" />

          {/* Leave Server (Opuść serwer) */}
          <button
            onClick={() => {
              setServerToLeave(contextMenu.server);
              setContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-[#da373c] hover:bg-[#da373c] hover:text-white transition-colors cursor-pointer group"
          >
            <span className="font-semibold">Opuść serwer</span>
            <LogOut className="w-4 h-4 text-[#da373c] group-hover:text-white" />
          </button>
        </div>
      )}

      {/* Confirmation Modal to Leave Server */}
      {serverToLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#313338] border border-[#202225] rounded-[8px] shadow-2xl p-6 text-[#dbdee1]"
          >
            <div className="flex items-center gap-3 text-white mb-2">
              <div className="w-10 h-10 rounded-full bg-[#da373c]/20 text-[#da373c] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Opuść &apos;{serverToLeave.name}&apos;
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#949ba4] mt-2 mb-6 leading-relaxed">
              Czy na pewno chcesz opuścić serwer <span className="font-bold text-white">{serverToLeave.name}</span>? Nie będziesz mógł ponownie dołączyć, dopóki ktoś nie wyśle Ci nowego zaproszenia.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setServerToLeave(null)}
                className="px-4 py-2 text-xs font-semibold text-white hover:underline cursor-pointer"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 bg-[#da373c] hover:bg-[#a1282c] text-white text-xs font-semibold rounded-[4px] shadow transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Opuść serwer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
