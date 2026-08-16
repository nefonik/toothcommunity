import React, { useState } from "react";
import { ToothLogoIcon, ToothShieldIcon } from "./ToothIcons";
import { X, Copy, Check, UserPlus, Link, Sparkles } from "lucide-react";
import { ServerGuild, UserIdentity } from "../types";

interface InviteServerModalProps {
  isOpen?: boolean;
  server: ServerGuild;
  currentUser: UserIdentity;
  allUsers: UserIdentity[];
  onClose: () => void;
  onInviteUser?: (userId: string) => Promise<void> | void;
}

export const InviteServerModal: React.FC<InviteServerModalProps> = ({
  isOpen = true,
  server,
  currentUser,
  allUsers,
  onClose,
  onInviteUser,
}) => {
  if (isOpen === false) return null;

  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

  const inviteCode = `TOOTH-${server.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-6) || "INVITE"}`;
  const inviteLink = `https://toothchat.app/join/${server.id}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInvite = async (userId: string) => {
    if (invitedMap[userId]) return;
    setInvitedMap((prev) => ({ ...prev, [userId]: true }));
    if (onInviteUser) {
      await onInviteUser(userId);
    }
  };

  const currentMembers = server.memberIds || [];
  const candidateUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#313338] border border-[#202225] rounded-[8px] shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202225] bg-[#2b2d31]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm">
              {server.icon && server.icon.length <= 4 ? server.icon : "🦷"}
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-tight">
                Zaproś znajomych na serwer
              </h3>
              <p className="text-xs text-[#949ba4] truncate max-w-[260px]">
                {server.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white transition-colors p-1 rounded hover:bg-[#35373c] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quick Invite Link Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4] mb-2">
              LUB WYŚLIJ LINK ZAPROSZENIA ZNAJOMEMU
            </label>
            <div className="flex items-center bg-[#1e1f22] rounded-[4px] border border-[#202225] p-1">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="bg-transparent text-[#dbdee1] text-xs px-3 py-1.5 flex-1 focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-1.5 rounded-[3px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? "bg-[#23a55a] text-white"
                    : "bg-[#5865F2] hover:bg-[#4752c4] text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Skopiowano</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiuj</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#949ba4] mt-1.5">
              Kod serwera: <span className="text-white font-mono font-bold">{server.id}</span>
            </p>
          </div>

          {/* User List to Invite Directly */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#949ba4]">
                ZAPROŚ BEZPOŚREDNIO
              </label>
              <span className="text-[11px] text-[#80848e]">
                {candidateUsers.length} dostępnych
              </span>
            </div>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Wyszukaj znajomego..."
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-[4px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-xs placeholder:text-[#80848e] mb-3"
            />

            {/* Users List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {candidateUsers.map((user) => {
                const isAlreadyMember = currentMembers.includes(user.id);
                const isInvited = invitedMap[user.id] || isAlreadyMember;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-[4px] hover:bg-[#2b2d31] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: user.avatarColor || "#5865F2" }}
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ToothLogoIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {user.displayName}
                        </p>
                        <p className="text-[10px] text-[#949ba4] truncate">
                          {user.customStatus || (user.status === "offline" ? "Niewidoczny" : "Online")}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInvite(user.id)}
                      disabled={isInvited}
                      className={`px-3 py-1 rounded-[3px] text-xs font-medium transition-all cursor-pointer ${
                        isInvited
                          ? "border border-[#23a55a] text-[#23a55a] bg-[#23a55a]/10 cursor-default"
                          : "bg-transparent border border-[#5865F2] text-white hover:bg-[#5865F2]"
                      }`}
                    >
                      {isInvited ? "Zaprooszono" : "Zaproś"}
                    </button>
                  </div>
                );
              })}

              {candidateUsers.length === 0 && (
                <div className="text-center py-6 text-[#949ba4] text-xs">
                  Brak dodatkowych użytkowników do zaproszenia.
                </div>
              )}
            </div>
          </div>

          {/* Security E2EE badge */}
          <div className="flex items-center gap-2 text-xs text-[#23a55a] bg-[#23a55a]/10 p-2.5 rounded-[4px] border border-[#23a55a]/20">
            <ToothShieldIcon className="w-4 h-4 shrink-0" />
            <span>Zaproszeni członkowie uzyskają dostęp do kanałów E2EE</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#2b2d31] border-t border-[#202225] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-[4px] transition-colors cursor-pointer"
          >
            Gotowe
          </button>
        </div>
      </div>
    </div>
  );
};
