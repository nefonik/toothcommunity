import React, { useState, useEffect } from "react";
import {
  ToothLogoIcon,
  ToothShieldIcon,
  ToothCrownIcon,
  ToothPlusIcon,
} from "./ToothIcons";
import {
  Users,
  UserPlus,
  PhoneCall,
  MessageSquare,
  KeyRound,
  Check,
  X,
  Search,
  ShieldCheck,
} from "lucide-react";
import { UserIdentity } from "../types";
import { firestoreService } from "../services/firestoreEngine";

interface FriendsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserIdentity;
  onStartDirectCall: (targetUser: UserIdentity) => void;
  onOpenDirectChat?: (targetUser: UserIdentity) => void;
}

export const FriendsManagerModal: React.FC<FriendsManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onStartDirectCall,
  onOpenDirectChat,
}) => {
  const [users, setUsers] = useState<UserIdentity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendHash, setAddFriendHash] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      firestoreService.getAllUsers().then(setUsers);
    }
  }, [isOpen]);

  const handleAddFriend = () => {
    if (!addFriendHash.trim()) return;
    setSuccessMsg(`Wysłano prośbę o kontakt z kluczem publicznym do #${addFriendHash.trim()}`);
    setAddFriendHash("");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.tokenHash.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div
      id="friends-manager-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#232428] rounded-[8px] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Discord Header */}
        <div className="p-4 border-b border-[#232428] bg-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#5865f2] text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Znajomi ToothChat & Klucze Publiczne
              </h3>
              <p className="text-xs text-[#949ba4]">
                Połączenia P2P i bezpośrednie czaty E2EE (Zero-Knowledge)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Friend Input */}
        <div className="p-4 bg-[#2b2d31] border-b border-[#232428] space-y-2">
          <label className="block text-xs font-semibold text-[#dbdee1]">
            Dodaj znajomego przez Hash Tokena lub ID:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={addFriendHash}
              onChange={(e) => setAddFriendHash(e.target.value)}
              placeholder="Wklej hash tokena np. toothA1b2C3d4E5F6..."
              className="flex-1 bg-[#1e1f22] border border-[#3f4147] rounded-[4px] px-3 py-2 text-xs text-white placeholder:text-[#80848e] focus:outline-none focus:border-[#5865f2] font-mono"
            />
            <button
              onClick={handleAddFriend}
              disabled={!addFriendHash.trim()}
              className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-40 text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Wyślij Handshake
            </button>
          </div>
          {successMsg && (
            <p className="text-xs text-[#23a55a] font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {successMsg}
            </p>
          )}
        </div>

        {/* User Search & List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          <div className="flex items-center gap-2 bg-[#1e1f22] border border-[#3f4147] rounded-[4px] px-3 py-2 text-xs text-[#dbdee1] mb-3">
            <Search className="w-4 h-4 text-[#80848e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj użytkowników..."
              className="bg-transparent flex-1 focus:outline-none text-white placeholder:text-[#80848e]"
            />
          </div>

          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-[#2b2d31] border border-[#3f4147] hover:border-[#5865f2] rounded-[6px] p-3 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: u.avatarColor || "#5865f2" }}
                  >
                    <ToothLogoIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {u.displayName}
                    </h4>
                    <p className="text-[10px] text-[#949ba4] font-mono flex items-center gap-1">
                      <ToothShieldIcon className="w-3 h-3 text-[#23a55a]" />
                      Hash: #{u.tokenHash.slice(0, 10)}... | ECDH: {u.publicKeySpki.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenDirectChat) {
                        onOpenDirectChat(u);
                      }
                    }}
                    title="Czat bezpośredni E2EE"
                    className="p-2 bg-[#1e1f22] hover:bg-[#5865f2] text-[#dbdee1] hover:text-white rounded-[4px] transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
