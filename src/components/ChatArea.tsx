import React, { useState, useRef, useEffect } from "react";
import {
  ToothHashIcon,
  ToothLogoIcon,
  ToothCrownIcon,
} from "./ToothIcons";
import {
  Bell,
  Pin,
  Users,
  Search,
  PlusCircle,
  Send,
  HelpCircle,
  Inbox,
  Trash2,
  MicOff,
  Clock,
  ShieldCheck,
  Menu,
  Sparkles,
} from "lucide-react";
import { ServerChannel, EncryptedMessagePayload, UserIdentity, ServerGuild, ServerRole } from "../types";
import { AvatarWithDecoration } from "./AvatarWithDecoration";

interface ChatAreaProps {
  channel: ServerChannel;
  messages: EncryptedMessagePayload[];
  currentUser: UserIdentity;
  allUsers?: UserIdentity[];
  server: ServerGuild;
  onSendMessage: (text: string) => Promise<void>;
  onDeleteMessage?: (msgId: string) => Promise<void>;
  showMemberList: boolean;
  onToggleMemberList: () => void;
  onToggleMobileMenu?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channel,
  messages,
  currentUser,
  allUsers = [],
  server,
  onSendMessage,
  onDeleteMessage,
  showMemberList,
  onToggleMemberList,
  onToggleMobileMenu,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPointsGained, setShowPointsGained] = useState(false);
  const [reactions, setReactions] = useState<Record<string, { tooth: number; diamondTooth: number }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myRole: ServerRole = (server.roles && server.roles[currentUser.id]) || (server.ownerId === currentUser.id ? "admin" : "member");
  const isMutedOnServer = !!(server.mutedUserIds && server.mutedUserIds.includes(currentUser.id));
  const timeoutExpiry = server.timeouts?.[currentUser.id] || 0;
  const isTimedOutOnServer = timeoutExpiry > Date.now();
  const isRestricted = isMutedOnServer || isTimedOutOnServer;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || isRestricted) return;

    try {
      setIsSending(true);
      await onSendMessage(inputText.trim());
      setInputText("");

      // Show points pop animation (+10 🦷)
      setShowPointsGained(true);
      setTimeout(() => setShowPointsGained(false), 2200);
    } catch (err) {
      console.error("Błąd wysyłania:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddReaction = (msgId: string, type: "tooth" | "diamondTooth") => {
    setReactions((prev) => {
      const current = prev[msgId] || { tooth: 0, diamondTooth: 0 };
      return {
        ...prev,
        [msgId]: {
          ...current,
          [type]: current[type] + 1,
        },
      };
    });
  };

  const handleDelete = async (msgId: string) => {
    if (onDeleteMessage) {
      await onDeleteMessage(msgId);
    }
  };

  return (
    <div
      id="discord-chat-container"
      className="flex-1 bg-[#313338] flex flex-col min-w-0 h-full select-text"
    >
      {/* 1. Discord Top Channel Header Bar */}
      <div
        id="discord-channel-header"
        className="h-12 border-b border-[#202225] px-3 sm:px-4 flex items-center justify-between bg-[#313338] shrink-0 shadow-sm z-10"
      >
        {/* Left: Mobile Menu Button + Channel Name & Topic */}
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-1.5 -ml-1 text-[#949ba4] hover:text-white transition-colors cursor-pointer"
              title="Otwórz menu serwerów i kanałów"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <ToothHashIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#80848e] shrink-0" />
          <h2 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
            {channel.name}
          </h2>

          {channel.topic && (
            <>
              <div className="w-[1px] h-4 bg-[#4e5058] mx-2 hidden md:block" />
              <p className="text-xs text-[#949ba4] truncate max-w-md hidden md:block">
                {channel.topic}
              </p>
            </>
          )}
        </div>

        {/* Right: Discord Quick Actions (Search, Bell, Pin, Member list toggle) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 text-[#b5bac1]">
          <button title="Powiadomienia" className="hidden sm:block p-1.5 hover:text-[#dbdee1] transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
          </button>
          <button title="Przypięte wiadomości" className="hidden sm:block p-1.5 hover:text-[#dbdee1] transition-colors cursor-pointer">
            <Pin className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleMemberList}
            title="Pokaż/Ukryj listę członków"
            className={`p-1.5 transition-colors cursor-pointer ${
              showMemberList ? "text-white bg-[#35373c] rounded" : "hover:text-[#dbdee1]"
            }`}
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Search Input Box */}
          <div className="relative hidden md:flex items-center bg-[#1e1f22] rounded-[4px] px-2 py-1 text-xs">
            <input
              type="text"
              placeholder="Szukaj"
              className="w-28 bg-transparent text-[#dbdee1] focus:outline-none focus:w-40 transition-all placeholder:text-[#949ba4]"
            />
            <Search className="w-4 h-4 text-[#949ba4]" />
          </div>

          <button title="Skrzynka odbiorcza" className="p-1.5 hover:text-[#dbdee1] transition-colors cursor-pointer hidden lg:block">
            <Inbox className="w-5 h-5" />
          </button>
          <button title="Pomoc" className="p-1.5 hover:text-[#dbdee1] transition-colors cursor-pointer hidden lg:block">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Messages Viewport */}
      <div
        id="discord-messages-stream"
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar"
      >
        {/* Welcome Channel Banner at top */}
        <div className="mb-8 pt-4">
          <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center mb-3">
            <ToothHashIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Witaj w #{channel.name}!
          </h1>
          <p className="text-[#949ba4] text-sm">
            To jest początek kanału #{channel.name}.
          </p>
        </div>

        {/* Discord Date Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#3f4147]" />
          </div>
          <span className="relative bg-[#313338] px-2 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider">
            Dzisiaj
          </span>
        </div>

        {/* Messages List */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const senderUser =
            allUsers.find((u) => u.id === msg.senderId) || (isMe ? currentUser : null);
          const senderRole: ServerRole =
            (server.roles && server.roles[msg.senderId]) ||
            (server.ownerId === msg.senderId ? "admin" : "member");
          const canDelete =
            isMe || myRole === "admin" || (myRole === "support" && senderRole !== "admin");
          const msgReactions = reactions[msg.id] || { tooth: 0, diamondTooth: 0 };
          const displayText = msg.decryptedText || msg.text || msg.content || msg.ciphertext;
          const senderAvatar = senderUser?.avatarUrl || msg.senderAvatarUrl || (isMe ? currentUser.avatarUrl : "");
          const senderDecoration = senderUser?.avatarDecoration || (isMe ? currentUser.avatarDecoration : "");

          return (
            <div
              key={msg.id}
              id={`msg-row-${msg.id}`}
              className="group relative flex gap-4 px-2 py-1 -mx-2 rounded hover:bg-[#2e3035] transition-colors"
            >
              {/* Discord Floating Message Action Bar on Hover */}
              <div className="absolute right-4 -top-3 hidden group-hover:flex items-center bg-[#313338] border border-[#232428] rounded-[6px] shadow-md z-20 overflow-hidden">
                <button
                  onClick={() => handleAddReaction(msg.id, "tooth")}
                  title="Dodaj reakcję Zęba (🦷)"
                  className="p-1.5 hover:bg-[#35373c] text-[#dbdee1] hover:text-white transition-colors cursor-pointer text-xs"
                >
                  🦷
                </button>
                <button
                  onClick={() => handleAddReaction(msg.id, "diamondTooth")}
                  title="Diamentowy Ząb (💎)"
                  className="p-1.5 hover:bg-[#35373c] text-[#dbdee1] hover:text-white transition-colors cursor-pointer text-xs"
                >
                  💎
                </button>

                {/* Delete button for Author or Support / Admin */}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(msg.id)}
                    title={isMe ? "Usuń swoją wiadomość" : `Usuń wiadomość (Rola: ${myRole})`}
                    className="p-1.5 hover:bg-[#da373c] text-[#dbdee1] hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Avatar on Left with Animated Decoration */}
              <div className="shrink-0 pt-0.5">
                <AvatarWithDecoration
                  user={senderUser}
                  avatarUrl={senderAvatar}
                  displayName={msg.senderName}
                  avatarColor={isMe ? currentUser.avatarColor : senderUser?.avatarColor || "#23A55A"}
                  decorationId={senderDecoration}
                  size="md"
                />
              </div>

              {/* Message Header + Body */}
              <div className="flex-1 min-w-0">
                {/* Header (Username, Role tag, Timestamp) */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="font-semibold text-sm hover:underline cursor-pointer flex items-center gap-1.5"
                    style={{
                      color:
                        senderRole === "admin"
                          ? "#f04747"
                          : senderRole === "support"
                          ? "#23a55a"
                          : isMe
                          ? "#5865F2"
                          : "#23A55A",
                    }}
                  >
                    {msg.senderName}
                  </span>

                  {senderRole === "admin" && (
                    <ToothCrownIcon className="w-3.5 h-3.5 text-[#f0b232]" />
                  )}
                  {senderRole === "support" && (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#23a55a]" />
                  )}

                  {senderUser?.customStatus && (
                    <span className="text-[11px] text-[#949ba4] italic truncate max-w-[160px] sm:max-w-[260px]">
                      — {senderUser.customStatus}
                    </span>
                  )}

                  <span className="text-[11px] text-[#949ba4]">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message Body */}
                <div className="text-[#dbdee1] text-[0.9375rem] leading-[1.375rem] break-words whitespace-pre-wrap">
                  {displayText}
                </div>

                {/* Discord Reaction Badges */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {msgReactions.tooth > 0 && (
                    <button
                      onClick={() => handleAddReaction(msg.id, "tooth")}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] rounded-[8px] text-xs text-[#dbdee1] transition-colors cursor-pointer"
                    >
                      <span>🦷</span>
                      <span className="font-bold text-[#5865f2]">{msgReactions.tooth}</span>
                    </button>
                  )}
                  {msgReactions.diamondTooth > 0 && (
                    <button
                      onClick={() => handleAddReaction(msg.id, "diamondTooth")}
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#2b2d31] hover:bg-[#35373c] border border-[#3f4147] rounded-[8px] text-xs text-[#dbdee1] transition-colors cursor-pointer"
                    >
                      <span>💎</span>
                      <span className="font-bold text-[#00a8fc]">{msgReactions.diamondTooth}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Discord Message Input Bar */}
      <div className="px-4 pb-6 pt-1 shrink-0 relative">
        {/* Floating Points Gained Animation */}
        {showPointsGained && (
          <div className="absolute -top-7 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs px-3 py-1 rounded-full shadow-lg border border-amber-300 animate-bounce flex items-center gap-1.5 pointer-events-none z-30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+10 ToothPoints! 🦷</span>
          </div>
        )}
        {isRestricted ? (
          <div className="bg-[#da373c]/15 border border-[#da373c]/30 rounded-[8px] px-4 py-3 text-center flex items-center justify-center gap-2 text-[#da373c] text-sm font-semibold">
            {isMutedOnServer ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Zostałeś wyciszony na tym serwerze przez moderatora.</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>Masz nałożoną przerwę (Timeout) na tym serwerze.</span>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative">
            <div className="flex items-center gap-3 bg-[#383a40] rounded-[8px] px-4 py-2.5 transition-all">
              {/* Plus File/Attachment Button */}
              <button
                type="button"
                title="Dodaj załącznik"
                className="w-6 h-6 rounded-full bg-[#4e5058] hover:bg-[#dbdee1] text-[#313338] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
              </button>

              {/* Input Field */}
              <input
                id="input-discord-chat"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Napisz wiadomość na kanale #${channel.name}...`}
                className="flex-1 bg-transparent text-[#dbdee1] text-[0.9375rem] focus:outline-none placeholder:text-[#80848e]"
                disabled={isSending}
              />

              {/* Right Icons: Tooth Emoji Picker, Send */}
              <div className="flex items-center gap-2 shrink-0 text-[#b5bac1]">
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + " 🦷 ")}
                  title="Wstaw ikonę zęba"
                  className="hover:text-[#dbdee1] transition-colors cursor-pointer text-base"
                >
                  🦷
                </button>

                <button
                  id="btn-discord-send"
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-1.5 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-40 disabled:hover:bg-[#5865F2] text-white rounded-[4px] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-[#949ba4]">
              <span className="font-mono">ToothChat Messenger</span>
              <span className="font-mono hidden md:inline">Shift + Enter = nowa linia</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

