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
  Image as ImageIcon,
  X,
  Maximize2,
  Download,
  Loader2,
} from "lucide-react";
import { ServerChannel, EncryptedMessagePayload, UserIdentity, ServerGuild, ServerRole } from "../types";
import { AvatarWithDecoration } from "./AvatarWithDecoration";
import { ImageViewerModal } from "./ImageViewerModal";
import { processAndCompressImage, formatBytes, ProcessedImage } from "../utils/imageUtils";
import { ServerInviteEmbed } from "./ServerInviteEmbed";

interface ChatAreaProps {
  channel: ServerChannel;
  messages: EncryptedMessagePayload[];
  currentUser: UserIdentity;
  allUsers?: UserIdentity[];
  server: ServerGuild;
  joinedServers?: ServerGuild[];
  onSendMessage: (text: string, imageUrl?: string) => Promise<void>;
  onDeleteMessage?: (msgId: string) => Promise<void>;
  onJoinServer?: (serverId: string) => Promise<void> | void;
  showMemberList: boolean;
  onToggleMemberList: () => void;
  onToggleMobileMenu?: () => void;
  onOpenMemberProfile?: (user: UserIdentity) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  channel,
  messages,
  currentUser,
  allUsers = [],
  server,
  joinedServers = [],
  onSendMessage,
  onDeleteMessage,
  onJoinServer,
  showMemberList,
  onToggleMemberList,
  onToggleMobileMenu,
  onOpenMemberProfile,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    senderName?: string;
    timestamp?: number;
  } | null>(null);

  const [reactions, setReactions] = useState<Record<string, { tooth: number; diamondTooth: number }>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myRole: ServerRole = (server.roles && server.roles[currentUser.id]) || (server.ownerId === currentUser.id ? "admin" : "member");
  const isMutedOnServer = !!(server.mutedUserIds && server.mutedUserIds.includes(currentUser.id));
  const timeoutExpiry = server.timeouts?.[currentUser.id] || 0;
  const isTimedOutOnServer = timeoutExpiry > Date.now();
  const isRestricted = isMutedOnServer || isTimedOutOnServer;

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle image file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("Wybierz poprawny plik graficzny (PNG, JPG, WebP, GIF itp.).");
      return;
    }

    try {
      setIsProcessingImage(true);
      const processed = await processAndCompressImage(file);
      setSelectedImage(processed);
    } catch (err) {
      console.error("Błąd przetwarzania zdjęcia:", err);
      alert("Nie udało się załadować zdjęcia.");
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        try {
          setIsProcessingImage(true);
          const processed = await processAndCompressImage(file);
          setSelectedImage(processed);
        } catch (err) {
          console.error("Błąd przetwarzania przeciągniętego zdjęcia:", err);
        } finally {
          setIsProcessingImage(false);
        }
      }
    }
  };

  // Paste from clipboard handler
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            try {
              setIsProcessingImage(true);
              const processed = await processAndCompressImage(blob, 1200, 0.82);
              setSelectedImage(processed);
            } catch (err) {
              console.error("Błąd wklejania zdjęcia:", err);
            } finally {
              setIsProcessingImage(false);
            }
            break;
          }
        }
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const hasText = inputText.trim().length > 0;
    const hasImage = !!selectedImage;

    if ((!hasText && !hasImage) || isSending || isRestricted) return;

    try {
      setIsSending(true);
      const textToSend = inputText.trim();
      const imageToSend = selectedImage ? selectedImage.dataUrl : undefined;

      await onSendMessage(textToSend, imageToSend);
      setInputText("");
      setSelectedImage(null);
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className="flex-1 bg-[#313338] flex flex-col min-w-0 h-full select-text relative"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-[#5865f2]/20 backdrop-blur-xs border-2 border-dashed border-[#5865f2] rounded-lg flex flex-col items-center justify-center p-6 text-white pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center mb-3 shadow-lg">
            <ImageIcon className="w-8 h-8 text-white" />
          </div>
          <p className="text-xl font-bold mb-1">Upuść zdjęcie tutaj</p>
          <p className="text-sm text-purple-200">Wyślij zdjęcie na kanał #{channel.name}</p>
        </div>
      )}

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
        ref={messagesContainerRef}
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
            To jest początek kanału #{channel.name}. Możesz pisać wiadomości oraz przesyłać zdjęcia i zrzuty ekranu!
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
          const displayText = msg.decryptedText || msg.text || msg.content || (msg.imageUrl ? "" : msg.ciphertext);
          const senderAvatar =
            senderUser?.avatarUrl ||
            msg.senderAvatarUrl ||
            (isMe ? currentUser.avatarUrl : "");
          const senderDecoration =
            senderUser?.avatarDecoration ||
            msg.senderAvatarDecoration ||
            (isMe ? currentUser.avatarDecoration : "");
          const senderColor =
            senderUser?.avatarColor ||
            msg.senderAvatarColor ||
            (isMe ? currentUser.avatarColor : "#23A55A");

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
              <div
                className="shrink-0 pt-0.5 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  if (onOpenMemberProfile) {
                    const fallbackUser: UserIdentity = senderUser || {
                      id: msg.senderId,
                      displayName: msg.senderName,
                      email: "",
                      avatarUrl: msg.senderAvatarUrl || "",
                      avatarColor: msg.senderAvatarColor || "#5865F2",
                      avatarDecoration: msg.senderAvatarDecoration || "",
                      status: "online",
                    };
                    onOpenMemberProfile(fallbackUser);
                  }
                }}
              >
                <AvatarWithDecoration
                  user={senderUser}
                  avatarUrl={senderAvatar}
                  displayName={msg.senderName}
                  avatarColor={senderColor}
                  decorationId={senderDecoration}
                  size="md"
                />
              </div>

              {/* Message Header + Body */}
              <div className="flex-1 min-w-0">
                {/* Header (Username, Role tag, Timestamp) */}
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    onClick={() => {
                      if (onOpenMemberProfile) {
                        const fallbackUser: UserIdentity = senderUser || {
                          id: msg.senderId,
                          displayName: msg.senderName,
                          email: "",
                          avatarUrl: msg.senderAvatarUrl || "",
                          avatarColor: msg.senderAvatarColor || "#5865F2",
                          avatarDecoration: msg.senderAvatarDecoration || "",
                          status: "online",
                        };
                        onOpenMemberProfile(fallbackUser);
                      }
                    }}
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

                {/* Text Message Content (if present) */}
                {displayText && (
                  <div className="text-[#dbdee1] text-[0.9375rem] leading-[1.375rem] break-words whitespace-pre-wrap">
                    {displayText}
                  </div>
                )}

                {/* Discord Server Invite Card */}
                {msg.serverInvite && (
                  <ServerInviteEmbed
                    invite={msg.serverInvite}
                    currentUser={currentUser}
                    joinedServers={joinedServers}
                    onJoinServer={onJoinServer}
                  />
                )}

                {/* Attached Photo / Image (if present) */}
                {msg.imageUrl && (
                  <div className="mt-2 relative inline-block group/img max-w-full">
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: msg.imageUrl!,
                          senderName: msg.senderName,
                          timestamp: msg.timestamp,
                        })
                      }
                      className="relative overflow-hidden rounded-[10px] border border-[#232428] bg-[#1e1f22] cursor-pointer shadow-md transition-all hover:border-[#5865f2]/50"
                    >
                      <img
                        src={msg.imageUrl}
                        alt="Załącznik graficzny"
                        className="max-h-80 max-w-full sm:max-w-md md:max-w-lg object-cover rounded-[8px] transition-transform duration-200 group-hover/img:scale-[1.01]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                        <div className="px-2.5 py-1.5 bg-black/70 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Powiększ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
      </div>

      {/* 3. Discord Message Input Bar */}
      <div className="px-3 sm:px-4 pb-2 sm:pb-5 pt-1 shrink-0 relative">
        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Selected Image Pending Preview Card */}
        {selectedImage && (
          <div className="mb-2 p-2.5 bg-[#2b2d31] border border-[#3f4147] rounded-[10px] flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative w-14 h-14 rounded-[6px] overflow-hidden bg-[#1e1f22] border border-[#383a40] shrink-0">
                <img
                  src={selectedImage.dataUrl}
                  alt="Podgląd załącznika"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                    {selectedImage.fileName}
                  </span>
                </div>
                <div className="text-[11px] text-[#949ba4] mt-0.5">
                  {selectedImage.width}×{selectedImage.height} px • {formatBytes(selectedImage.sizeBytes)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1.5 hover:bg-[#da373c]/20 text-[#da373c] rounded-[6px] transition-colors cursor-pointer"
              title="Usuń to zdjęcie"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Spinner for Image Processing */}
        {isProcessingImage && (
          <div className="mb-2 p-2 bg-[#2b2d31] rounded-[8px] flex items-center gap-2 text-xs text-[#dbdee1]">
            <Loader2 className="w-4 h-4 animate-spin text-[#5865f2]" />
            <span>Przetwarzanie i kompresja zdjęcia...</span>
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
            <div className="flex items-center gap-2 sm:gap-3 bg-[#383a40] rounded-[8px] px-3 sm:px-4 py-2 sm:py-2.5 transition-all">
              {/* Plus File/Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Dodaj zdjęcie lub załącznik (możesz też przeciągnąć lub wkleić ze schowka)"
                className="w-7 h-7 rounded-full bg-[#4e5058] hover:bg-[#5865F2] text-[#dbdee1] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
              </button>

              {/* Input Field */}
              <input
                id="input-discord-chat"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedImage
                    ? `Dodaj podpis do zdjęcia i wciśnij Enter...`
                    : `Napisz na #${channel.name} lub wklej/upuść zdjęcie...`
                }
                className="flex-1 bg-transparent text-[#dbdee1] text-[0.9375rem] focus:outline-none placeholder:text-[#80848e] min-w-0"
                disabled={isSending}
              />

              {/* Right Icons: Tooth Emoji Picker, Send */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-[#b5bac1]">
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + " 🦷 ")}
                  title="Wstaw ikonę zęba"
                  className="p-1 hover:text-[#dbdee1] transition-colors cursor-pointer text-base"
                >
                  🦷
                </button>

                <button
                  id="btn-discord-send"
                  type="submit"
                  disabled={(!inputText.trim() && !selectedImage) || isSending}
                  className="p-2 sm:p-1.5 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-40 disabled:hover:bg-[#5865F2] text-white rounded-[4px] transition-all cursor-pointer flex items-center justify-center"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-[#949ba4]">
              <span className="font-mono">ToothChat • Obsługa wysyłania zdjęć, wklejania Ctrl+V i przeciągania</span>
              <span className="font-mono hidden md:inline">Shift + Enter = nowa linia</span>
            </div>
          </form>
        )}
      </div>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {lightboxImage && (
        <ImageViewerModal
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          imageUrl={lightboxImage.url}
          senderName={lightboxImage.senderName}
          timestamp={lightboxImage.timestamp}
        />
      )}
    </div>
  );
};
