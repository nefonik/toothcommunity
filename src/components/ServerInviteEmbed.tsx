import React, { useState } from "react";
import { ToothShieldIcon, ToothLogoIcon } from "./ToothIcons";
import { Check, LogIn, Sparkles, Users, Loader2 } from "lucide-react";
import { ServerGuild, UserIdentity } from "../types";

interface ServerInviteData {
  serverId: string;
  serverName: string;
  serverIcon?: string;
  memberCount?: number;
  inviterName?: string;
  inviterId?: string;
}

interface ServerInviteEmbedProps {
  invite: ServerInviteData;
  currentUser?: UserIdentity | null;
  joinedServers?: ServerGuild[];
  onJoinServer?: (serverId: string) => Promise<void> | void;
}

export const ServerInviteEmbed: React.FC<ServerInviteEmbedProps> = ({
  invite,
  currentUser,
  joinedServers = [],
  onJoinServer,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  // Check if current user is already a member of this server
  const isAlreadyMember =
    justJoined ||
    joinedServers.some((s) => {
      if (s.id === invite.serverId) {
        if (!currentUser) return true;
        return s.memberIds?.includes(currentUser.id) || s.id === "srv_tooth_hq";
      }
      return false;
    });

  const handleJoinClick = async () => {
    if (!onJoinServer) return;
    try {
      setIsJoining(true);
      await onJoinServer(invite.serverId);
      setJustJoined(true);
    } catch (err) {
      console.error("Błąd podczas dołączania do serwera:", err);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div
      id={`discord-invite-${invite.serverId}`}
      className="mt-2.5 max-w-md w-full bg-[#2b2d31] border border-[#1e1f22] hover:border-[#383a40] rounded-[8px] p-3.5 sm:p-4 shadow-lg transition-all select-none"
    >
      {/* Small Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#b5bac1]">
          {invite.inviterName
            ? `${invite.inviterName.toUpperCase()} ZAPRASZA CIĘ DO DOŁĄCZENIA`
            : "ZOSTAŁEŚ ZAPROSZONY NA SERWER"}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[#23a55a] font-bold bg-[#23a55a]/10 px-1.5 py-0.5 rounded border border-[#23a55a]/20">
          <ToothShieldIcon className="w-3 h-3" />
          <span>E2EE</span>
        </span>
      </div>

      {/* Main Server Information Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Server Avatar + Details */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Server Icon */}
          <div className="w-12 h-12 rounded-[14px] bg-[#5865f2] border border-[#1e1f22] flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm overflow-hidden">
            {invite.serverIcon && invite.serverIcon.length <= 4 ? (
              <span>{invite.serverIcon}</span>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <ToothShieldIcon className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Server Name & Members */}
          <div className="min-w-0">
            <h4 className="font-bold text-white text-sm sm:text-base truncate leading-snug">
              {invite.serverName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#949ba4]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#23a55a] inline-block shadow-[0_0_6px_#23a55a]" />
                <span className="font-semibold text-[#dbdee1]">
                  {invite.memberCount || 1}
                </span>{" "}
                {invite.memberCount === 1 ? "Członek" : "Członków"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Join Button */}
        <div className="shrink-0">
          <button
            onClick={handleJoinClick}
            disabled={isJoining}
            className={`px-4 py-2 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
              isAlreadyMember
                ? "bg-[#4e5058] hover:bg-[#5865F2] text-white"
                : "bg-[#23a55a] hover:bg-[#1f8b4c] text-white"
            }`}
          >
            {isJoining ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Dołączanie...</span>
              </>
            ) : isAlreadyMember ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#23a55a]" />
                <span>Dołączono</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Dołącz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
