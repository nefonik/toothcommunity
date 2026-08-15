import React, { useState } from "react";
import { ToothShieldIcon } from "./ToothIcons";
import { X, Plus } from "lucide-react";
import { ServerGuild, UserIdentity } from "../types";

interface CreateServerModalProps {
  isOpen?: boolean;
  currentUser: UserIdentity;
  onClose: () => void;
  onCreateServer?: (newServer: ServerGuild) => Promise<void> | void;
  onServerCreated?: (newServer: ServerGuild) => Promise<void> | void;
}

const EMOJI_PRESETS = ["🦷", "🎮", "🚀", "⚡", "🔥", "🛡️", "👑", "🎧", "💻", "💎", "🌟", "👾"];

export const CreateServerModal: React.FC<CreateServerModalProps> = ({
  isOpen = true,
  currentUser,
  onClose,
  onCreateServer,
  onServerCreated,
}) => {
  if (isOpen === false) return null;

  const [serverName, setServerName] = useState(`${currentUser.displayName}'s Server`);
  const [selectedEmoji, setSelectedEmoji] = useState("🦷");
  const [description, setDescription] = useState("Nowy serwer społeczności ToothChat");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const serverId = `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const generalTextChannelId = `chn_text_${Date.now()}`;
      const generalVoiceChannelId = `chn_voice_${Date.now()}`;

      const newServer: ServerGuild = {
        id: serverId,
        name: serverName.trim(),
        icon: selectedEmoji,
        description: description.trim(),
        ownerId: currentUser.id,
        memberIds: [currentUser.id, "usr_alice", "usr_bob", "usr_carol", "usr_dave"],
        roles: {
          [currentUser.id]: "admin",
          usr_alice: "admin",
          usr_bob: "support",
          usr_carol: "member",
          usr_dave: "member",
        },
        channels: [
          {
            id: generalTextChannelId,
            serverId: serverId,
            name: "ogólny",
            type: "text",
            topic: `Główny kanał serwera ${serverName.trim()}`,
            isEncrypted: true,
            ratchetVersion: 1,
          },
          {
            id: generalVoiceChannelId,
            serverId: serverId,
            name: "🔊 Główny Głosowy",
            type: "voice",
            topic: "WebRTC Voice & Video",
            isEncrypted: true,
            ratchetVersion: 1,
          },
        ],
        createdAt: Date.now(),
      };

      if (onServerCreated) {
        await onServerCreated(newServer);
      } else if (onCreateServer) {
        await onCreateServer(newServer);
      }
      onClose();
    } catch (err) {
      console.error("Błąd tworzenia serwera:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#313338] border border-[#202225] rounded-[8px] shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col"
      >
        {/* Header */}
        <div className="text-center px-6 pt-6 pb-2 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#949ba4] hover:text-white transition-colors p-1 rounded hover:bg-[#35373c] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
            Utwórz swój serwer
          </h2>
          <p className="text-xs text-[#949ba4]">
            Twój serwer to miejsce, w którym możesz rozmawiać ze znajomymi na dedykowanych kanałach tekstowych i głosowych.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Icon / Emoji Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4] mb-2">
              Ikona serwera
            </label>
            <div className="flex items-center gap-2 flex-wrap bg-[#2b2d31] p-3 rounded-[6px] border border-[#202225]">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-10 h-10 rounded-[8px] flex items-center justify-center text-xl transition-all cursor-pointer ${
                    selectedEmoji === emoji
                      ? "bg-[#5865F2] text-white scale-110 shadow"
                      : "bg-[#1e1f22] hover:bg-[#35373c] text-white"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Server Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              Nazwa serwera
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="np. Tooth Guild, Moja Ekipa"
              required
              autoFocus
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-[4px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
            />
          </div>

          {/* Server Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              Opis / Temat serwera
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Miejsce na pogaduchy i granie"
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-[4px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
            />
          </div>

          {/* Default Channels Info */}
          <div className="bg-[#2b2d31] p-3 rounded-[6px] border border-[#202225] text-xs space-y-1">
            <p className="text-[#dbdee1] font-semibold flex items-center gap-1.5">
              <ToothShieldIcon className="w-4 h-4 text-[#23a55a]" />
              Automatycznie tworzone kanały E2EE:
            </p>
            <div className="flex items-center gap-3 text-[#949ba4] pl-5 pt-1">
              <span className="flex items-center gap-1">
                <span className="text-[#80848e]">#</span> ogólny
              </span>
              <span className="flex items-center gap-1">
                <span className="text-[#23a55a]">🔊</span> Główny Głosowy
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-white hover:underline cursor-pointer"
            >
              Wstecz
            </button>
            <button
              type="submit"
              disabled={!serverName.trim() || isCreating}
              className="px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-sm font-medium rounded-[4px] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? "Tworzenie..." : "Utwórz serwer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
