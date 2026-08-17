import React, { useState, useEffect, useRef } from "react";
import {
  ToothLogoIcon,
  ToothCrownIcon,
  ToothShieldIcon,
} from "./ToothIcons";
import {
  Users,
  MessageSquare,
  Phone,
  Video,
  UserPlus,
  Search,
  Check,
  X,
  Clock,
  Send,
  PlusCircle,
  Trash2,
  Bell,
  Inbox,
  HelpCircle,
  Edit2,
  Mic,
  MicOff,
  Headphones,
  LogOut,
  Sparkles,
  ArrowLeft,
  Smile,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { UserIdentity, EncryptedMessagePayload, FriendRequest } from "../types";
import { firestoreService } from "../services/firestoreEngine";
import { AvatarWithDecoration } from "./AvatarWithDecoration";

interface DirectMessagesHomeViewProps {
  currentUser: UserIdentity;
  allUsers: UserIdentity[];
  activeDmUser?: UserIdentity | null;
  onSelectDmUser?: (user: UserIdentity | null) => void;
  onOpenDirectChat?: (user: UserIdentity) => void;
  onStartCall?: (targetUser: UserIdentity) => void;
  onStartDirectCall?: (targetUser: UserIdentity) => void;
  onSignOut?: () => void;
  onOpenAvatarModal?: () => void;
  onUpdateDisplayName?: (newName: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onBackToServers?: () => void;
  onToggleMobileMenu?: () => void;
}

export const DirectMessagesHomeView: React.FC<DirectMessagesHomeViewProps> = ({
  currentUser,
  allUsers,
  activeDmUser: propActiveDmUser,
  onSelectDmUser,
  onOpenDirectChat,
  onStartCall,
  onStartDirectCall,
  onSignOut,
  onOpenAvatarModal,
  onUpdateDisplayName,
  isMuted = false,
  onToggleMute,
  onBackToServers,
  onToggleMobileMenu,
}) => {
  // Internal active DM user state fallback
  const [internalDmUser, setInternalDmUser] = useState<UserIdentity | null>(null);
  const activeUser = propActiveDmUser !== undefined ? propActiveDmUser : internalDmUser;

  const [mobileSection, setMobileSection] = useState<"dms" | "friends">("dms");
  const [friendsTab, setFriendsTab] = useState<"online" | "all" | "pending" | "add">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendInput, setAddFriendInput] = useState("");
  const [addFriendStatus, setAddFriendStatus] = useState<string | null>(null);

  // DMs message state
  const [dmChannelId, setDmChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<EncryptedMessagePayload[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Name edit in bottom bar
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState(currentUser.displayName);
  const [isDeafened, setIsDeafened] = useState(false);

  // Filter out current user from all users list
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);

  const handleSelectUser = (user: UserIdentity | null) => {
    setInternalDmUser(user);
    if (user && currentUser) {
      firestoreService.markDirectMessagesAsRead(currentUser.id, user.id);
    }
    if (onSelectDmUser) {
      onSelectDmUser(user);
    }
  };

  const handleTriggerCall = (target: UserIdentity) => {
    if (onStartCall) {
      onStartCall(target);
    } else if (onStartDirectCall) {
      onStartDirectCall(target);
    }
  };

  // Calculate DM channel ID when activeUser changes
  useEffect(() => {
    if (activeUser) {
      const sortedIds = [currentUser.id, activeUser.id].sort();
      const chId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
      setDmChannelId(chId);

      if (currentUser) {
        firestoreService.markDirectMessagesAsRead(currentUser.id, activeUser.id);
      }

      const unsub = firestoreService.subscribeChannelMessages(chId, (msgs) => {
        setMessages(msgs);
        if (currentUser && activeUser) {
          firestoreService.markDirectMessagesAsRead(currentUser.id, activeUser.id);
        }
      });

      return () => unsub();
    } else {
      setDmChannelId(null);
      setMessages([]);
    }
  }, [activeUser, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendDm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || !activeUser || !dmChannelId) return;

    try {
      setIsSending(true);
      const text = inputText.trim();
      const newMsg: EncryptedMessagePayload = {
        id: `msg_dm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        channelId: dmChannelId,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderAvatarUrl: currentUser.avatarUrl,
        recipientId: activeUser.id,
        senderPublicKey: currentUser.publicKeySpki,
        ciphertext: text,
        text: text,
        decryptedText: text,
        iv: "e2ee_direct_iv",
        keyFingerprint: "TOOTH-DM-E2EE",
        timestamp: Date.now(),
      };

      await firestoreService.sendEncryptedMessage(newMsg);
      await firestoreService.recordUserMessageSent(currentUser.id);
      setInputText("");
    } catch (err) {
      console.error("Błąd wysyłania DM:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMsg = async (msgId: string) => {
    if (dmChannelId) {
      await firestoreService.deleteMessage(dmChannelId, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = addFriendInput.trim().toLowerCase();
    if (!queryStr) return;

    const found = allUsers.find(
      (u) =>
        u.id.toLowerCase() === queryStr ||
        u.displayName.toLowerCase() === queryStr ||
        u.email?.toLowerCase() === queryStr
    );

    if (found) {
      if (found.id === currentUser.id) {
        setAddFriendStatus("Nie możesz dodać samego siebie do znajomych.");
      } else {
        setAddFriendStatus(`Wysłano zaproszenie do ${found.displayName}!`);
        setAddFriendInput("");
        // Select this user for DM
        setTimeout(() => {
          handleSelectUser(found);
        }, 800);
      }
    } else {
      setAddFriendStatus(`Nie znaleziono użytkownika "${addFriendInput}". W ToothChat możesz rozmawiać z każdym członkiem.`);
    }
  };

  const handleSaveName = () => {
    if (editNameInput.trim().length > 0) {
      if (onUpdateDisplayName) {
        onUpdateDisplayName(editNameInput.trim());
      }
      setIsEditingName(false);
    }
  };

  // Filtered friends lists
  const onlineFriends = otherUsers.filter((u) => u.status !== "offline");
  const filteredFriends = otherUsers.filter((u) =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex min-w-0 h-full bg-[#313338] overflow-hidden">
      {/* 1. Direct Messages Left Sidebar */}
      <div
        className={`w-full md:w-60 bg-[#2b2d31] flex flex-col h-full select-none shrink-0 border-r border-[#202225] ${
          activeUser
            ? "hidden md:flex"
            : mobileSection === "dms"
            ? "flex"
            : "hidden md:flex"
        }`}
      >
        {/* Search / Find Conversation Box + Mobile Menu Toggle */}
        <div className="h-12 border-b border-[#202225] flex items-center px-3 shadow-sm justify-between gap-2 shrink-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 -ml-1 text-[#949ba4] hover:text-white transition-colors cursor-pointer rounded-md active:bg-[#35373c]"
              title="Otwórz menu serwerów"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              handleSelectUser(null);
              setMobileSection("friends");
            }}
            className="flex-1 bg-[#1e1f22] text-[#949ba4] hover:text-[#dbdee1] text-xs px-2.5 py-1.5 rounded-[4px] flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Znajdź lub zacznij rozmowę</span>
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* DM Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 custom-scrollbar">
          {/* Friends Tab Button */}
          <button
            onClick={() => {
              handleSelectUser(null);
              setMobileSection("friends");
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium transition-colors cursor-pointer ${
              activeUser === null && (mobileSection === "friends" || window.innerWidth >= 768)
                ? "bg-[#35373c] text-white"
                : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
            }`}
          >
            <Users className="w-5 h-5 text-[#5865F2]" />
            <span className="font-semibold">Znajomi</span>
          </button>

          {/* DM Category Header */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-2 mb-1 text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
              <span>WIADOMOŚCI BEZPOŚREDNIE</span>
              <button
                onClick={() => {
                  handleSelectUser(null);
                  setFriendsTab("add");
                  setMobileSection("friends");
                }}
                title="Utwórz bezpośrednią wiadomość"
                className="hover:text-white transition-colors cursor-pointer p-0.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of direct message conversations */}
            <div className="space-y-0.5">
              {otherUsers.map((user) => {
                const isActive = activeUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      handleSelectUser(user);
                      setMobileSection("dms");
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-[4px] text-sm font-medium transition-colors cursor-pointer group active:scale-[0.99] ${
                      isActive
                        ? "bg-[#35373c] text-white"
                        : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                    }`}
                  >
                    {/* User Avatar with Animated Decoration & Status */}
                    <AvatarWithDecoration
                      user={user}
                      avatarUrl={user.avatarUrl}
                      displayName={user.displayName}
                      avatarColor={user.avatarColor}
                      decorationId={user.avatarDecoration}
                      status={user.status || "online"}
                      size="sm"
                      showStatus={true}
                    />

                    {/* Name & Custom Status (No Email!) */}
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-xs font-semibold text-[#dbdee1] group-hover:text-white">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-[#949ba4] truncate">
                        {user.customStatus || (user.status === "offline" ? "Niewidoczny" : "Online")}
                      </p>
                    </div>
                  </button>
                );
              })}

              {otherUsers.length === 0 && (
                <div className="text-center py-4 text-xs text-[#80848e]">
                  Brak innych użytkowników.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Discord User Status Bar (Bottom Profile Panel) */}
        <div
          id="discord-user-profile-bar"
          className="h-[52px] bg-[#232428] px-2 flex items-center justify-between shrink-0"
        >
          <div
            onClick={onOpenAvatarModal}
            className="flex items-center gap-2 min-w-0 flex-1 hover:bg-[#35373c]/50 p-1 rounded-[4px] transition-colors cursor-pointer group"
            title="Kliknij, aby zmienić zdjęcie profilowe lub status"
          >
            {/* Avatar with Status Badge */}
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-white text-xs shadow"
                style={{ backgroundColor: currentUser.avatarColor || "#5865F2" }}
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ToothLogoIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23a55a] rounded-full border-2 border-[#232428]" />
            </div>

            {/* User Name & Subtext (Status instead of email!) */}
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
                  <p className="text-[10px] text-[#949ba4] truncate font-sans">
                    {currentUser.customStatus || "Online"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center shrink-0">
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                title={isMuted ? "Włącz mikrofon" : "Wycisz mikrofon"}
                className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                  isMuted
                    ? "text-[#da373c] hover:bg-[#35373c]"
                    : "text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={() => setIsDeafened(!isDeafened)}
              title={isDeafened ? "Wyłącz wygłuszenie" : "Wygłusz dźwięk"}
              className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
                isDeafened
                  ? "text-[#da373c] hover:bg-[#35373c]"
                  : "text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c]"
              }`}
            >
              <Headphones className="w-4 h-4" />
            </button>

            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Wyloguj się"
                className="w-8 h-8 rounded-[4px] flex items-center justify-center text-[#949ba4] hover:text-[#da373c] hover:bg-[#35373c] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Stage: Friends Manager OR Active Direct Message Chat */}
      {activeUser ? (
        /* Direct Message Chat View */
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#313338]">
          {/* Header */}
          <div className="h-12 border-b border-[#202225] px-4 flex items-center justify-between bg-[#313338] shrink-0 shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              {/* Back to DM list button (Mobile friendly) */}
              <button
                onClick={() => handleSelectUser(null)}
                className="md:hidden p-1.5 -ml-1.5 text-[#949ba4] hover:text-white transition-colors cursor-pointer"
                title="Wróć do listy znajomych"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative shrink-0">
                <div
                  className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: activeUser.avatarColor || "#5865F2" }}
                >
                  {activeUser.avatarUrl ? (
                    <img
                      src={activeUser.avatarUrl}
                      alt={activeUser.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ToothLogoIcon className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#313338] ${
                    activeUser.status === "offline" ? "bg-[#80848e]" : "bg-[#23a55a]"
                  }`}
                />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-white text-sm tracking-tight truncate">
                  {activeUser.displayName}
                </h2>
                <p className="text-[10px] text-[#949ba4] truncate">
                  {activeUser.customStatus || "Wiadomość bezpośrednia E2EE"}
                </p>
              </div>
            </div>

            {/* Quick Actions (Close DM) */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#b5bac1]">
              <button
                onClick={() => handleSelectUser(null)}
                title="Zamknij czat"
                className="p-1.5 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* DM Message stream */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6 space-y-4 custom-scrollbar">
            {/* Top greeting */}
            <div className="mb-6 pt-2">
              <AvatarWithDecoration
                user={activeUser}
                avatarUrl={activeUser.avatarUrl}
                displayName={activeUser.displayName}
                avatarColor={activeUser.avatarColor}
                decorationId={activeUser.avatarDecoration}
                status={activeUser.status || "online"}
                size="lg"
                showStatus={false}
                className="mb-3"
              />
              <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                {activeUser.displayName}
              </h1>
              <p className="text-[#949ba4] text-xs leading-relaxed">
                To jest początek Twojej bezpośredniej historii wiadomości z{" "}
                <span className="text-white font-semibold">{activeUser.displayName}</span>. Wszystkie wiadomości są w pełni zabezpieczone szyfrowaniem end-to-end.
              </p>
            </div>

            {/* Messages List */}
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const displayText = msg.decryptedText || msg.text || msg.ciphertext;
              const senderUser = isMe ? currentUser : activeUser;

              return (
                <div
                  key={msg.id}
                  className="group relative flex gap-3 px-2 py-1 -mx-2 rounded hover:bg-[#2e3035] transition-colors"
                >
                  {/* Floating Action Bar (Delete for own messages) */}
                  {isMe && (
                    <div className="absolute right-2 -top-3 hidden group-hover:flex items-center bg-[#313338] border border-[#232428] rounded-[4px] shadow-md z-10 overflow-hidden">
                      <button
                        onClick={() => handleDeleteMsg(msg.id)}
                        title="Usuń wiadomość"
                        className="p-1.5 hover:bg-[#da373c] text-[#dbdee1] hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Avatar with Animated Decoration */}
                  <div className="shrink-0 pt-0.5">
                    <AvatarWithDecoration
                      user={senderUser}
                      avatarUrl={senderUser.avatarUrl}
                      displayName={senderUser.displayName}
                      avatarColor={senderUser.avatarColor}
                      decorationId={senderUser.avatarDecoration}
                      status={senderUser.status || "online"}
                      size="sm"
                      showStatus={false}
                    />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: isMe ? "#5865F2" : "#23A55A" }}
                      >
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-[#949ba4]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-[#dbdee1] text-sm break-words whitespace-pre-wrap">
                      {displayText}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Bar */}
          <div className="px-3 md:px-4 pb-4 md:pb-6 pt-1 shrink-0 bg-[#313338]">
            <form onSubmit={handleSendDm} className="relative">
              <div className="flex items-center gap-2 md:gap-3 bg-[#383a40] rounded-[8px] px-3 md:px-4 py-2 md:py-2.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Napisz do @${activeUser.displayName}...`}
                  className="flex-1 bg-transparent text-[#dbdee1] text-sm focus:outline-none placeholder:text-[#80848e]"
                  disabled={isSending}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + " 🦷 ")}
                  className="text-base hover:text-white cursor-pointer px-1"
                  title="Dodaj ząbkową emotkę"
                >
                  🦷
                </button>
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-1.5 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-40 text-white rounded-[4px] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Friends Dashboard View (When no DM is active) */
        <div
          className={`flex-1 flex flex-col h-full min-w-0 bg-[#313338] ${
            mobileSection === "friends" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Top Bar with Friends Tabs */}
          <div className="h-12 border-b border-[#202225] px-3 sm:px-4 flex items-center justify-between bg-[#313338] shrink-0 shadow-sm gap-2">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto custom-scrollbar min-w-0">
              {/* Back to DMs list on mobile */}
              <button
                onClick={() => setMobileSection("dms")}
                className="md:hidden p-2 -ml-1 text-[#949ba4] hover:text-white transition-colors cursor-pointer rounded-md active:bg-[#35373c]"
                title="Wróć do listy rozmów"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-white font-bold text-sm shrink-0 pr-2 border-r border-[#3f4147]">
                <Users className="w-5 h-5 text-[#80848e]" />
                <span className="hidden sm:inline">Znajomi</span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 text-sm font-medium">
                <button
                  onClick={() => setFriendsTab("online")}
                  className={`px-2 py-1 rounded-[4px] transition-colors cursor-pointer text-xs md:text-sm whitespace-nowrap ${
                    friendsTab === "online"
                      ? "bg-[#35373c] text-white"
                      : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                  }`}
                >
                  Dostępni ({onlineFriends.length})
                </button>

                <button
                  onClick={() => setFriendsTab("all")}
                  className={`px-2 py-1 rounded-[4px] transition-colors cursor-pointer text-xs md:text-sm whitespace-nowrap ${
                    friendsTab === "all"
                      ? "bg-[#35373c] text-white"
                      : "text-[#949ba4] hover:bg-[#35373c]/50 hover:text-[#dbdee1]"
                  }`}
                >
                  Wszyscy ({otherUsers.length})
                </button>

                <button
                  onClick={() => setFriendsTab("add")}
                  className={`px-2.5 py-1 rounded-[4px] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    friendsTab === "add"
                      ? "bg-[#23a55a] text-white"
                      : "bg-[#23a55a]/20 text-[#23a55a] hover:bg-[#23a55a] hover:text-white"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dodaj znajomego</span>
                  <span className="sm:hidden">Dodaj</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {friendsTab === "add" ? (
              /* Add Friend Screen */
              <div className="max-w-xl space-y-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider text-xs">
                  DODAJ ZNAJOMEGO
                </h3>
                <p className="text-xs text-[#949ba4]">
                  Możesz dodać znajomego, podając jego nazwę użytkownika, identyfikator lub adres e-mail.
                </p>

                <form onSubmit={handleAddFriend} className="relative flex items-center">
                  <input
                    type="text"
                    value={addFriendInput}
                    onChange={(e) => setAddFriendInput(e.target.value)}
                    placeholder="Wpisz nazwę użytkownika, np. Bob, Carol..."
                    className="w-full bg-[#1e1f22] text-white pl-4 pr-36 py-3 rounded-[8px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
                  />
                  <button
                    type="submit"
                    disabled={!addFriendInput.trim()}
                    className="absolute right-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-40 text-white text-xs font-semibold rounded-[4px] transition-colors cursor-pointer"
                  >
                    Wyślij zaproszenie
                  </button>
                </form>

                {addFriendStatus && (
                  <p className="text-xs text-[#23a55a] font-medium bg-[#23a55a]/10 p-3 rounded border border-[#23a55a]/20">
                    {addFriendStatus}
                  </p>
                )}

                {/* Quick Add Suggestions */}
                <div className="pt-6 border-t border-[#35373c] space-y-3">
                  <h4 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                    Sugerowani użytkownicy ToothChat
                  </h4>
                  <div className="space-y-2">
                    {otherUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-[6px] border border-[#202225] hover:border-[#35373c] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <AvatarWithDecoration
                            user={user}
                            avatarUrl={user.avatarUrl}
                            displayName={user.displayName}
                            avatarColor={user.avatarColor}
                            decorationId={user.avatarDecoration}
                            status={user.status || "online"}
                            size="md"
                            showStatus={false}
                          />
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {user.displayName}
                            </p>
                            <p className="text-xs text-[#949ba4]">
                              {user.customStatus || (user.status === "offline" ? "Niewidoczny" : "Online")}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectUser(user)}
                          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-medium rounded-[4px] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Napisz
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Friends List (All / Online) */
              <div className="space-y-4 max-w-4xl">
                {/* Search in friends */}
                <div className="relative flex items-center bg-[#1e1f22] rounded-[4px] px-3 py-2 text-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Szukaj znajomego..."
                    className="w-full bg-transparent text-[#dbdee1] focus:outline-none placeholder:text-[#949ba4]"
                  />
                  <Search className="w-4 h-4 text-[#949ba4]" />
                </div>

                <div className="text-[11px] font-bold tracking-wider text-[#949ba4] uppercase">
                  {friendsTab === "online"
                    ? `DOSTĘPNI — ${onlineFriends.length}`
                    : `WSZYSCY ZNAJOMI — ${filteredFriends.length}`}
                </div>

                {/* Friend cards */}
                <div className="space-y-1">
                  {(friendsTab === "online" ? onlineFriends : filteredFriends).map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between px-3 py-2 rounded-[6px] hover:bg-[#35373c]/60 transition-colors group cursor-pointer"
                      onClick={() => handleSelectUser(friend)}
                    >
                      {/* Left: Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarWithDecoration
                          user={friend}
                          avatarUrl={friend.avatarUrl}
                          displayName={friend.displayName}
                          avatarColor={friend.avatarColor}
                          decorationId={friend.avatarDecoration}
                          status={friend.status || "online"}
                          size="md"
                          showStatus={true}
                        />

                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-white group-hover:text-[#5865F2] transition-colors truncate">
                            {friend.displayName}
                          </p>
                          <p className="text-xs text-[#949ba4] truncate">
                            {friend.customStatus || (friend.status === "offline" ? "Niewidoczny" : "Online")}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectUser(friend)}
                          title="Wiadomość"
                          className="p-2 bg-[#2b2d31] hover:bg-[#5865f2] text-[#dbdee1] hover:text-white rounded-full transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredFriends.length === 0 && (
                    <div className="text-center py-12 text-[#949ba4] text-xs">
                      Nie znaleziono żadnych znajomych.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
