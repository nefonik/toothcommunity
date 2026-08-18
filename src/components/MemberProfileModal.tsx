import React, { useState } from "react";
import { ToothCrownIcon, ToothShieldIcon } from "./ToothIcons";
import {
  X,
  MessageSquare,
  Phone,
  MicOff,
  Mic,
  Clock,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Calendar,
  Layers,
} from "lucide-react";
import { UserIdentity, ServerGuild, ServerRole } from "../types";
import { AvatarWithDecoration } from "./AvatarWithDecoration";
import { ProfileBannerView } from "./ProfileBannerHelper";

interface MemberProfileModalProps {
  isOpen?: boolean;
  member: UserIdentity;
  currentUser: UserIdentity;
  server: ServerGuild;
  onClose: () => void;
  onStartChat?: (user: UserIdentity) => void;
  onOpenChat?: (user: UserIdentity) => void;
  onStartCall?: (user: UserIdentity) => void;
  onSetRole?: (userId: string, role: ServerRole) => Promise<void> | void;
  onToggleMute?: (userId: string, isMuted: boolean) => Promise<void> | void;
  onMuteMember?: (userId: string, isMuted: boolean) => Promise<void> | void;
  onTimeout?: (userId: string, minutes: number) => Promise<void> | void;
  onTimeoutMember?: (userId: string, minutes: number) => Promise<void> | void;
  onKick?: (userId: string) => Promise<void> | void;
  onKickMember?: (userId: string) => Promise<void> | void;
  onDeleteAccount?: (userId: string, userName: string) => Promise<void> | void;
  onEditProfile?: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen = true,
  member,
  currentUser,
  server,
  onClose,
  onStartChat,
  onOpenChat,
  onStartCall,
  onSetRole,
  onToggleMute,
  onMuteMember,
  onTimeout,
  onTimeoutMember,
  onKick,
  onKickMember,
  onDeleteAccount,
  onEditProfile,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const isMe = member?.id === currentUser?.id;
  const myRole: ServerRole = (server?.roles && currentUser && server.roles[currentUser.id]) || (server?.ownerId === currentUser?.id ? "admin" : "member");
  const memberRole: ServerRole = (server?.roles && member && server.roles[member.id]) || (server?.ownerId === member?.id ? "admin" : "member");
  const isMuted = !!(server?.mutedUserIds && member && server.mutedUserIds.includes(member.id));
  const timeoutExpiry = (member && server?.timeouts?.[member.id]) || 0;
  const isTimedOut = timeoutExpiry > Date.now();

  const isGlobalAdmin =
    currentUser?.role === "superadmin" ||
    currentUser?.role === "admin" ||
    currentUser?.displayName?.toLowerCase() === "cfx" ||
    currentUser?.email === "antekzagora@gmail.com";
  const canModerateAsSupport = (myRole === "admin" || myRole === "support" || isGlobalAdmin) && !isMe;
  const canModerateAsAdmin = (myRole === "admin" || isGlobalAdmin) && !isMe;

  const handleMute = async () => {
    if (!member) return;
    try {
      setIsProcessing(true);
      if (onToggleMute) {
        await onToggleMute(member.id, !isMuted);
      } else if (onMuteMember) {
        await onMuteMember(member.id, !isMuted);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimeout = async (minutes: number) => {
    if (!member) return;
    try {
      setIsProcessing(true);
      if (onTimeout) {
        await onTimeout(member.id, minutes);
      } else if (onTimeoutMember) {
        await onTimeoutMember(member.id, minutes);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKick = async () => {
    if (!member) return;
    if (confirm(`Czy na pewno chcesz wyrzucić ${member.displayName} z tego serwera?`)) {
      try {
        setIsProcessing(true);
        if (onKick) {
          await onKick(member.id);
        } else if (onKickMember) {
          await onKickMember(member.id);
        }
        onClose();
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleChangeRole = async (newRole: ServerRole) => {
    if (!member) return;
    try {
      setIsProcessing(true);
      if (onSetRole) {
        await onSetRole(member.id, newRole);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!member) return;
    if (member.displayName.toLowerCase() === "cfx" || member.id === "usr_cfx_admin") {
      alert("Nie można usunąć konta głównego administratora!");
      return;
    }

    if (
      !confirm(
        `CZY NA PEWNO chcesz bezpowrotnie usunąć konto "${member.displayName}" z bazy danych platformy ToothChat?\n\nUżytkownik utraci dostęp i zostanie usunięty ze wszystkich serwerów.`
      )
    ) {
      return;
    }

    try {
      setIsProcessing(true);
      if (onDeleteAccount) {
        await onDeleteAccount(member.id, member.displayName);
      }
      onClose();
    } catch (err) {
      console.error("Błąd podczas usuwania konta:", err);
      alert("Wystąpił błąd podczas usuwania konta.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isOpen === false || !member || !currentUser || !server) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#232428] border border-[#1e1f22] rounded-[16px] shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col"
      >
        {/* Custom User Profile Banner */}
        <ProfileBannerView
          bannerUrl={member.bannerUrl}
          bannerColor={member.bannerColor}
          fallbackColor={member.avatarColor}
          heightClass="h-28 sm:h-32"
          isEditable={isMe}
          onEdit={() => {
            onClose();
            if (onEditProfile) onEditProfile();
          }}
        >
          {/* Close Button Top Right */}
          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 z-20 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-sm transition-all cursor-pointer shadow hover:scale-105"
            title="Zamknij profil"
          >
            <X className="w-4 h-4" />
          </button>
        </ProfileBannerView>

        {/* Profile Details Container */}
        <div className="px-5 pb-5 pt-0 relative bg-[#232428]">
          {/* Avatar floating overlapping banner */}
          <div className="relative -top-12 mb-[-32px] flex items-end justify-between">
            <div className="relative p-1 bg-[#232428] rounded-full inline-block">
              <AvatarWithDecoration
                user={member}
                avatarUrl={member.avatarUrl}
                displayName={member.displayName}
                avatarColor={member.avatarColor}
                decorationId={member.avatarDecoration}
                status={member.status || "online"}
                size="lg"
                showStatus={true}
              />
            </div>

            {/* Quick action buttons */}
            {!isMe ? (
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onStartChat) onStartChat(member);
                    else if (onOpenChat) onOpenChat(member);
                  }}
                  title="Wiadomość prywatna (DM)"
                  className="p-2.5 bg-[#2b2d31] hover:bg-[#5865f2] text-[#dbdee1] hover:text-white rounded-[8px] transition-all cursor-pointer shadow border border-[#35373c]"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  if (onEditProfile) onEditProfile();
                }}
                className="mb-2 px-3 py-1.5 bg-[#35373c] hover:bg-[#5865f2] text-xs font-semibold text-white rounded-[6px] transition-all cursor-pointer shadow"
              >
                Edytuj Profil
              </button>
            )}
          </div>

          {/* User Card Content Box */}
          <div className="bg-[#111214] p-3.5 rounded-[10px] border border-[#202225] space-y-3 mt-1">
            {/* Name, Tag & Role Badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-white text-lg tracking-tight">
                  {member.displayName}
                </h3>
                {memberRole === "admin" && (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-[#da373c]/20 text-[#da373c] border border-[#da373c]/30">
                    <ToothCrownIcon className="w-3 h-3 text-[#f0b232]" /> Admin
                  </span>
                )}
                {memberRole === "support" && (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/30">
                    <ShieldCheck className="w-3 h-3 text-[#23a55a]" /> Support
                  </span>
                )}
                {isTimedOut && (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#f0b232]/20 text-[#f0b232] border border-[#f0b232]/30">
                    <Clock className="w-3 h-3" /> Przerwa
                  </span>
                )}
                {isMuted && (
                  <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#da373c]/20 text-[#da373c] border border-[#da373c]/30">
                    <MicOff className="w-3 h-3" /> Wyciszony
                  </span>
                )}
              </div>

              {/* Custom Status / Bio */}
              <div className="text-xs text-[#dbdee1] bg-[#1e1f22] px-3 py-2 rounded-[6px] border border-[#2b2d31]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#949ba4] block mb-0.5">
                  O mnie / Status
                </span>
                <p className="text-xs text-[#dbdee1] break-words">
                  {member.customStatus || (member.status === "offline" ? "Niewidoczny" : "Aktywny w ToothChat 🪥")}
                </p>
              </div>

              {/* ToothPoints & Member Info Pills */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-[#1e1f22] p-2 rounded-[6px] border border-[#2b2d31]">
                  <span className="text-[10px] text-[#949ba4] font-semibold block">Punkty Zębów</span>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>🦷 {(member.points ?? 150).toLocaleString()} pkt</span>
                  </span>
                </div>
                <div className="bg-[#1e1f22] p-2 rounded-[6px] border border-[#2b2d31]">
                  <span className="text-[10px] text-[#949ba4] font-semibold block">Rola w Serwerze</span>
                  <span className="text-xs font-bold text-white capitalize">
                    {memberRole === "admin" ? "Administrator" : memberRole === "support" ? "Pomocnik (Support)" : "Użytkownik"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Moderation Controls for Support / Admin */}
          {(canModerateAsSupport || canModerateAsAdmin) && (
            <div className="mt-3 pt-3 border-t border-[#35373c] space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#f0b232]" />
                Panel Moderacji Serwera
              </div>

              {/* Mute Button (Available to Support & Admin) */}
              <button
                type="button"
                onClick={handleMute}
                disabled={isProcessing}
                className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                  isMuted
                    ? "bg-[#23a55a]/20 hover:bg-[#23a55a]/30 text-[#23a55a] border border-[#23a55a]/40"
                    : "bg-[#da373c]/15 hover:bg-[#da373c]/25 text-[#da373c] border border-[#da373c]/30"
                }`}
              >
                {isMuted ? (
                  <>
                    <Mic className="w-3.5 h-3.5" /> Odcisz użytkownika
                  </>
                ) : (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Wycisz użytkownika (Mute)
                  </>
                )}
              </button>

              {/* Admin Only Actions: Timeout, Kick, Change Role */}
              {canModerateAsAdmin && (
                <div className="space-y-2">
                  {/* Timeout selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#949ba4] font-semibold block">
                      Daj przerwę (Timeout):
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => handleTimeout(5)}
                        className="py-1 text-[10px] bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1] rounded font-medium transition-colors"
                      >
                        5 min
                      </button>
                      <button
                        onClick={() => handleTimeout(15)}
                        className="py-1 text-[10px] bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1] rounded font-medium transition-colors"
                      >
                        15 min
                      </button>
                      <button
                        onClick={() => handleTimeout(60)}
                        className="py-1 text-[10px] bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1] rounded font-medium transition-colors"
                      >
                        1 godz.
                      </button>
                      <button
                        onClick={() => handleTimeout(0)}
                        className="py-1 text-[10px] bg-[#1e1f22] hover:bg-[#23a55a]/30 text-[#23a55a] rounded font-medium transition-colors"
                      >
                        Zdejmij
                      </button>
                    </div>
                  </div>

                  {/* Role Assignment */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#949ba4] font-semibold block">
                      Zarządzaj rolą:
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => handleChangeRole("admin")}
                        className={`py-1 text-[10px] rounded font-medium transition-colors ${
                          memberRole === "admin"
                            ? "bg-[#da373c] text-white"
                            : "bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1]"
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => handleChangeRole("support")}
                        className={`py-1 text-[10px] rounded font-medium transition-colors ${
                          memberRole === "support"
                            ? "bg-[#23a55a] text-white"
                            : "bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1]"
                        }`}
                      >
                        Support
                      </button>
                      <button
                        onClick={() => handleChangeRole("member")}
                        className={`py-1 text-[10px] rounded font-medium transition-colors ${
                          memberRole === "member"
                            ? "bg-[#5865f2] text-white"
                            : "bg-[#1e1f22] hover:bg-[#35373c] text-[#dbdee1]"
                        }`}
                      >
                        Użytkownik
                      </button>
                    </div>
                  </div>

                  {/* Kick from Server */}
                  <button
                    type="button"
                    onClick={handleKick}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[6px] text-xs font-semibold bg-[#da373c]/80 hover:bg-[#da373c] text-white transition-colors cursor-pointer shadow"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    Wyrzuć z serwera (Kick)
                  </button>

                  {/* Delete Account Globally (Admin/Superadmin) */}
                  {(isGlobalAdmin || myRole === "admin") && (
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[6px] text-xs font-semibold bg-[#da373c]/15 hover:bg-[#da373c] text-[#da373c] hover:text-white border border-[#da373c]/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Usuń konto z platformy (Admin)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

