import React, { useState } from "react";
import { ToothHashIcon, ToothSpeakerIcon, ToothShieldIcon } from "./ToothIcons";
import { X, Plus } from "lucide-react";
import { ServerChannel, ServerGuild } from "../types";

interface CreateChannelModalProps {
  isOpen?: boolean;
  server?: ServerGuild;
  serverId?: string;
  serverName?: string;
  defaultType?: "text" | "voice";
  initialType?: "text" | "voice";
  onClose: () => void;
  onCreateChannel?: (channel: ServerChannel) => Promise<void> | void;
  onChannelCreated?: (channel: ServerChannel) => Promise<void> | void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen = true,
  server,
  serverId,
  serverName,
  defaultType = "text",
  initialType,
  onClose,
  onCreateChannel,
  onChannelCreated,
}) => {
  const actualServerId = server?.id || serverId || "srv_tooth_hq";
  const actualServerName = server?.name || serverName || "ToothChat HQ";
  const startingType = initialType || defaultType || "text";

  const [channelName, setChannelName] = useState("");
  const [topic, setTopic] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const cleanName = channelName.trim().toLowerCase().replace(/\s+/g, "-");

      const newChannel: ServerChannel = {
        id: `chn_text_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        serverId: actualServerId,
        name: cleanName,
        type: "text",
        topic: topic.trim() || `Kanał tekstowy #${cleanName}`,
        isEncrypted: true,
        ratchetVersion: 1,
      };

      if (onChannelCreated) {
        await onChannelCreated(newChannel);
      } else if (onCreateChannel) {
        await onCreateChannel(newChannel);
      }

      onClose();
    } catch (err) {
      console.error("Błąd tworzenia kanału:", err);
    } finally {
      setIsCreating(false);
    }
  };

  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#313338] border border-[#202225] rounded-[8px] shadow-2xl overflow-hidden text-[#dbdee1] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202225] bg-[#2b2d31]">
          <div>
            <h3 className="font-bold text-white text-lg tracking-tight">
              Utwórz kanał tekstowy
            </h3>
            <p className="text-xs text-[#949ba4]">
              w serwerze {actualServerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white transition-colors p-1 rounded hover:bg-[#35373c] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Channel Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              Nazwa kanału
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[#949ba4]">
                #
              </span>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="nowy-kanal"
                required
                autoFocus
                className="w-full bg-[#1e1f22] text-white pl-8 pr-3 py-2 rounded-[4px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
              />
            </div>
          </div>

          {/* Channel Topic */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#949ba4]">
              Temat kanału (opcjonalnie)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Krótki opis przeznaczenia kanału"
              className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded-[4px] border border-[#202225] focus:border-[#5865F2] focus:outline-none text-sm placeholder:text-[#80848e]"
            />
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-xs text-[#23a55a] bg-[#23a55a]/10 p-2.5 rounded-[4px] border border-[#23a55a]/20">
            <ToothShieldIcon className="w-4 h-4 shrink-0" />
            <span>Kanał zostanie zabezpieczony szyfrowaniem E2EE</span>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white hover:underline cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={!channelName.trim() || isCreating}
              className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-sm font-medium rounded-[4px] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? "Tworzenie..." : "Utwórz kanał"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
