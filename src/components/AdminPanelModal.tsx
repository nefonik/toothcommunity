import React, { useState, useEffect } from "react";
import {
  ToothLogoIcon,
  ToothShieldIcon,
  ToothCrownIcon,
  ToothHashIcon,
  ToothSpeakerIcon,
} from "./ToothIcons";
import {
  Shield,
  Trash2,
  Users,
  Server,
  MessageSquare,
  Key,
  Award,
  Search,
  X,
  Plus,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { UserIdentity, ServerGuild, EncryptedMessagePayload, ServerChannel } from "../types";
import { firestoreService } from "../services/firestoreEngine";
import { AvatarWithDecoration } from "./AvatarWithDecoration";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserIdentity;
  servers: ServerGuild[];
  allUsers: UserIdentity[];
  onRefreshServers: () => void;
  onRefreshUsers: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  servers,
  allUsers,
  onRefreshServers,
  onRefreshUsers,
}) => {
  const [activeTab, setActiveTab] = useState<"servers" | "users" | "messages" | "economy">("servers");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<EncryptedMessagePayload[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // User editing modal state
  const [editingUser, setEditingUser] = useState<UserIdentity | null>(null);
  const [editPoints, setEditPoints] = useState(0);
  const [editRole, setEditRole] = useState<"superadmin" | "admin" | "user">("user");

  // Load global messages when messages tab is opened
  useEffect(() => {
    if (isOpen && activeTab === "messages") {
      loadGlobalMessages();
    }
  }, [isOpen, activeTab]);

  const loadGlobalMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const msgs = await firestoreService.getAllMessagesGlobal(150);
      setMessages(msgs);
    } catch (e) {
      console.error("Error loading messages for admin:", e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const showFeedback = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // 1. Delete Server
  const handleDeleteServer = async (serverId: string, serverName: string) => {
    if (serverId === "srv_tooth_hq") {
      if (!confirm(`Czy na pewno chcesz usunąć oficjalny serwer startowy "${serverName}"?`)) return;
    } else {
      if (!confirm(`Czy na pewno chcesz bezpowrotnie usunąć serwer "${serverName}" wraz ze wszystkimi kanałami?`)) return;
    }

    await firestoreService.deleteServerGlobal(serverId);
    onRefreshServers();
    showFeedback(`Serwer "${serverName}" został pomyślnie usunięty.`);
  };

  // 2. Delete Channel
  const handleDeleteChannel = async (serverId: string, channelId: string, channelName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć kanał "#${channelName}"?`)) return;
    await firestoreService.deleteChannel(serverId, channelId);
    onRefreshServers();
    showFeedback(`Kanał "#${channelName}" został usunięty.`);
  };

  // 3. Delete User Account
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id || userId === "usr_cfx_admin" || userName.toLowerCase() === "cfx") {
      alert("Nie możesz usunąć konta głównego administratora!");
      return;
    }
    if (!confirm(`Czy na pewno chcesz trwale usunąć konto użytkownika "${userName}" (${userId})? Zostanie ono wyrzucone ze wszystkich serwerów i bazy danych.`)) return;

    try {
      await firestoreService.deleteUserAccountGlobal(userId);
      onRefreshUsers();
      onRefreshServers();
      showFeedback(`Konto użytkownika "${userName}" zostało bezpowrotnie usunięte.`);
    } catch (err) {
      console.error("Błąd usuwania konta:", err);
      showFeedback("Wystąpił błąd podczas usuwania konta.");
    }
  };

  // 3b. Permanent Global Ban
  const handleBanUser = async (userId: string, userName: string, email?: string) => {
    if (userId === currentUser.id || userId === "usr_cfx_admin" || userName.toLowerCase() === "cfx") {
      alert("Nie możesz zbanować głównego administratora!");
      return;
    }
    if (
      !confirm(
        `🛑 CZY NA PEWNO chcesz trwale ZBANOWAĆ użytkownika "${userName}" (${userId})?\n\n- Nigdy więcej nikt o tej nazwie (${userName}) ani tym mailu nie zaloguje się ani nie zarejestruje w ToothChat.\n- Konto zostanie natychmiast skasowane z bazy i wszystkich serwerów.`
      )
    ) {
      return;
    }

    try {
      await firestoreService.banUserGlobal(
        userId,
        userName,
        currentUser.displayName,
        "Permanentny ban nałożony z panelu administratora",
        email
      );
      onRefreshUsers();
      onRefreshServers();
      showFeedback(`Użytkownik "${userName}" został trwale zbanowany.`);
    } catch (err) {
      console.error("Błąd banowania:", err);
      showFeedback("Wystąpił błąd podczas banowania użytkownika.");
    }
  };

  // 4. Save User Points / Role Edit
  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    await firestoreService.adminUpdateUser(editingUser.id, {
      points: editPoints,
      role: editRole,
    });
    onRefreshUsers();
    setEditingUser(null);
    showFeedback(`Zaktualizowano dane dla "${editingUser.displayName}".`);
  };

  // 5. Delete Message Globally
  const handleDeleteMessage = async (msgId: string, channelId: string) => {
    await firestoreService.deleteMessageGlobal(msgId, channelId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    showFeedback("Wiadomość została usunięta globalnie.");
  };

  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in select-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[90vh] bg-[#313338] border border-[#232428] rounded-[10px] shadow-2xl overflow-hidden flex flex-col text-[#dbdee1]"
      >
        {/* Header Bar */}
        <div className="h-16 bg-[#2b2d31] border-b border-[#202225] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-gradient-to-tr from-amber-600 via-[#5865F2] to-purple-600 flex items-center justify-center shadow-lg">
              <ToothCrownIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-lg tracking-tight">
                  Panel Głównego Administratora
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Superadmin @{currentUser.displayName}
                </span>
              </div>
              <p className="text-xs text-[#949ba4]">
                Globalne zarządzanie wszystkimi serwerami, kanałami, kontami i wiadomościami ToothChat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1e1f22] hover:bg-[#35373c] text-[#949ba4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-[#23a55a] text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Navigation Sub-Header Tabs */}
        <div className="h-12 bg-[#232428] px-6 flex items-center justify-between border-b border-[#1e1f22] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("servers")}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "servers"
                  ? "bg-[#5865F2] text-white shadow"
                  : "text-[#949ba4] hover:text-white hover:bg-[#35373c]"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Wszystkie Serwery ({servers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "users"
                  ? "bg-[#5865F2] text-white shadow"
                  : "text-[#949ba4] hover:text-white hover:bg-[#35373c]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Konta Użytkowników ({allUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("messages")}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "messages"
                  ? "bg-[#5865F2] text-white shadow"
                  : "text-[#949ba4] hover:text-white hover:bg-[#35373c]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Globalne Wiadomości</span>
            </button>

            <button
              onClick={() => setActiveTab("economy")}
              className={`px-3.5 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "economy"
                  ? "bg-[#5865F2] text-white shadow"
                  : "text-[#949ba4] hover:text-white hover:bg-[#35373c]"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Ekonomia & Kody VIP</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== "economy" && (
            <div className="relative w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj po nazwie / ID..."
                className="w-full bg-[#1e1f22] text-white text-xs px-3 py-1.5 pl-8 rounded-[4px] border border-transparent focus:border-[#5865F2] focus:outline-none placeholder:text-[#80848e]"
              />
              <Search className="w-3.5 h-3.5 text-[#80848e] absolute left-2.5 top-2" />
            </div>
          )}
        </div>

        {/* Tab 1: SERVERS & CHANNELS */}
        {activeTab === "servers" && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Lista Serwerów w Bazie ({filteredServers.length})
              </h3>
              <p className="text-xs text-[#949ba4]">
                Widzisz wszystkie serwery stworzone przez dowolnego użytkownika
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredServers.map((server) => (
                <div
                  key={server.id}
                  className="bg-[#2b2d31] border border-[#232428] rounded-[8px] p-4 shadow-md space-y-3"
                >
                  {/* Server Row Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-[8px] bg-[#1e1f22] flex items-center justify-center text-2xl border border-[#35373c]">
                        {server.icon || "🦷"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">{server.name}</h4>
                          <span className="text-[10px] font-mono bg-[#1e1f22] text-[#949ba4] px-1.5 py-0.5 rounded border border-[#35373c]">
                            {server.id}
                          </span>
                        </div>
                        <p className="text-xs text-[#949ba4] mt-0.5">
                          Właściciel:{" "}
                          <span className="text-white font-medium">
                            {allUsers.find((u) => u.id === server.ownerId)?.displayName || server.ownerId}
                          </span>{" "}
                          • Członków: {server.memberIds?.length || 1} • Utworzono:{" "}
                          {new Date(server.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteServer(server.id, server.name)}
                      className="px-3 py-1.5 bg-[#da373c]/10 hover:bg-[#da373c] text-[#da373c] hover:text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 border border-[#da373c]/30 transition-all cursor-pointer"
                      title="Usuń cały serwer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Usuń Serwer</span>
                    </button>
                  </div>

                  {/* Channels List in Server */}
                  <div className="bg-[#1e1f22] rounded-[6px] p-3 border border-[#232428]">
                    <div className="text-[11px] font-bold text-[#80848e] uppercase tracking-wider mb-2">
                      Kanały serwera ({server.channels?.length || 0})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {server.channels?.map((chan) => (
                        <div
                          key={chan.id}
                          className="bg-[#2b2d31] px-3 py-2 rounded-[4px] flex items-center justify-between border border-[#35373c] group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {chan.type === "voice" ? (
                              <ToothSpeakerIcon className="w-4 h-4 text-[#23a55a] shrink-0" />
                            ) : (
                              <ToothHashIcon className="w-4 h-4 text-[#80848e] shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-white truncate">
                              {chan.name}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteChannel(server.id, chan.id, chan.name)}
                            className="text-[#949ba4] hover:text-[#da373c] opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                            title="Usuń kanał"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {(!server.channels || server.channels.length === 0) && (
                        <p className="text-xs text-[#80848e] col-span-3">Brak kanałów na serwerze.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredServers.length === 0 && (
                <div className="text-center py-12 text-[#949ba4]">
                  Nie znaleziono serwerów pasujących do wyszukiwania.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: USERS MANAGEMENT */}
        {activeTab === "users" && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Konta Użytkowników ({filteredUsers.length})
              </h3>
              <p className="text-xs text-[#949ba4]">
                Zarządzaj uprawnieniami, punktami i usuwaj konta
              </p>
            </div>

            <div className="bg-[#2b2d31] rounded-[8px] border border-[#232428] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e1f22] text-[#949ba4] uppercase font-bold text-[10px] border-b border-[#232428]">
                  <tr>
                    <th className="py-3 px-4">Użytkownik</th>
                    <th className="py-3 px-4">Rola Globalna</th>
                    <th className="py-3 px-4">ToothPoints 🦷</th>
                    <th className="py-3 px-4">Wysłanych Wiadomości</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Akcje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232428]">
                  {filteredUsers.map((u) => {
                    const isCfx = u.displayName === "cfx" || u.id === "usr_cfx_admin";
                    return (
                      <tr key={u.id} className="hover:bg-[#35373c]/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <AvatarWithDecoration
                              user={u}
                              avatarUrl={u.avatarUrl}
                              displayName={u.displayName}
                              avatarColor={u.avatarColor}
                              decorationId={u.avatarDecoration}
                              status={u.status || "online"}
                              size="sm"
                              showStatus={true}
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{u.displayName}</span>
                                {isCfx && (
                                  <ToothCrownIcon className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </div>
                              <div className="text-[10px] text-[#949ba4] font-mono">
                                {u.email || u.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isCfx || u.role === "superadmin" ? (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold text-[10px]">
                              Superadmin
                            </span>
                          ) : u.role === "admin" ? (
                            <span className="px-2 py-0.5 bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/40 rounded-full font-bold text-[10px]">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#35373c] text-[#dbdee1] rounded-full text-[10px]">
                              Użytkownik
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          {(u.points || 150).toLocaleString()} 🦷
                        </td>

                        <td className="py-3 px-4 font-mono text-[#dbdee1]">
                          {u.totalMessagesSent || 0}
                        </td>

                        <td className="py-3 px-4 text-[#949ba4]">
                          {u.customStatus || (u.status === "offline" ? "Niewidoczny" : "Aktywny")}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditPoints(u.points || 150);
                                setEditRole(u.role || "user");
                              }}
                              className="px-2.5 py-1 bg-[#35373c] hover:bg-[#5865F2] text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Edytuj punkty i rolę"
                            >
                              Edytuj
                            </button>

                            {!isCfx && (
                              <>
                                <button
                                  onClick={() => handleBanUser(u.id, u.displayName, u.email)}
                                  className="p-1 text-white bg-[#da373c] hover:bg-[#c22e34] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5"
                                  title="Trwały Ban"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Ban
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.displayName)}
                                  className="p-1 text-[#da373c] hover:bg-[#da373c]/20 rounded transition-colors cursor-pointer"
                                  title="Usuń konto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: GLOBAL MESSAGES MODERATION */}
        {activeTab === "messages" && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Ostatnie Wiadomości w Systemie ({messages.length})
                </h3>
                <p className="text-xs text-[#949ba4]">
                  Globalny strumień wiadomości ze wszystkich serwerów z opcją natychmiastowego usunięcia
                </p>
              </div>

              <button
                onClick={loadGlobalMessages}
                disabled={isLoadingMessages}
                className="px-3 py-1.5 bg-[#1e1f22] hover:bg-[#35373c] text-white text-xs rounded-[4px] flex items-center gap-1.5 border border-[#35373c] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMessages ? "animate-spin" : ""}`} />
                <span>Odśwież</span>
              </button>
            </div>

            <div className="space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-[#2b2d31] border border-[#232428] rounded-[6px] p-3 flex items-center justify-between gap-4 hover:border-[#35373c] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-xs">{msg.senderName}</span>
                      <span className="text-[10px] font-mono text-[#80848e]">
                        Kanał: {msg.channelId}
                      </span>
                      <span className="text-[10px] text-[#949ba4]">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#dbdee1] break-words whitespace-pre-wrap">
                      {msg.decryptedText || msg.text || msg.ciphertext}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteMessage(msg.id, msg.channelId)}
                    className="p-2 text-[#da373c] hover:bg-[#da373c]/20 rounded transition-colors cursor-pointer shrink-0"
                    title="Usuń wiadomość z serwera"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {messages.length === 0 && !isLoadingMessages && (
                <div className="text-center py-12 text-[#949ba4]">
                  Brak wiadomości w historii.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: ECONOMY & VIP CODES */}
        {activeTab === "economy" && (
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Zasady Ekonomii ToothPoints & Kody VIP
              </h3>
              <p className="text-xs text-[#949ba4]">
                Mechanika punktów i tajne kody zarezerwowane dla Administratora
              </p>
            </div>

            {/* Secret VIP Codes Box */}
            <div className="bg-gradient-to-br from-[#2b2d31] to-[#1e1f22] border border-amber-500/30 rounded-[8px] p-5 space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <ToothCrownIcon className="w-5 h-5" />
                <span>Twoje Sekretne Kody VIP (Dla konta cfx):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-[#1e1f22] p-3 rounded border border-amber-500/20">
                  <span className="text-[10px] text-[#949ba4] uppercase font-bold block">Kod Superadmina</span>
                  <code className="text-sm font-mono font-black text-amber-300">CFX-ROOT-TOOTH</code>
                  <div className="text-xs text-[#23a55a] font-semibold mt-1">+500,000 ToothPoints</div>
                </div>

                <div className="bg-[#1e1f22] p-3 rounded border border-amber-500/20">
                  <span className="text-[10px] text-[#949ba4] uppercase font-bold block">Kod Master</span>
                  <code className="text-sm font-mono font-black text-amber-300">TOOTH-CFX-MASTER</code>
                  <div className="text-xs text-[#23a55a] font-semibold mt-1">+1,000,000 ToothPoints</div>
                </div>

                <div className="bg-[#1e1f22] p-3 rounded border border-amber-500/20">
                  <span className="text-[10px] text-[#949ba4] uppercase font-bold block">Sekretny Ząbek</span>
                  <code className="text-sm font-mono font-black text-amber-300">SEKRETNYZABEK</code>
                  <div className="text-xs text-[#23a55a] font-semibold mt-1">+50,000 ToothPoints</div>
                </div>
              </div>

              <p className="text-xs text-[#949ba4]">
                Kody można zrealizować w oknie profilu (kliknięcie w avatar w lewym dolnym rogu).
              </p>
            </div>

            {/* Regular User Points Mechanics */}
            <div className="bg-[#2b2d31] border border-[#232428] rounded-[8px] p-5 space-y-3">
              <h4 className="text-sm font-bold text-white">
                Mechanika Zdobywania Punktów dla Pozostałych Użytkowników
              </h4>
              <ul className="space-y-2 text-xs text-[#dbdee1]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
                  <span>
                    <strong className="text-white">+10 ToothPoints</strong> za każdą wysłaną wiadomość na dowolnym kanale.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>
                    <strong className="text-amber-300 font-bold">+1,000 ToothPoints Bonusu</strong> za każde 100 wysłanych wiadomości (kamienie milowe: 100, 200, 300 wiadomości...)!
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5865F2]" />
                  <span>
                    Zwykłe kody zostały wyłączone dla pozostałych użytkowników zgodnie z wytycznymi.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* User Edit Sub-Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
            <div className="bg-[#313338] border border-[#232428] rounded-[8px] p-6 max-w-sm w-full space-y-4 shadow-2xl">
              <h4 className="text-base font-bold text-white">
                Edycja użytkownika: {editingUser.displayName}
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#949ba4] uppercase">ToothPoints</label>
                <input
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(Number(e.target.value))}
                  className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-sm border border-[#35373c] focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#949ba4] uppercase">Rola Globalna</label>
                <select
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                  className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-sm border border-[#35373c] focus:outline-none focus:border-[#5865F2]"
                >
                  <option value="user">Użytkownik</option>
                  <option value="admin">Administrator</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-xs text-[#949ba4] hover:text-white cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleSaveUserEdit}
                  className="px-4 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded cursor-pointer"
                >
                  Zapisz Zmiany
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
