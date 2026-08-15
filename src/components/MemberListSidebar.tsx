import React from "react";
import { UserIdentity, ServerGuild, ServerRole } from "../types";
import { ToothLogoIcon, ToothCrownIcon } from "./ToothIcons";
import { ShieldCheck, MicOff, Clock } from "lucide-react";

interface MemberListSidebarProps {
  members: UserIdentity[];
  currentUser: UserIdentity;
  server: ServerGuild;
  onOpenMemberProfile: (user: UserIdentity) => void;
}

export const MemberListSidebar: React.FC<MemberListSidebarProps> = ({
  members,
  currentUser,
  server,
  onOpenMemberProfile,
}) => {
  // Filter unique members
  const memberMap = new Map<string, UserIdentity>();
  memberMap.set(currentUser.id, currentUser);
  members.forEach((m) => memberMap.set(m.id, m));
  const uniqueMembers = Array.from(memberMap.values());

  const getRole = (userId: string): ServerRole => {
    return (server.roles && server.roles[userId]) || (server.ownerId === userId ? "admin" : "member");
  };

  const admins = uniqueMembers.filter((m) => getRole(m.id) === "admin");
  const supports = uniqueMembers.filter((m) => getRole(m.id) === "support");
  const regularMembers = uniqueMembers.filter((m) => getRole(m.id) === "member");

  const renderMemberRow = (member: UserIdentity) => {
    const isMe = member.id === currentUser.id;
    const role = getRole(member.id);
    const isMuted = !!(server.mutedUserIds && server.mutedUserIds.includes(member.id));
    const isTimedOut = !!(server.timeouts?.[member.id] && server.timeouts[member.id] > Date.now());

    return (
      <div
        key={member.id}
        id={`member-row-${member.id}`}
        onClick={() => onOpenMemberProfile(member)}
        className="flex items-center gap-3 px-2 py-1.5 rounded-[4px] group hover:bg-[#35373c] transition-colors cursor-pointer"
      >
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm overflow-hidden"
            style={{ backgroundColor: member.avatarColor || "#5865f2" }}
          >
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <ToothLogoIcon className="w-5 h-5 text-white" />
            )}
          </div>

          {/* Discord Status Indicator */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2b2d31] ${
              member.status === "idle"
                ? "bg-[#f0b232]"
                : member.status === "dnd"
                ? "bg-[#f23f43]"
                : member.status === "offline"
                ? "bg-[#80848e]"
                : "bg-[#23a55a]"
            }`}
          />
        </div>

        {/* Name & Custom Status (No email!) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-medium text-sm truncate ${
                role === "admin"
                  ? "text-[#f04747] font-semibold"
                  : role === "support"
                  ? "text-[#23a55a] font-semibold"
                  : isMe
                  ? "text-[#5865F2] font-semibold"
                  : "text-[#dbdee1]"
              }`}
            >
              {member.displayName}
            </span>
            {role === "admin" && (
              <ToothCrownIcon className="w-3.5 h-3.5 text-[#f0b232] shrink-0" />
            )}
            {role === "support" && (
              <ShieldCheck className="w-3.5 h-3.5 text-[#23a55a] shrink-0" />
            )}
            {isMuted && (
              <MicOff className="w-3 h-3 text-[#da373c] shrink-0" />
            )}
            {isTimedOut && (
              <Clock className="w-3 h-3 text-[#f0b232] shrink-0" />
            )}
          </div>
          <p className="text-[10px] text-[#949ba4] truncate font-sans">
            {member.customStatus || (member.status === "offline" ? "Niewidoczny" : "Aktywny")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <aside
      id="discord-member-list"
      className="w-60 bg-[#2b2d31] flex flex-col h-full select-none shrink-0 border-l border-[#202225] hidden md:flex"
    >
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
        {/* ADMINS */}
        {admins.length > 0 && (
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold tracking-wider text-[#949ba4] px-1 py-1 uppercase flex items-center gap-1">
              <ToothCrownIcon className="w-3 h-3 text-[#f0b232]" />
              ADMINI — {admins.length}
            </div>
            {admins.map(renderMemberRow)}
          </div>
        )}

        {/* SUPPORT */}
        {supports.length > 0 && (
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold tracking-wider text-[#949ba4] px-1 py-1 uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#23a55a]" />
              SUPPORT — {supports.length}
            </div>
            {supports.map(renderMemberRow)}
          </div>
        )}

        {/* MEMBERS */}
        {regularMembers.length > 0 && (
          <div className="space-y-0.5">
            <div className="text-[11px] font-bold tracking-wider text-[#949ba4] px-1 py-1 uppercase">
              UŻYTKOWNICY — {regularMembers.length}
            </div>
            {regularMembers.map(renderMemberRow)}
          </div>
        )}
      </div>
    </aside>
  );
};

