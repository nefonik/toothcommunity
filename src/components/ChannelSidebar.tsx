import React, { useState } from "react";
import {
  ToothLogoIcon,
  ToothHashIcon,
  ToothSpeakerIcon,
  ToothShieldIcon,
  ToothCrownIcon,
  ToothPlusIcon,
} from "./ToothIcons";
import {
  ChevronDown,
  ChevronRight,
  Mic,
  MicOff,
  Headphones,
  Check,
  X,
  Edit2,
  PhoneOff,
  Signal,
  LogOut,
  CheckCircle,
  UserPlus,
  Share2,
  Sparkles,
} from "lucide-react";
import { ServerGuild, ServerChannel, UserIdentity } from "../types";
import { AvatarWithDecoration } from "./AvatarWithDecoration";

interface ChannelSidebarProps {
  server: ServerGuild;
  activeChannel: ServerChannel;
  onSelectChannel: (channel: ServerChannel) => void;
  currentUser: UserIdentity;
  onUpdateDisplayName: (newName: string) => void;
  onSignOut: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  activeVoiceRoom: string | null;
  onJoinVoice: (channelId: string) => void;
  onLeaveVoice: () => void;
  onOpenAvatarModal?: () => void;
  onOpenCreateChannel?: (type: "text" | "voice") => void;
  onOpenInviteModal?: () => void;
  onLeaveServer?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  server,
  activeChannel,
  onSelectChannel,
  currentUser,
  onUpdateDisplayName,
  onSignOut,
  isMuted,
  onToggleMute,
  activeVoiceRoom,
  onJoinVoice,
  onLeaveVoice,
  onOpenAvatarModal,
  onOpenCreateChannel,
  onOpenInviteModal,
  onLeaveServer,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState(currentUser.displayName);
  const [isDeafened, setIsDeafened] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [showServerMenu, setShowServerMenu] = useState(false);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSaveName = () => {
    if (editNameInput.trim().length > 0) {
      onUpdateDisplayName(editNameInput.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div
      id="discord-channels-sidebar"
      className="w-60 bg-[#2b2d31] flex flex-col h-full select-none shrink-0 border-r border-[#202225] relative"
    >
      {/* 1. Discord Server Header with Dropdown Chevron & Invite Option */}
      <div className="relative">
        <div
          id="server-header-dropdown"
          onClick={() => setShowServerMenu(!showServerMenu)}
          className="h-12 border-b border-[#202225] flex items-center justify-between px-4 hover:bg-[#35373c] transition-colors cursor-pointer shadow-sm"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <ToothLogoIcon className="w-5 h-5 text-[#5865F2] shrink-0" />
            <span className="font-bold text-white text-sm tracking-tight truncate">
              {server.name}
            </span>
            <ToothCrownIcon className="w-3.5 h-3.5 text-[#f0b232] shrink-0" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInviteModal?.();
              }}
              title="Zaproś ludzi na serwer"
              className="p-1 text-[#949ba4] hover:text-[#5865F2] transition-colors cursor-pointer rounded hover:bg-[#3f4147]"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <ChevronDown className={`w-4 h-4 text-[#949ba4] transition-transform ${showServerMenu ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Server Dropdown Menu */}
        {showServerMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-13 left-2 right-2 z-40 bg-[#111214] border border-[#202225] rounded-[6px] p-1.5 shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => {
                setShowServerMenu(false);
                onOpenInviteModal?.();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-[#5865F2] hover:bg-[#5865F2] hover:text-white rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Zaproś ludzi</span>
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowServerMenu(false);
                onOpenCreateChannel?.("text");
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-[#dbdee1] hover:bg-[#35373c] hover:text-white rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Utwórz kanał tekstowy</span>
              <ToothPlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowServerMenu(false);
                onOpenCreateChannel?.("text");
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-[#dbdee1] hover:bg-[#35373c] hover:text-white rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Utwórz kanał</span>
              <ToothPlusIcon className="w-4 h-4" />
            </button>

            {onLeaveServer && (
              <>
                <div className="h-[1px] bg-[#202225] my-1" />
                <button
                  onClick={() => {
                    setShowServerMenu(false);
                    onLeaveServer();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold text-[#da373c] hover:bg-[#da373c] hover:text-white rounded-[4px] transition-colors cursor-pointer"
                >
                  <span>Opuść serwer</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 2. Channel List with Discord Categories */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 custom-scrollbar">
        {/* Category 1: KANAŁY TEKSTOWE */}
        <div>
          <div className="w-full flex items-center justify-between px-1 mb-1 text-[11px] font-bold uppercase tracking-wider text-[#949ba4] hover:text-[#dbdee1] group">
            <button
              onClick={() => toggleCategory("text")}
              className="flex items-center gap-1 cursor-pointer flex-1 text-left"
            >
              {collapsedCategories["text"] ? (
                <ChevronRight className="w-3 h-3 text-[#949ba4]" />
              ) : (
                <ChevronDown className="w-3 h-3 text-[#949ba4]" />
              )}
              <span>KANAŁY TEKSTOWE</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCreateChannel?.("text");
              }}
              title="Utwórz kanał tekstowy"
              className="p-0.5 hover:text-white transition-colors cursor-pointer"
            >
              <ToothPlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {!collapsedCategories["text"] && (
            <div className="space-y-0.5">
              {server.channels
                .filter((c) => c.type === "text" || !c.type)
                .map((channel) => {
                  const isActive = activeChannel.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      id={`channel-btn-${channel.id}`}
                      onClick={() => onSelectChannel(channel)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] text-sm font-medium transition-colors group cursor-pointer ${
                        isActive
                          ? "bg-[#35373c] text-white"
                          : "text-[#949ba4] hover:bg-[#35373c]/60 hover:text-[#dbdee1]"
                      }`}
                    >
                      <ToothHashIcon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? "text-[#5865F2]"
                            : "text-[#80848e] group-hover:text-[#dbdee1]"
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                      {channel.isEncrypted && (
                        <ToothShieldIcon className="w-3.5 h-3.5 ml-auto text-[#23a55a] shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Discord User Status Bar (Bottom Profile Panel) */}
      <div
        id="discord-user-profile-bar"
        className="h-[56px] bg-[#232428] px-2 flex items-center justify-between shrink-0 border-t border-[#1e1f22]"
      >
        <div
          onClick={onOpenAvatarModal}
          className="flex items-center gap-2.5 min-w-0 flex-1 hover:bg-[#35373c]/50 p-1.5 rounded-[6px] transition-colors cursor-pointer group"
          title="Kliknij, aby zmienić zdjęcie profilowe, animowaną ozdobę lub status"
        >
          {/* Avatar with Animated Decoration */}
          <AvatarWithDecoration
            user={currentUser}
            avatarUrl={currentUser.avatarUrl}
            displayName={currentUser.displayName}
            avatarColor={currentUser.avatarColor}
            decorationId={currentUser.avatarDecoration}
            status={currentUser.status || "online"}
            size="sm"
            showStatus={true}
          />

          {/* User Name & Subtext (Status + Points) */}
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="w-20 bg-[#1e1f22] text-white text-xs px-1 py-0.5 rounded border border-[#5865f2] focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-[#23a55a] hover:text-white p-0.5"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="text-[#da373c] hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-[#dbdee1] truncate">
                    {currentUser.displayName}
                  </p>
                  <Edit2
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditNameInput(currentUser.displayName);
                      setIsEditingName(true);
                    }}
                    className="w-3 h-3 text-[#949ba4] opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5 shrink-0">
                    🦷 {(currentUser.points ?? 150).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-[#949ba4] truncate font-sans">
                    {currentUser.customStatus || "Online"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Discord Control Buttons: Mic, Headphones, Logout */}
        <div className="flex items-center shrink-0">
          <button
            id="btn-discord-mic"
            onClick={onToggleMute}
            title={isMuted ? "Włącz mikrofon" : "Wycisz mikrofon"}
            className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
              isMuted
                ? "text-[#da373c] hover:bg-[#35373c]"
                : "text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]"
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenAvatarModal}
            title="Ozdoby i Personalizacja"
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            id="btn-discord-logout"
            onClick={onSignOut}
            title="Wyloguj się z ToothChat"
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#949ba4] hover:text-[#da373c] hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
