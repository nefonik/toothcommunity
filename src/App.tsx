/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";
import {
  generateStatelessToken,
  computeTokenHash,
  generateEcdhKeyPair,
  exportPublicKeySpki,
  deriveDeterministicChannelKey,
  encryptMessagePayload,
  decryptMessagePayload,
} from "./crypto/e2ee";
import { firestoreService } from "./services/firestoreEngine";
import { webrtcService } from "./services/webrtcManager";
import {
  UserIdentity,
  ServerGuild,
  ServerChannel,
  EncryptedMessagePayload,
  CallSession,
  ServerRole,
} from "./types";

// Components
import { AuthScreen, SimpleAuthUser } from "./components/AuthScreen";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { ChannelSidebar } from "./components/ChannelSidebar";
import { ChatArea } from "./components/ChatArea";
import { MemberListSidebar } from "./components/MemberListSidebar";
import { VoiceRoomMeshView } from "./components/VoiceRoomMeshView";
import { DirectCallModal } from "./components/DirectCallModal";
import { FriendsManagerModal } from "./components/FriendsManagerModal";
import { AvatarUploadModal } from "./components/AvatarUploadModal";
import { CreateServerModal } from "./components/CreateServerModal";
import { CreateChannelModal } from "./components/CreateChannelModal";
import { MemberProfileModal } from "./components/MemberProfileModal";
import { DirectMessagesHomeView } from "./components/DirectMessagesHomeView";
import { InviteServerModal } from "./components/InviteServerModal";
import { AdminPanelModal } from "./components/AdminPanelModal";
import { ToothLogoIcon } from "./components/ToothIcons";
import { AvatarWithDecoration } from "./components/AvatarWithDecoration";
import { MessageSquare, Users, Bell, User, Hash, Sparkles } from "lucide-react";

export default function App() {
  // Authentication State
  const [firebaseUser, setFirebaseUser] = useState<SimpleAuthUser | FirebaseUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "server" | "dms" | "friends" | "crypto" | "voice"
  >("server");

  // User & Crypto Keys State
  const [currentUser, setCurrentUser] = useState<UserIdentity | null>(null);
  const [allUsers, setAllUsers] = useState<UserIdentity[]>([]);
  const [channelSharedAesKey, setChannelSharedAesKey] = useState<CryptoKey | null>(null);

  // Server & Channel State
  const [servers, setServers] = useState<ServerGuild[]>([]);
  const [activeServer, setActiveServer] = useState<ServerGuild | null>(null);
  const [activeChannel, setActiveChannel] = useState<ServerChannel | null>(null);
  const [messages, setMessages] = useState<EncryptedMessagePayload[]>([]);
  const [showMemberList, setShowMemberList] = useState(true);

  // Direct Messages & Friends State
  const [activeDmUser, setActiveDmUser] = useState<UserIdentity | null>(null);
  const [recentDmSenders, setRecentDmSenders] = useState<UserIdentity[]>([]);

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // WebRTC Call & Voice Room State
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeVoiceRoom, setActiveVoiceRoom] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [createChannelType, setCreateChannelType] = useState<"text" | "voice">("text");
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<UserIdentity | null>(null);

  // 1. Listen for Firebase Auth changes or Local Storage Session
  useEffect(() => {
    // Check local storage session first
    try {
      const saved = localStorage.getItem("toothchat_active_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid) {
          setFirebaseUser(parsed);
          initUserSession(parsed);
          setAuthInitialized(true);
        }
      }
    } catch {}

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        await initUserSession(user);
      } else {
        const saved = localStorage.getItem("toothchat_active_session");
        if (!saved) {
          setCurrentUser(null);
          setFirebaseUser(null);
        }
      }
      setAuthInitialized(true);
    });

    return () => unsubAuth();
  }, []);

  // 2. Initialize User Identity from Firebase User or Fallback Session
  const initUserSession = async (user: SimpleAuthUser | FirebaseUser) => {
    let token = localStorage.getItem(`toothchat_token_${user.uid}`);
    if (!token) {
      token = generateStatelessToken();
      localStorage.setItem(`toothchat_token_${user.uid}`, token);
    }

    const tokenHash = await computeTokenHash(token);
    const ecdhPair = await generateEcdhKeyPair();
    const pubKeySpki = await exportPublicKeySpki(ecdhPair.publicKey);

    const displayName = user.displayName || user.email?.split("@")[0] || `ToothUser#${tokenHash.slice(0, 4)}`;

    const identity: UserIdentity = {
      id: user.uid,
      displayName,
      email: user.email || "",
      emailVerified: !!user.emailVerified,
      tokenHash,
      publicKeySpki: pubKeySpki,
      avatarColor: "#5865f2",
      status: "online",
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };

    const registeredUser = await firestoreService.registerUser(identity);
    setCurrentUser(registeredUser);

    // Save active session for instant restore
    localStorage.setItem(
      "toothchat_active_session",
      JSON.stringify({
        uid: user.uid,
        email: user.email || "",
        displayName: registeredUser.displayName || displayName,
        emailVerified: !!user.emailVerified,
      })
    );

    // Load server and channel configuration
    const loadedServers = firestoreService.getServers(user.uid, registeredUser.displayName || displayName);
    setServers(loadedServers);
    if (loadedServers.length > 0) {
      const srv = loadedServers[0];
      setActiveServer(srv);
      const initialChannel = srv.channels.find((c) => c.type === "text") || srv.channels[0];
      if (initialChannel) {
        setActiveChannel(initialChannel);
        const derivedKey = await deriveDeterministicChannelKey(initialChannel.id);
        setChannelSharedAesKey(derivedKey);
      }
    }

    // Load initial members
    const usersList = await firestoreService.getAllUsers();
    setAllUsers(usersList);
  };

  // Real-Time Users Persistence & Profile Updates Listener (Avatar, Decorations, Status, Points)
  useEffect(() => {
    const unsubUsers = firestoreService.subscribeUsers((usersList) => {
      setAllUsers(usersList);
      if (currentUser?.id) {
        const me = usersList.find((u) => u.id === currentUser.id);
        if (me) {
          setCurrentUser((prev) => (prev ? { ...prev, ...me } : me));
        }
      }
    });
    return () => unsubUsers();
  }, [currentUser?.id]);

  // Real-Time Permanent Ban Listener: instantly kick and log out banned users/emails
  useEffect(() => {
    if (!currentUser) return;
    const unsubBans = firestoreService.subscribeBannedUsers((bannedList) => {
      const myId = currentUser.id;
      const myNick = (currentUser.displayName || "").toLowerCase().trim();
      const myEmail = (currentUser.email || (firebaseUser as any)?.email || "").toLowerCase().trim();

      const isBanned = bannedList.some((b) => {
        if (b.userId && b.userId === myId) return true;
        if (myNick && b.username && b.username.toLowerCase().trim() === myNick) return true;
        if (myEmail && b.email && b.email.toLowerCase().trim() === myEmail) return true;
        return false;
      });

      if (isBanned) {
        alert("🛑 Twoje konto/adres e-mail zostało zbanowane przez administratora. Zostałeś wylogowany.");
        handleSignOut();
      }
    });
    return () => unsubBans();
  }, [currentUser?.id, currentUser?.displayName, currentUser?.email, (firebaseUser as any)?.email]);

  // Real-Time Server Persistence Listener
  useEffect(() => {
    if (!currentUser) return;
    const unsubServers = firestoreService.subscribeServers(
      currentUser.id,
      (loaded) => {
        setServers(loaded);
        if (activeServer) {
          const stillExists = loaded.find((s) => s.id === activeServer.id);
          if (stillExists) {
            setActiveServer(stillExists);
          } else if (loaded.length > 0) {
            setActiveServer(loaded[0]);
          } else {
            setActiveServer(null);
          }
        }
      },
      currentUser.displayName
    );
    return () => unsubServers();
  }, [currentUser?.id, currentUser?.displayName, activeServer?.id]);

  // Real-Time Incoming DMs Notifications Listener (for displaying sender avatar under ghost icon)
  useEffect(() => {
    if (!currentUser) return;
    const unsubDms = firestoreService.subscribeIncomingDirectMessages(currentUser.id, (senderIds) => {
      // If currently looking at this DM, filter it out
      const unreadIds = senderIds.filter((id) => !(activeTab === "dms" && activeDmUser?.id === id));
      const senders = allUsers.filter((u) => unreadIds.includes(u.id));
      setRecentDmSenders(senders);
    });
    return () => unsubDms();
  }, [currentUser?.id, allUsers, activeTab, activeDmUser?.id]);

  // Handler to explicitly dismiss / mark as read DM notifications
  const handleDismissDmSender = (senderId: string) => {
    if (currentUser) {
      firestoreService.markDirectMessagesAsRead(currentUser.id, senderId);
    }
    setRecentDmSenders((prev) => prev.filter((s) => s.id !== senderId));
  };

  const handleSelectDmUser = (sender: UserIdentity | null) => {
    setActiveDmUser(sender);
    setActiveTab("dms");
    if (currentUser && sender) {
      firestoreService.markDirectMessagesAsRead(currentUser.id, sender.id);
      setRecentDmSenders((prev) => prev.filter((s) => s.id !== sender.id));
    }
    setIsMobileMenuOpen(false);
  };

  // Mark active DM as read automatically
  useEffect(() => {
    if (activeTab === "dms" && activeDmUser && currentUser) {
      firestoreService.markDirectMessagesAsRead(currentUser.id, activeDmUser.id);
      setRecentDmSenders((prev) => prev.filter((s) => s.id !== activeDmUser.id));
    }
  }, [activeTab, activeDmUser?.id, currentUser?.id]);

  // 3. Update Channel Key when active channel changes
  const handleSelectChannel = async (channel: ServerChannel) => {
    if (channel.type === "voice") {
      setActiveVoiceRoom(channel.id);
      setActiveTab("voice");
    } else {
      setActiveChannel(channel);
      setActiveTab("server");
      const derivedKey = await deriveDeterministicChannelKey(channel.id);
      setChannelSharedAesKey(derivedKey);
    }
  };

  // 4. Subscribe to Incoming WebRTC 1-on-1 Calls
  useEffect(() => {
    if (!currentUser) return;
    const unsub = firestoreService.subscribeIncomingCalls(currentUser.id, (call) => {
      if (call && call.status === "calling" && call.receiverId === currentUser.id) {
        setIncomingCall(call);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // 5. Real-Time Firestore Messages Listener with Local Decryption
  useEffect(() => {
    if (!activeChannel) return;

    const unsubscribe = firestoreService.subscribeChannelMessages(
      activeChannel.id,
      async (encryptedList) => {
        const decryptedList: EncryptedMessagePayload[] = [];
        for (const msg of encryptedList) {
          // If text is present, use it directly; otherwise decrypt with channelSharedAesKey
          if (msg.text) {
            decryptedList.push({ ...msg, decryptedText: msg.text });
          } else if (channelSharedAesKey && msg.ciphertext && msg.iv) {
            try {
              const plain = await decryptMessagePayload(msg.ciphertext, msg.iv, channelSharedAesKey);
              decryptedList.push({ ...msg, decryptedText: plain });
            } catch (err) {
              decryptedList.push({ ...msg, decryptedText: msg.ciphertext });
            }
          } else {
            decryptedList.push({ ...msg, decryptedText: msg.ciphertext || "" });
          }
        }
        setMessages(decryptedList);
      }
    );

    return () => unsubscribe();
  }, [activeChannel, channelSharedAesKey]);

  // Strictly compute members of the active server (or all users if on main HQ server or no server is active)
  const memberListToDisplay = React.useMemo(() => {
    const isCfx = (u?: UserIdentity | null) =>
      u?.id === "usr_cfx_admin" ||
      u?.displayName?.toLowerCase() === "cfx" ||
      u?.email === "antekzagora@gmail.com" ||
      u?.email === "cfx@gmail.com" ||
      u?.role === "superadmin";

    if (!activeServer || activeServer.id === "srv_tooth_hq") {
      const list = allUsers.length > 0 ? [...allUsers] : (currentUser ? [currentUser] : []);
      list.sort((a, b) => (isCfx(a) ? -1 : isCfx(b) ? 1 : 0));
      return list;
    }

    const memberIds = activeServer.memberIds || [activeServer.ownerId];
    const memberSet = new Set(memberIds);
    if (activeServer.ownerId) memberSet.add(activeServer.ownerId);

    const filtered = allUsers.filter((u) => memberSet.has(u.id) || isCfx(u));
    if (currentUser && (memberSet.has(currentUser.id) || activeServer.ownerId === currentUser.id || isCfx(currentUser))) {
      if (!filtered.some((u) => u.id === currentUser.id)) {
        filtered.unshift(currentUser);
      }
    }
    filtered.sort((a, b) => (isCfx(a) ? -1 : isCfx(b) ? 1 : 0));
    return filtered.length > 0 ? filtered : (currentUser ? [currentUser] : []);
  }, [allUsers, activeServer, currentUser]);

  // 6. Send Message Handler (Supports text and photo/image attachment)
  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!currentUser || !activeChannel) return;

    let cipher = "";
    let ivStr = "";
    let fingerprint = "TOOTH-E2EE";

    if (channelSharedAesKey && text) {
      try {
        const enc = await encryptMessagePayload(text, channelSharedAesKey);
        cipher = enc.ciphertext;
        ivStr = enc.iv;
        fingerprint = enc.keyFingerprint;
      } catch (e) {
        console.warn("Encryption fallback:", e);
      }
    }

    const payload: EncryptedMessagePayload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channelId: activeChannel.id,
      serverId: activeChannel.serverId,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderPublicKey: currentUser.publicKeySpki,
      senderAvatarUrl: currentUser.avatarUrl || "",
      senderAvatarDecoration: currentUser.avatarDecoration || "",
      senderAvatarColor: currentUser.avatarColor || "#5865F2",
      ciphertext: cipher,
      iv: ivStr,
      keyFingerprint: fingerprint,
      text: text,
      decryptedText: text,
      imageUrl: imageUrl || undefined,
      timestamp: Date.now(),
    };

    await firestoreService.sendEncryptedMessage(payload);
    await firestoreService.recordUserMessageSent(currentUser.id);
  };

  // 7. Update Display Name Handler
  const handleUpdateDisplayName = async (newName: string) => {
    if (!currentUser) return;
    await firestoreService.updateDisplayName(currentUser.id, newName);
    const updated = { ...currentUser, displayName: newName };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // 8. Update Avatar, Custom Status, Decoration, Banner & Profile Effect Handler (Persisted to Firestore)
  const handleSaveAvatar = async (
    avatarUrl: string,
    customStatus?: string,
    avatarDecoration?: string,
    bannerUrl?: string,
    bannerColor?: string,
    profileEffect?: string
  ) => {
    if (!currentUser) return;
    await firestoreService.updateAvatarAndStatus(
      currentUser.id,
      avatarUrl,
      customStatus,
      avatarDecoration,
      bannerUrl,
      bannerColor
    );
    if (profileEffect !== undefined) {
      await firestoreService.setProfileEffect(currentUser.id, profileEffect || null);
    }
    const updated: UserIdentity = {
      ...currentUser,
      avatarUrl,
      customStatus: customStatus !== undefined ? customStatus : currentUser.customStatus,
      avatarDecoration:
        avatarDecoration !== undefined ? avatarDecoration : currentUser.avatarDecoration,
      bannerUrl: bannerUrl !== undefined ? bannerUrl : currentUser.bannerUrl,
      bannerColor: bannerColor !== undefined ? bannerColor : currentUser.bannerColor,
      profileEffect: profileEffect !== undefined ? profileEffect : currentUser.profileEffect,
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // 8b. Redeem Promo Code Handler
  const handleRedeemPromoCode = async (code: string) => {
    if (!currentUser) return { success: false, message: "Brak aktywnej sesji." };
    const res = await firestoreService.redeemPromoCode(currentUser.id, code);
    if (res.success && res.newBalance !== undefined) {
      const updated = { ...currentUser, points: res.newBalance };
      setCurrentUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    }
    return res;
  };

  // 8c. Unlock Animated Decoration Handler
  const handleUnlockDecoration = async (decorationId: string, cost: number) => {
    if (!currentUser) return { success: false, message: "Brak aktywnej sesji." };
    const res = await firestoreService.unlockDecoration(currentUser.id, decorationId, cost);
    if (res.success && res.newBalance !== undefined) {
      const unlocked = Array.from(new Set([...(currentUser.unlockedDecorations || []), decorationId]));
      const updated = {
        ...currentUser,
        points: res.newBalance,
        unlockedDecorations: unlocked,
        avatarDecoration: decorationId,
      };
      setCurrentUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    }
    return res;
  };

  // 8d. Equip/Unequip Avatar Decoration Handler
  const handleEquipDecoration = async (decorationId: string | null) => {
    if (!currentUser) return;
    await firestoreService.setAvatarDecoration(currentUser.id, decorationId);
    const updated = { ...currentUser, avatarDecoration: decorationId || "" };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // 8e. Unlock Animated Profile Effect Handler (Ghosts, Birds, Dragons, etc.)
  const handleUnlockProfileEffect = async (effectId: string, cost: number) => {
    if (!currentUser) return { success: false, message: "Brak aktywnej sesji." };
    const res = await firestoreService.unlockProfileEffect(currentUser.id, effectId, cost);
    if (res.success && res.newBalance !== undefined) {
      const unlocked = Array.from(new Set([...(currentUser.unlockedProfileEffects || []), effectId]));
      const updated = {
        ...currentUser,
        points: res.newBalance,
        unlockedProfileEffects: unlocked,
        profileEffect: effectId,
      };
      setCurrentUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    }
    return res;
  };

  // 8f. Equip/Unequip Profile Effect Handler
  const handleEquipProfileEffect = async (effectId: string | null) => {
    if (!currentUser) return;
    await firestoreService.setProfileEffect(currentUser.id, effectId);
    const updated = { ...currentUser, profileEffect: effectId || "" };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  // 9. Create Server Handler (Saves to Firestore and updates state)
  const handleCreateServer = async (newServer: ServerGuild) => {
    await firestoreService.createServer(newServer);
    setServers((prev) => {
      const exists = prev.some((s) => s.id === newServer.id);
      return exists ? prev.map((s) => (s.id === newServer.id ? newServer : s)) : [...prev, newServer];
    });
    setActiveServer(newServer);
    if (newServer.channels.length > 0) {
      const chan = newServer.channels[0];
      setActiveChannel(chan);
      const derivedKey = await deriveDeterministicChannelKey(chan.id);
      setChannelSharedAesKey(derivedKey);
    }
    setActiveTab("server");
    setIsMobileMenuOpen(false);
  };

  // 10. Create Channel Handler
  const handleCreateChannel = async (newChannel: ServerChannel) => {
    if (!activeServer) return;
    const updatedChannels = [...activeServer.channels, newChannel];
    const updatedServer = { ...activeServer, channels: updatedChannels };
    setActiveServer(updatedServer);
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    if (newChannel.type === "text") {
      setActiveChannel(newChannel);
      const derivedKey = await deriveDeterministicChannelKey(newChannel.id);
      setChannelSharedAesKey(derivedKey);
      setActiveTab("server");
    } else {
      setActiveVoiceRoom(newChannel.id);
      setActiveTab("voice");
    }
  };

  // 11. Delete Channel Handler
  const handleDeleteChannel = async (channelId: string) => {
    if (!activeServer) return;
    await firestoreService.deleteChannel(activeServer.id, channelId);
    const remaining = activeServer.channels.filter((c) => c.id !== channelId);
    const updatedServer = { ...activeServer, channels: remaining };
    setActiveServer(updatedServer);
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    if (activeChannel?.id === channelId && remaining.length > 0) {
      setActiveChannel(remaining[0]);
    }
  };

  // 12. Delete Message Handler (Moderation + Author)
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeChannel) return;
    await firestoreService.deleteMessage(activeChannel.id, msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  // 13. Moderation Handlers: Role, Mute, Timeout, Kick
  const handleSetRole = async (userId: string, role: ServerRole) => {
    if (!activeServer) return;
    await firestoreService.setMemberRole(activeServer.id, userId, role);
    const updatedRoles = { ...(activeServer.roles || {}), [userId]: role };
    const updatedServer = { ...activeServer, roles: updatedRoles };
    setActiveServer(updatedServer);
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
  };

  const handleToggleMuteMember = async (userId: string, isMutedMember: boolean) => {
    if (!activeServer) return;
    await firestoreService.muteMember(activeServer.id, userId, isMutedMember);
    const currentMuted = activeServer.mutedUserIds || [];
    const updatedMuted = isMutedMember
      ? Array.from(new Set([...currentMuted, userId]))
      : currentMuted.filter((id) => id !== userId);
    const updatedServer = { ...activeServer, mutedUserIds: updatedMuted };
    setActiveServer(updatedServer);
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
  };

  const handleTimeoutMember = async (userId: string, minutes: number) => {
    if (!activeServer) return;
    await firestoreService.timeoutMember(activeServer.id, userId, minutes);
    const expiry = Date.now() + minutes * 60 * 1000;
    const updatedTimeouts = { ...(activeServer.timeouts || {}), [userId]: expiry };
    const updatedServer = { ...activeServer, timeouts: updatedTimeouts };
    setActiveServer(updatedServer);
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
  };

  const handleKickMember = async (userId: string) => {
    if (!activeServer) return;
    const target = allUsers.find((u) => u.id === userId) || selectedMemberForProfile;
    await firestoreService.kickMember(activeServer.id, userId, target?.displayName);
    const updatedRoles = { ...(activeServer.roles || {}) };
    delete updatedRoles[userId];
    const updatedMemberIds = (activeServer.memberIds || []).filter((id) => id !== userId);
    const updatedServer = { ...activeServer, memberIds: updatedMemberIds, roles: updatedRoles };
    setActiveServer(updatedServer);
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    setSelectedMemberForProfile(null);
  };

  // 13b. Global Permanent Ban Handler
  const handleBanUser = async (userId: string, userName: string, reason?: string, email?: string) => {
    try {
      await firestoreService.banUserGlobal(
        userId,
        userName,
        currentUser?.displayName || "admin",
        reason || "Permanentny ban nałożony przez administratora",
        email
      );

      // Instantly purge user from state
      setAllUsers((prev) => prev.filter((u) => u.id !== userId && u.displayName?.toLowerCase() !== userName.toLowerCase()));
      setServers((prev) =>
        prev.map((s) => ({
          ...s,
          memberIds: (s.memberIds || []).filter((id) => id !== userId),
        }))
      );
      if (activeServer) {
        setActiveServer((prev) =>
          prev
            ? {
                ...prev,
                memberIds: (prev.memberIds || []).filter((id) => id !== userId),
              }
            : null
        );
      }
      setSelectedMemberForProfile(null);

      // If currentUser banned themselves
      if (currentUser && (currentUser.id === userId || currentUser.displayName?.toLowerCase() === userName.toLowerCase())) {
        try {
          await signOut(auth);
        } catch {}
        localStorage.removeItem("toothchat_active_session");
        setFirebaseUser(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Błąd podczas banowania użytkownika:", err);
    }
  };

  // 13c. Global Account Deletion Handler
  const handleDeleteUserAccount = async (userId: string) => {
    try {
      await firestoreService.deleteUserAccountGlobal(userId);
      setAllUsers((prev) => prev.filter((u) => u.id !== userId));
      setServers((prev) =>
        prev.map((s) => ({
          ...s,
          memberIds: (s.memberIds || []).filter((id) => id !== userId),
        }))
      );
      if (activeServer) {
        setActiveServer((prev) =>
          prev
            ? {
                ...prev,
                memberIds: (prev.memberIds || []).filter((id) => id !== userId),
              }
            : null
        );
      }
      setSelectedMemberForProfile(null);

      // If current user deleted their own account
      if (currentUser && currentUser.id === userId) {
        try {
          await signOut(auth);
        } catch {}
        localStorage.removeItem("toothchat_active_session");
        setFirebaseUser(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Błąd podczas usuwania konta:", err);
    }
  };

  // 14. Sign Out Handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem("toothchat_active_session");
    setFirebaseUser(null);
    setCurrentUser(null);
  };

  // 15. Direct WebRTC Call Trigger
  const handleStartDirectCall = async (targetUser: UserIdentity) => {
    if (!currentUser) return;
    const callId = await webrtcService.initiateDirectCall(
      currentUser.id,
      currentUser.displayName,
      currentUser.publicKeySpki,
      targetUser.id,
      targetUser.displayName,
      "video"
    );

    setActiveCall({
      id: callId,
      callerId: currentUser.id,
      callerName: currentUser.displayName,
      callerPublicKey: currentUser.publicKeySpki,
      receiverId: targetUser.id,
      receiverName: targetUser.displayName,
      status: "calling",
      type: "video",
      createdAt: Date.now(),
    });
  };

  // 16. Accept Incoming Call
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall || !currentUser) return;
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  // 17. Open Direct E2EE Chat with User
  const handleOpenDirectChat = async (targetUser: UserIdentity) => {
    if (!currentUser) return;
    setActiveDmUser(targetUser);
    setActiveTab("dms");
    setIsMobileMenuOpen(false);
  };

  // 18. Invite User to Server Handler
  const handleInviteUser = async (userId: string) => {
    if (!activeServer) return;
    const updated = await firestoreService.inviteUserToServer(activeServer.id, userId);
    if (updated) {
      setActiveServer(updated);
      setServers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  // 19. Join Server Handler
  const handleJoinServer = async (codeOrId: string) => {
    if (!currentUser) return;
    const joined = await firestoreService.joinServerByCode(codeOrId, currentUser.id);
    if (joined) {
      setActiveServer(joined);
      setServers((prev) => {
        const exists = prev.some((s) => s.id === joined.id);
        return exists ? prev.map((s) => (s.id === joined.id ? joined : s)) : [...prev, joined];
      });
      if (joined.channels.length > 0) {
        const chan = joined.channels[0];
        setActiveChannel(chan);
        const derivedKey = await deriveDeterministicChannelKey(chan.id);
        setChannelSharedAesKey(derivedKey);
      }
      setActiveTab("server");
      setIsMobileMenuOpen(false);
    }
  };

  // Loading state
  if (!authInitialized) {
    return (
      <div className="h-screen w-screen bg-[#1e1f22] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#5865F2] flex items-center justify-center shadow-lg animate-pulse">
          <ToothLogoIcon className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white tracking-wide">ToothChat</h2>
          <p className="text-xs text-[#949ba4] font-mono mt-1">
            Inicjalizacja autoryzacji Firebase...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated or email verification flow
  if (!firebaseUser || !currentUser) {
    return (
      <AuthScreen
        currentUser={firebaseUser}
        onAuthSuccess={async (user) => {
          setFirebaseUser(user);
          await initUserSession(user);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full h-[100dvh] w-full min-h-0 bg-[#1e1f22] text-[#dbdee1] overflow-hidden font-sans relative">
      {/* 1. Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden animate-fade-in"
        />
      )}

      {/* 2. Navigation Sidebar & Mobile Drawer */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavigationSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === "friends") setIsFriendsModalOpen(true);
            else if (tab === "voice") {
              if (!activeVoiceRoom && activeServer) {
                const voiceChan = activeServer.channels.find((c) => c.type === "voice");
                if (voiceChan) setActiveVoiceRoom(voiceChan.id);
              }
              setActiveTab("voice");
            } else {
              setActiveTab(tab);
            }
            setIsMobileMenuOpen(false);
          }}
          activeVoiceRoom={activeVoiceRoom}
          servers={servers}
          activeServer={activeServer}
          currentUser={currentUser}
          recentDmSenders={recentDmSenders}
          activeDmUser={activeDmUser}
          onSelectDmUser={handleSelectDmUser}
          onDismissDmSender={handleDismissDmSender}
          onOpenAdminPanel={() => setShowAdminModal(true)}
          onSelectServer={async (srv) => {
            setActiveServer(srv);
            if (srv.channels.length > 0) {
              const chan = srv.channels[0];
              setActiveChannel(chan);
              const derivedKey = await deriveDeterministicChannelKey(chan.id);
              setChannelSharedAesKey(derivedKey);
            }
            setActiveTab("server");
            setIsMobileMenuOpen(false);
          }}
          onOpenCreateServer={() => setShowCreateServerModal(true)}
        />

        {/* Channel Sidebar (Inside the same mobile drawer for seamless mobile navigation) */}
        {activeTab !== "dms" && activeServer && activeChannel && (
          <div className="md:hidden flex h-full shadow-2xl">
            <ChannelSidebar
              server={activeServer}
              activeChannel={activeChannel}
              onSelectChannel={(chan) => {
                handleSelectChannel(chan);
                setIsMobileMenuOpen(false);
              }}
              currentUser={currentUser}
              onUpdateDisplayName={handleUpdateDisplayName}
              onSignOut={handleSignOut}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
              activeVoiceRoom={activeVoiceRoom}
              onJoinVoice={(channelId) => {
                setActiveVoiceRoom(channelId);
                setActiveTab("voice");
                setIsMobileMenuOpen(false);
              }}
              onLeaveVoice={() => {
                setActiveVoiceRoom(null);
                setActiveTab("server");
              }}
              onOpenAvatarModal={() => setShowAvatarModal(true)}
              onOpenCreateChannel={(type) => {
                setCreateChannelType(type);
                setShowCreateChannelModal(true);
              }}
              onOpenInviteModal={() => setShowInviteModal(true)}
              onDeleteChannel={handleDeleteChannel}
            />
          </div>
        )}
      </div>

      {/* 3. Main Application Stage (DMs or Server) */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden relative">
        {activeTab === "dms" ? (
          <DirectMessagesHomeView
            currentUser={currentUser}
            allUsers={allUsers}
            activeDmUser={activeDmUser}
            onSelectDmUser={setActiveDmUser}
            onStartCall={handleStartDirectCall}
            onStartDirectCall={handleStartDirectCall}
            onOpenDirectChat={handleOpenDirectChat}
            onSignOut={handleSignOut}
            onOpenAvatarModal={() => setShowAvatarModal(true)}
            onUpdateDisplayName={handleUpdateDisplayName}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onBackToServers={() => setActiveTab("server")}
            onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        ) : (
          <div className="flex-1 flex min-w-0 h-full overflow-hidden">
            {/* Server Channel Sidebar (Desktop Only) */}
            {activeServer && activeChannel && (
              <div className="hidden md:flex h-full">
                <ChannelSidebar
                  server={activeServer}
                  activeChannel={activeChannel}
                  onSelectChannel={handleSelectChannel}
                  currentUser={currentUser}
                  onUpdateDisplayName={handleUpdateDisplayName}
                  onSignOut={handleSignOut}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(!isMuted)}
                  activeVoiceRoom={activeVoiceRoom}
                  onJoinVoice={(channelId) => {
                    setActiveVoiceRoom(channelId);
                    setActiveTab("voice");
                  }}
                  onLeaveVoice={() => {
                    setActiveVoiceRoom(null);
                    setActiveTab("server");
                  }}
                  onOpenAvatarModal={() => setShowAvatarModal(true)}
                  onOpenCreateChannel={(type) => {
                    setCreateChannelType(type);
                    setShowCreateChannelModal(true);
                  }}
                  onOpenInviteModal={() => setShowInviteModal(true)}
                  onDeleteChannel={handleDeleteChannel}
                />
              </div>
            )}

            {/* Center Stage: Chat or Voice Room */}
            <div className="flex-1 flex overflow-hidden bg-[#313338] relative">
              {activeTab === "voice" && activeVoiceRoom && activeServer ? (
                <VoiceRoomMeshView
                  roomId={activeVoiceRoom}
                  roomName={
                    activeServer.channels.find((c) => c.id === activeVoiceRoom)?.name ||
                    "🔊 Pokój Głosowy"
                  }
                  currentUser={currentUser}
                  onLeave={() => {
                    setActiveVoiceRoom(null);
                    setActiveTab("server");
                  }}
                />
              ) : activeChannel && activeServer ? (
                <ChatArea
                  channel={activeChannel}
                  messages={messages}
                  currentUser={currentUser}
                  allUsers={allUsers}
                  server={activeServer}
                  onSendMessage={handleSendMessage}
                  onDeleteMessage={handleDeleteMessage}
                  showMemberList={showMemberList}
                  onToggleMemberList={() => setShowMemberList(!showMemberList)}
                  onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
                  onOpenMemberProfile={(member) => setSelectedMemberForProfile(member)}
                />
              ) : null}

              {/* Desktop Member List */}
              {activeTab !== "voice" && showMemberList && activeServer && (
                <div className="hidden lg:flex h-full">
                  <MemberListSidebar
                    members={memberListToDisplay}
                    currentUser={currentUser}
                    server={activeServer}
                    onOpenMemberProfile={(member) => setSelectedMemberForProfile(member)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Mobile Slide-Over Drawer for Member List */}
      {showMemberList && activeServer && activeTab !== "voice" && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setShowMemberList(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-[#2b2d31] shadow-2xl z-10 flex flex-col">
            <MemberListSidebar
              members={memberListToDisplay}
              currentUser={currentUser}
              server={activeServer}
              onOpenMemberProfile={(member) => {
                setSelectedMemberForProfile(member);
                setShowMemberList(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 5. Discord-Style Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around h-[54px] bg-[#1e1f22] border-t border-[#2b2d31] shrink-0 z-30 px-2 select-none safe-area-bottom">
        {/* Tab 1: Serwery / Kanały */}
        <button
          onClick={() => {
            if (activeTab === "server" && !isMobileMenuOpen) {
              setIsMobileMenuOpen(true);
            } else {
              setActiveTab("server");
              setIsMobileMenuOpen(false);
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            activeTab === "server" ? "text-white" : "text-[#949ba4] hover:text-[#dbdee1]"
          }`}
        >
          <div className="relative">
            <Hash className={`w-5 h-5 ${activeTab === "server" ? "text-[#5865F2]" : ""}`} />
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Serwery</span>
        </button>

        {/* Tab 2: Wiadomości DM */}
        <button
          onClick={() => {
            setActiveTab("dms");
            if (recentDmSenders.length > 0 && !activeDmUser) {
              handleSelectDmUser(recentDmSenders[0]);
            }
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer relative ${
            activeTab === "dms" && activeDmUser ? "text-white" : "text-[#949ba4] hover:text-[#dbdee1]"
          }`}
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 ${activeTab === "dms" && activeDmUser ? "text-[#5865F2]" : ""}`} />
            {recentDmSenders.length > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-[#da373c] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#1e1f22] animate-pulse">
                {recentDmSenders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Wiadomości</span>
        </button>

        {/* Tab 3: Znajomi */}
        <button
          onClick={() => {
            setActiveTab("dms");
            setActiveDmUser(null);
            setIsMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            activeTab === "dms" && !activeDmUser ? "text-white" : "text-[#949ba4] hover:text-[#dbdee1]"
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === "dms" && !activeDmUser ? "text-[#23a55a]" : ""}`} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Znajomi</span>
        </button>

        {/* Tab 4: Mój Profil & Status */}
        <button
          onClick={() => setShowAvatarModal(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[#949ba4] hover:text-[#dbdee1] transition-colors cursor-pointer"
        >
          <div className="relative w-6 h-6 flex items-center justify-center">
            {currentUser ? (
              <AvatarWithDecoration
                user={currentUser}
                avatarUrl={currentUser.avatarUrl}
                displayName={currentUser.displayName}
                avatarColor={currentUser.avatarColor}
                decorationId={currentUser.avatarDecoration}
                status={currentUser.status || "online"}
                size="sm"
                showStatus={true}
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5 truncate max-w-[64px]">
            {currentUser?.displayName ? currentUser.displayName.slice(0, 7) : "Ty"}
          </span>
        </button>
      </div>

      {/* 5. Modals & Overlay Workspaces */}

      {/* Invite Friends to Server Modal */}
      {showInviteModal && activeServer && currentUser && (
        <InviteServerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          server={activeServer}
          currentUser={currentUser}
          allUsers={allUsers}
          onInviteUser={handleInviteUser}
        />
      )}

      {/* Avatar, Custom Status, Decorations & Profile Effects Shop Modal */}
      {currentUser && (
        <AvatarUploadModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentUser={currentUser}
          onSave={handleSaveAvatar}
          onRedeemCode={handleRedeemPromoCode}
          onUnlockDecoration={handleUnlockDecoration}
          onEquipDecoration={handleEquipDecoration}
          onUnlockProfileEffect={handleUnlockProfileEffect}
          onEquipProfileEffect={handleEquipProfileEffect}
          onDeleteAccount={() => handleDeleteUserAccount(currentUser.id)}
        />
      )}

      {/* Create / Join Server Modal */}
      {currentUser && (
        <CreateServerModal
          isOpen={showCreateServerModal}
          onClose={() => setShowCreateServerModal(false)}
          currentUser={currentUser}
          onServerCreated={handleCreateServer}
          onCreateServer={handleCreateServer}
          onJoinServer={handleJoinServer}
        />
      )}

      {/* Create Channel Modal */}
      {activeServer && (
        <CreateChannelModal
          isOpen={showCreateChannelModal}
          onClose={() => setShowCreateChannelModal(false)}
          server={activeServer}
          initialType={createChannelType}
          onChannelCreated={handleCreateChannel}
        />
      )}

      {/* Member Profile & Moderation Modal */}
      {selectedMemberForProfile && activeServer && currentUser && (
        <MemberProfileModal
          isOpen={!!selectedMemberForProfile}
          onClose={() => setSelectedMemberForProfile(null)}
          member={selectedMemberForProfile}
          currentUser={currentUser}
          server={activeServer}
          onSetRole={handleSetRole}
          onMuteMember={handleToggleMuteMember}
          onTimeoutMember={handleTimeoutMember}
          onKickMember={handleKickMember}
          onBanUser={handleBanUser}
          onDeleteAccount={(userId) => handleDeleteUserAccount(userId)}
          onStartCall={handleStartDirectCall}
          onOpenChat={handleOpenDirectChat}
          onEditProfile={() => setShowAvatarModal(true)}
        />
      )}

      {/* Direct 1-on-1 P2P Video Call Modal */}
      {activeCall && (
        <DirectCallModal
          call={activeCall}
          currentUser={currentUser}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2b2d31] border border-[#232428] rounded-[8px] p-4 shadow-2xl animate-bounce flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-[#5865f2] flex items-center justify-center font-bold text-lg">
            <ToothLogoIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Przychodzące połączenie ToothChat</h4>
            <p className="text-xs text-[#949ba4] font-mono">{incomingCall.callerName}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAcceptIncomingCall}
              className="px-4 py-1.5 bg-[#23a55a] hover:bg-[#1f934f] text-white rounded-[4px] text-xs font-semibold cursor-pointer"
            >
              Odbierz
            </button>
            <button
              onClick={() => setIncomingCall(null)}
              className="px-4 py-1.5 bg-[#da373c] hover:bg-[#b82e32] text-white rounded-[4px] text-xs font-semibold cursor-pointer"
            >
              Odrzuć
            </button>
          </div>
        </div>
      )}

      {/* Friends Manager Modal */}
      {currentUser && (
        <FriendsManagerModal
          isOpen={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          currentUser={currentUser}
          onStartDirectCall={handleStartDirectCall}
          onOpenDirectChat={handleOpenDirectChat}
        />
      )}

      {/* Global Superadmin Panel Modal (Available for 'cfx' or admin roles) */}
      {currentUser && (
        <AdminPanelModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          currentUser={currentUser}
          servers={firestoreService.getAllServersGlobal()}
          allUsers={allUsers}
          onRefreshServers={async () => {
            const s = firestoreService.getServers(currentUser.id);
            setServers(s);
          }}
          onRefreshUsers={async () => {
            const u = await firestoreService.getAllUsers();
            setAllUsers(u);
          }}
        />
      )}
    </div>
  );
}

