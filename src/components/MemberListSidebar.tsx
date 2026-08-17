import React from "react";
import { UserIdentity, ServerGuild, ServerRole } from "../types";
import { ToothCrownIcon } from "./ToothIcons";
import { ShieldCheck, MicOff, Clock, Sparkles } from "lucide-react";
import { AvatarWithDecoration } from "./AvatarWithDecoration";

interface MemberListSidebarProps {
  members: UserIdentity[];
  currentUser: UserIdentity;
  server: ServerGuild;
  onOpenMemberProfile: (user: UserIdentity) => void;
}

export const isCfxAccount = (u?: UserIdentity | null): boolean => {
  if (!u) return false;
  return (
    u.id === "usr_cfx_admin" ||
    u.displayName?.toLowerCase() === "cfx" ||
    u.email === "antekzagora@gmail.com" ||
    u.email === "cfx@gmail.com" ||
    u.role === "superadmin"
  );
};

export const MemberListSidebar: React.FC<MemberListSidebarProps> = ({
  members,
  currentUser,
  server,
  onOpenMemberProfile,
}) => {
  // Filter unique members: ToothChat HQ includes the whole community, cfx is present on all servers
  const isHQServer = server.id === "srv_tooth_hq";
  const isCfxCurrent = isCfxAccount(currentUser);
  const serverMemberIds = new Set(server.memberIds || [server.ownerId]);
  if (server.ownerId) serverMemberIds.add(server.ownerId);

  const memberMap = new Map<string, UserIdentity>();
  if (currentUser) {
    memberMap.set(currentUser.id, currentUser);
  }
  members.forEach((m) => {
    if (
      isHQServer ||
      isCfxCurrent ||
      isCfxAccount(m) ||
      serverMemberIds.has(m.id) ||
      server.ownerId === m.id
    ) {
      memberMap.set(m.id, m);
    }
  });

  let uniqueMembers = Array.from(memberMap.values());
  if (uniqueMembers.length === 0 && currentUser) {
    uniqueMembers = [currentUser];
  }

  const getRole = (userId: string, userObj?: UserIdentity): ServerRole => {
    if (userObj && isCfxAccount(userObj)) return "admin";
    if (userId === "usr_cfx_admin") return "admin";
    return (server.roles && server.roles[userId]) || (server.ownerId === userId ? "admin" : "member");
  };

  // Sort function to guarantee cfx is always at the absolute top of the list
  const sortWithCfxTop = (a: UserIdentity, b: UserIdentity) => {
    if (isCfxAccount(a)) return -1;
    if (isCfxAccount(b)) return 1;
    return a.displayName.localeCompare(b.displayName);
  };

  const admins = uniqueMembers.filter((m) => getRole(m.id, m) === "admin").sort(sortWithCfxTop);
  const supports = uniqueMembers.filter((m) => getRole(m.id, m) === "support").sort(sortWithCfxTop);
  const regularMembers = uniqueMembers.filter((m) => getRole(m.id, m) === "member").sort(sortWithCfxTop);

  const renderMemberRow = (member: UserIdentity) => {
    const isMe = member.id === currentUser.id;
    const isCfx = isCfxAccount(member);
    const role = getRole(member.id, member);
    const isMuted = !!(server.mutedUserIds && server.mutedUserIds.includes(member.id));
    const isTimedOut = !!(server.timeouts?.[member.id] && server.timeouts[member.id] > Date.now());

    return (
      <div
        key={member.id}
        id={`member-row-${member.id}`}
        onClick={() => onOpenMemberProfile(member)}
        className="flex items-center gap-3 px-2 py-1.5 rounded-[4px] group hover:bg-[#35373c] transition-colors cursor-pointer"
      >
        {/* Avatar with Animated Decoration & Status Dot */}
        <AvatarWithDecoration
          user={member}
          avatarUrl={member.avatarUrl}
          displayName={member.displayName}
          avatarColor={member.avatarColor}
          decorationId={member.avatarDecoration}
          status={member.status || "online"}
          size="sm"
          showStatus={true}
        />

        {/* Name & Custom Status (No email!) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-medium text-sm truncate ${
                isCfx
                  ? "text-[#f0b232] font-bold"
                  : role === "admin"
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
            {isCfx ? (
              <span className="flex items-center gap-0.5 text-[10px] bg-[#f0b232]/20 text-[#f0b232] px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                <ToothCrownIcon className="w-3 h-3 text-[#f0b232] shrink-0" />
                <span>CFX</span>
              </span>
            ) : role === "admin" ? (
              <ToothCrownIcon className="w-3.5 h-3.5 text-[#f0b232] shrink-0" />
            ) : null}
            {role === "support" && !isCfx && (
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
            {isCfx && !member.customStatus ? "Właściciel platformy" : member.customStatus || (member.status === "offline" ? "Niewidoczny" : "Aktywny")}
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

