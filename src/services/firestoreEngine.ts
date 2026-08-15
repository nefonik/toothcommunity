/**
 * ToothChat Real Firebase Firestore Engine & Signaling Service
 * Native Google Cloud Firestore integration with offline support & Spark Quota tracking
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  UserIdentity,
  EncryptedMessagePayload,
  ServerGuild,
  ServerChannel,
  CallSession,
  MeshPeerSignal,
  FirestoreQuotaStats,
} from "../types";

class RealFirestoreEngine {
  private quotaStats: FirestoreQuotaStats = {
    reads: 0,
    writes: 0,
    deletes: 0,
    estimatedSparkCost: "$0.00 (Firebase Spark Plan)",
  };

  private localFallbackMessages: Map<string, EncryptedMessagePayload[]> = new Map();
  private localFallbackUsers: Map<string, UserIdentity> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  public getQuotaStats(): FirestoreQuotaStats {
    return { ...this.quotaStats };
  }

  private trackRead(count = 1) {
    this.quotaStats.reads += count;
  }

  private trackWrite(count = 1) {
    this.quotaStats.writes += count;
  }

  private trackDelete(count = 1) {
    this.quotaStats.deletes += count;
  }

  private seedDefaultUsers() {
    const defaultUsers: UserIdentity[] = [
      {
        id: "usr_alice",
        displayName: "ToothAdmin [Alice]",
        tokenHash: "toothA1b2C3d4E5F67890Hash==",
        publicKeySpki: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEW1",
        avatarColor: "#5865f2",
        status: "online",
        createdAt: Date.now() - 86400000 * 5,
        lastSeen: Date.now(),
      },
      {
        id: "usr_bob",
        displayName: "CyberTooth [Bob]",
        tokenHash: "toothB2c3D4e5F67890A1Hash==",
        publicKeySpki: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEB2",
        avatarColor: "#23a55a",
        status: "online",
        createdAt: Date.now() - 86400000 * 3,
        lastSeen: Date.now(),
      },
      {
        id: "usr_carol",
        displayName: "CryptoEnamel [Carol]",
        tokenHash: "toothC3d4E5F67890A1B2Hash==",
        publicKeySpki: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEC3",
        avatarColor: "#f0b232",
        status: "idle",
        createdAt: Date.now() - 86400000 * 2,
        lastSeen: Date.now(),
      },
      {
        id: "usr_dave",
        displayName: "MeshMolar [Dave]",
        tokenHash: "toothD4e5F67890A1B2C3Hash==",
        publicKeySpki: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAED4",
        avatarColor: "#eb459e",
        status: "dnd",
        createdAt: Date.now() - 86400000,
        lastSeen: Date.now(),
      },
    ];

    defaultUsers.forEach((u) => this.localFallbackUsers.set(u.id, u));
  }

  // --- Users in Firestore ---
  public async registerUser(user: UserIdentity): Promise<void> {
    this.trackWrite(1);
    this.localFallbackUsers.set(user.id, user);

    try {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, {
        id: user.id,
        displayName: user.displayName,
        email: user.email || "",
        emailVerified: user.emailVerified || false,
        avatarUrl: user.avatarUrl || "",
        customStatus: user.customStatus || "",
        tokenHash: user.tokenHash,
        publicKeySpki: user.publicKeySpki,
        avatarColor: user.avatarColor || "#5865f2",
        status: user.status || "online",
        createdAt: user.createdAt,
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore registerUser fallback:", err);
    }
  }

  public async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (existing) {
      existing.avatarUrl = avatarUrl;
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        avatarUrl: avatarUrl,
        lastSeen: Date.now(),
      });
    } catch (err) {
      console.warn("Firestore updateUserAvatar fallback:", err);
    }
  }

  public async updateAvatarAndStatus(userId: string, avatarUrl: string, customStatus?: string): Promise<void> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (existing) {
      existing.avatarUrl = avatarUrl;
      if (customStatus !== undefined) existing.customStatus = customStatus;
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        avatarUrl: avatarUrl,
        ...(customStatus !== undefined ? { customStatus } : {}),
        lastSeen: Date.now(),
      });
    } catch (err) {
      console.warn("Firestore updateAvatarAndStatus fallback:", err);
    }
  }

  public async updateCustomStatus(userId: string, customStatus: string): Promise<void> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (existing) {
      existing.customStatus = customStatus;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        customStatus: customStatus,
        lastSeen: Date.now(),
      });
    } catch (err) {
      console.warn("Firestore updateCustomStatus fallback:", err);
    }
  }

  public async getUser(userId: string): Promise<UserIdentity | null> {
    this.trackRead(1);
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserIdentity;
      }
    } catch (err) {
      console.warn("Firestore getUser fallback:", err);
    }
    return this.localFallbackUsers.get(userId) || null;
  }

  public async updateDisplayName(userId: string, newDisplayName: string): Promise<void> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (existing) {
      existing.displayName = newDisplayName.trim();
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        displayName: newDisplayName.trim(),
        lastSeen: Date.now(),
      });
    } catch (err) {
      console.warn("Firestore updateDisplayName fallback:", err);
    }
  }

  public async findUserByEmail(email: string): Promise<UserIdentity | null> {
    this.trackRead(1);
    const cleanEmail = email.trim().toLowerCase();
    for (const u of this.localFallbackUsers.values()) {
      if (u.email?.toLowerCase() === cleanEmail) {
        return u;
      }
    }
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", cleanEmail), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const u = snap.docs[0].data() as UserIdentity;
        this.localFallbackUsers.set(u.id, u);
        return u;
      }
    } catch (err) {
      console.warn("Firestore findUserByEmail fallback:", err);
    }
    return null;
  }

  public async getAllUsers(): Promise<UserIdentity[]> {
    this.trackRead(1);
    try {
      const usersCol = collection(db, "users");
      const snap = await getDocs(usersCol);
      if (!snap.empty) {
        const list: UserIdentity[] = [];
        snap.forEach((d) => list.push(d.data() as UserIdentity));
        // merge with local
        list.forEach((u) => this.localFallbackUsers.set(u.id, u));
        return Array.from(this.localFallbackUsers.values());
      }
    } catch (err) {
      console.warn("Firestore getAllUsers fallback:", err);
    }
    return Array.from(this.localFallbackUsers.values());
  }

  // --- Servers & Channels Management ---
  private localServers: ServerGuild[] = [
    {
      id: "srv_tooth_hq",
      name: "ToothChat HQ",
      icon: "🦷",
      ownerId: "usr_alice",
      memberIds: ["usr_alice", "usr_bob", "usr_carol", "usr_dave"],
      roles: {
        usr_alice: "admin",
        usr_bob: "support",
        usr_carol: "member",
        usr_dave: "member",
      },
      channels: [
        {
          id: "chn_general",
          serverId: "srv_tooth_hq",
          name: "ogólny",
          type: "text",
          topic: "Główny kanał społeczności ToothChat",
          isEncrypted: true,
          ratchetVersion: 1,
        },
        {
          id: "chn_e2ee_crypto",
          serverId: "srv_tooth_hq",
          name: "rozmowy",
          type: "text",
          topic: "Kanał dyskusyjny społeczności",
          isEncrypted: true,
          ratchetVersion: 1,
        },
        {
          id: "chn_voice_alpha",
          serverId: "srv_tooth_hq",
          name: "🔊 Pokój Głosowy Tooth 1",
          type: "voice",
          topic: "WebRTC Full-Mesh Voice & Video",
          isEncrypted: true,
          ratchetVersion: 1,
        },
      ],
      createdAt: Date.now() - 86400000,
    },
  ];

  public getServers(currentUserId?: string): ServerGuild[] {
    this.trackRead(1);
    const defaultStarter: ServerGuild = {
      id: "srv_tooth_hq",
      name: "ToothChat HQ",
      icon: "🦷",
      description: "Oficjalny serwer startowy społeczności ToothChat",
      ownerId: "usr_alice",
      memberIds: ["usr_alice", "usr_bob", "usr_carol", "usr_dave"],
      roles: {
        usr_alice: "admin",
        usr_bob: "support",
        usr_carol: "member",
        usr_dave: "member",
      },
      channels: [
        {
          id: "chn_general",
          serverId: "srv_tooth_hq",
          name: "ogólny",
          type: "text",
          topic: "Główny kanał społeczności ToothChat",
          isEncrypted: true,
          ratchetVersion: 1,
        },
        {
          id: "chn_e2ee_crypto",
          serverId: "srv_tooth_hq",
          name: "rozmowy",
          type: "text",
          topic: "Kanał dyskusyjny społeczności",
          isEncrypted: true,
          ratchetVersion: 1,
        },
        {
          id: "chn_voice_alpha",
          serverId: "srv_tooth_hq",
          name: "🔊 Pokój Głosowy Tooth 1",
          type: "voice",
          topic: "WebRTC Full-Mesh Voice & Video",
          isEncrypted: true,
          ratchetVersion: 1,
        },
      ],
      createdAt: Date.now() - 86400000,
    };

    let list: ServerGuild[] = [];
    try {
      const stored = localStorage.getItem("toothchat_saved_servers");
      if (stored) {
        const parsed = JSON.parse(stored) as ServerGuild[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
    } catch {}

    if (list.length === 0) {
      list = [defaultStarter];
    }

    // Ensure default starter server is present
    const hasStarter = list.some((s) => s.id === "srv_tooth_hq");
    if (!hasStarter) {
      list = [defaultStarter, ...list];
    }

    // Sanitize every server so channels are never empty
    list = list.map((s) => {
      let channels = s.channels || [];
      if (channels.length === 0) {
        channels = [
          {
            id: `chn_text_${s.id}_general`,
            serverId: s.id,
            name: "ogólny",
            type: "text",
            topic: `Kanał ogólny serwera ${s.name}`,
            isEncrypted: true,
            ratchetVersion: 1,
          },
          {
            id: `chn_voice_${s.id}_voice1`,
            serverId: s.id,
            name: "🔊 Pokój Głosowy",
            type: "voice",
            topic: "WebRTC Voice & Video",
            isEncrypted: true,
            ratchetVersion: 1,
          },
        ];
      }
      const memberIds = s.memberIds || [];
      if (currentUserId && !memberIds.includes(currentUserId)) {
        memberIds.push(currentUserId);
      }
      return {
        ...s,
        memberIds,
        channels,
      };
    });

    try {
      localStorage.setItem("toothchat_saved_servers", JSON.stringify(list));
    } catch {}

    this.localServers = list;
    return list;
  }

  public async createServer(server: ServerGuild): Promise<ServerGuild[]> {
    this.trackWrite(1);
    const current = this.getServers();
    const updated = [...current, server];
    this.localServers = updated;
    try {
      localStorage.setItem("toothchat_saved_servers", JSON.stringify(updated));
      const srvRef = doc(db, "servers", server.id);
      await setDoc(srvRef, server, { merge: true });
    } catch (err) {
      console.warn("Firestore createServer fallback:", err);
    }
    return updated;
  }

  public async addChannelToServer(serverId: string, channel: ServerChannel): Promise<ServerGuild[]> {
    this.trackWrite(1);
    const servers = this.getServers();
    const target = servers.find((s) => s.id === serverId);
    if (target) {
      target.channels = [...target.channels.filter((c) => c.id !== channel.id), channel];
      try {
        localStorage.setItem("toothchat_saved_servers", JSON.stringify(servers));
        const srvRef = doc(db, "servers", serverId);
        await setDoc(srvRef, target, { merge: true });
      } catch (err) {
        console.warn("Firestore addChannelToServer fallback:", err);
      }
    }
    return [...servers];
  }

  public async deleteChannel(serverId: string, channelId: string): Promise<ServerGuild[]> {
    this.trackDelete(1);
    const servers = this.getServers();
    const target = servers.find((s) => s.id === serverId);
    if (target) {
      target.channels = target.channels.filter((c) => c.id !== channelId);
      try {
        localStorage.setItem("toothchat_saved_servers", JSON.stringify(servers));
        const srvRef = doc(db, "servers", serverId);
        await setDoc(srvRef, target, { merge: true });
      } catch (err) {
        console.warn("Firestore deleteChannel fallback:", err);
      }
    }
    return [...servers];
  }

  public async setMemberRole(serverId: string, userId: string, role: "admin" | "support" | "member"): Promise<ServerGuild[]> {
    this.trackWrite(1);
    const servers = this.getServers();
    const target = servers.find((s) => s.id === serverId);
    if (target) {
      if (!target.roles) target.roles = {};
      target.roles[userId] = role;
      try {
        localStorage.setItem("toothchat_saved_servers", JSON.stringify(servers));
        const srvRef = doc(db, "servers", serverId);
        await setDoc(srvRef, target, { merge: true });
      } catch (err) {
        console.warn("Firestore setMemberRole fallback:", err);
      }
    }
    return [...servers];
  }

  public async muteMember(serverId: string, userId: string, isMuted: boolean): Promise<ServerGuild[]> {
    this.trackWrite(1);
    const servers = this.getServers();
    const target = servers.find((s) => s.id === serverId);
    if (target) {
      if (!target.mutedUserIds) target.mutedUserIds = [];
      if (isMuted) {
        if (!target.mutedUserIds.includes(userId)) target.mutedUserIds.push(userId);
      } else {
        target.mutedUserIds = target.mutedUserIds.filter((id) => id !== userId);
      }
      try {
        localStorage.setItem("toothchat_saved_servers", JSON.stringify(servers));
        const srvRef = doc(db, "servers", serverId);
        await setDoc(srvRef, target, { merge: true });
      } catch (err) {
        console.warn("Firestore muteMember fallback:", err);
      }
    }
    return [...servers];
  }

  public async timeoutMember(serverId: string, userId: string, durationMinutes: number): Promise<ServerGuild[]> {
    this.trackWrite(1);
    const servers = this.getServers();
    const target = servers.find((s) => s.id === serverId);
    if (target) {
      if (!target.timeouts) target.timeouts = {};
      if (durationMinutes <= 0) {
        delete target.timeouts[userId];
      } else {
        target.timeouts[userId] = Date.now() + durationMinutes * 60 * 1000;
      }
      try {
        localStorage.setItem("toothchat_saved_servers", JSON.stringify(servers));
        const srvRef = doc(db, "servers", serverId);
        await setDoc(srvRef, target, { merge: true });
      } catch (err) {
        console.warn("Firestore timeoutMember fallback:", err);
      }
    }
    return [...servers];
  }

  public async kickMember(serverId: string, userId: string): Promise<ServerGuild[]> {
    this.trackDelete(1);
    const servers = this.getServers();
    const target = servers.find((s) => s.id === serverId);
    if (target) {
      target.memberIds = target.memberIds.filter((id) => id !== userId);
      if (target.roles) delete target.roles[userId];
      if (target.mutedUserIds) target.mutedUserIds = target.mutedUserIds.filter((id) => id !== userId);
      if (target.timeouts) delete target.timeouts[userId];
      try {
        localStorage.setItem("toothchat_saved_servers", JSON.stringify(servers));
        const srvRef = doc(db, "servers", serverId);
        await setDoc(srvRef, target, { merge: true });
      } catch (err) {
        console.warn("Firestore kickMember fallback:", err);
      }
    }
    return [...servers];
  }

  // --- Messages in Firestore ---
  public async deleteMessage(messageId: string, channelId: string): Promise<void> {
    this.trackDelete(1);
    const current = this.localFallbackMessages.get(channelId) || [];
    this.localFallbackMessages.set(channelId, current.filter((m) => m.id !== messageId));

    try {
      const msgRef = doc(db, "channel_messages", messageId);
      await deleteDoc(msgRef);
    } catch (err) {
      console.warn("Firestore deleteMessage fallback:", err);
    }
  }

  public async sendEncryptedMessage(payload: EncryptedMessagePayload): Promise<void> {
    this.trackWrite(1);

    const messageText = payload.decryptedText || payload.text || payload.content || "";

    const fullPayload: EncryptedMessagePayload = {
      ...payload,
      text: messageText,
      decryptedText: messageText,
    };

    // Save locally
    const list = this.localFallbackMessages.get(payload.channelId) || [];
    list.push(fullPayload);
    this.localFallbackMessages.set(payload.channelId, list);

    try {
      const msgRef = doc(db, "channel_messages", payload.id);
      await setDoc(msgRef, {
        id: payload.id,
        channelId: payload.channelId,
        serverId: payload.serverId || "srv_tooth_hq",
        senderId: payload.senderId,
        senderName: payload.senderName,
        senderAvatarUrl: payload.senderAvatarUrl || "",
        senderPublicKey: payload.senderPublicKey || "",
        ciphertext: payload.ciphertext || "",
        iv: payload.iv || "",
        text: messageText,
        keyFingerprint: payload.keyFingerprint || "TOOTH-AES-GCM",
        timestamp: payload.timestamp || Date.now(),
      });
    } catch (err) {
      console.warn("Firestore sendEncryptedMessage fallback:", err);
    }
  }

  public subscribeChannelMessages(
    channelId: string,
    callback: (messages: EncryptedMessagePayload[]) => void
  ): () => void {
    let unsubFirestore: Unsubscribe | null = null;

    try {
      const q = query(
        collection(db, "channel_messages"),
        where("channelId", "==", channelId)
      );

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          this.trackRead(snapshot.docChanges().length || 1);
          const messages: EncryptedMessagePayload[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            const textContent = data.text || data.content || data.decryptedText || data.ciphertext || "";
            messages.push({
              id: data.id || doc.id,
              channelId: data.channelId,
              serverId: data.serverId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderPublicKey: data.senderPublicKey,
              ciphertext: data.ciphertext,
              iv: data.iv,
              keyFingerprint: data.keyFingerprint,
              text: textContent,
              decryptedText: textContent,
              timestamp: data.timestamp || Date.now(),
            });
          });
          // Sort by timestamp
          messages.sort((a, b) => a.timestamp - b.timestamp);

          if (messages.length > 0) {
            this.localFallbackMessages.set(channelId, messages);
            callback(messages);
          } else {
            const local = this.localFallbackMessages.get(channelId) || [];
            callback(local);
          }
        },
        (error) => {
          console.warn("Firestore onSnapshot subscription warning:", error);
          const local = this.localFallbackMessages.get(channelId) || [];
          callback(local);
        }
      );
    } catch (err) {
      console.warn("Firestore subscribeChannelMessages query error:", err);
      const local = this.localFallbackMessages.get(channelId) || [];
      callback(local);
    }

    return () => {
      if (unsubFirestore) unsubFirestore();
    };
  }

  // --- WebRTC 1-on-1 Signaling in Firestore (/calls) ---
  public async createCall(call: CallSession): Promise<void> {
    this.trackWrite(1);
    try {
      const callRef = doc(db, "calls", call.id);
      await setDoc(callRef, {
        id: call.id,
        callerId: call.callerId,
        callerName: call.callerName,
        callerPublicKey: call.callerPublicKey,
        receiverId: call.receiverId,
        receiverName: call.receiverName,
        status: call.status,
        type: call.type,
        offer: call.offer || null,
        answer: call.answer || null,
        iceCandidates: call.iceCandidates || [],
        createdAt: call.createdAt || Date.now(),
      });
    } catch (err) {
      console.warn("Firestore createCall fallback:", err);
    }
  }

  public async updateCall(callId: string, updates: Partial<CallSession>): Promise<void> {
    this.trackWrite(1);
    try {
      const callRef = doc(db, "calls", callId);
      await updateDoc(callRef, updates);
    } catch (err) {
      console.warn("Firestore updateCall fallback:", err);
    }
  }

  public subscribeCall(callId: string, callback: (call: CallSession | null) => void): () => void {
    let unsub: Unsubscribe | null = null;
    try {
      const callRef = doc(db, "calls", callId);
      unsub = onSnapshot(callRef, (snapshot) => {
        this.trackRead(1);
        if (snapshot.exists()) {
          callback(snapshot.data() as CallSession);
        } else {
          callback(null);
        }
      });
    } catch (err) {
      console.warn("Firestore subscribeCall fallback:", err);
    }

    return () => {
      if (unsub) unsub();
    };
  }

  public subscribeIncomingCalls(userId: string, callback: (call: CallSession | null) => void): () => void {
    let unsub: Unsubscribe | null = null;
    try {
      const q = query(
        collection(db, "calls"),
        where("receiverId", "==", userId),
        where("status", "==", "calling")
      );

      unsub = onSnapshot(q, (snapshot) => {
        this.trackRead(snapshot.docs.length || 1);
        if (!snapshot.empty) {
          const firstCall = snapshot.docs[0].data() as CallSession;
          callback(firstCall);
        } else {
          callback(null);
        }
      });
    } catch (err) {
      console.warn("Firestore subscribeIncomingCalls fallback:", err);
    }

    return () => {
      if (unsub) unsub();
    };
  }

  // --- WebRTC Mesh Signaling in Firestore (/voice_rooms/{roomId}/peers/{peerId}) ---
  public async syncMeshPeer(roomId: string, signal: MeshPeerSignal): Promise<void> {
    this.trackWrite(1);
    try {
      const peerRef = doc(db, "voice_rooms", roomId, "peers", signal.peerId);
      await setDoc(peerRef, {
        peerId: signal.peerId,
        peerName: signal.peerName,
        peerPublicKey: signal.peerPublicKey,
        audioMuted: signal.audioMuted || false,
        videoEnabled: signal.videoEnabled || false,
        lastHeartbeat: Date.now(),
      });
    } catch (err) {
      console.warn("Firestore syncMeshPeer fallback:", err);
    }
  }

  public async leaveMeshRoom(roomId: string, peerId: string): Promise<void> {
    this.trackDelete(1);
    try {
      const peerRef = doc(db, "voice_rooms", roomId, "peers", peerId);
      await deleteDoc(peerRef);
    } catch (err) {
      console.warn("Firestore leaveMeshRoom fallback:", err);
    }
  }

  public subscribeMeshRoom(
    roomId: string,
    callback: (peers: MeshPeerSignal[]) => void
  ): () => void {
    let unsub: Unsubscribe | null = null;
    try {
      const peersCol = collection(db, "voice_rooms", roomId, "peers");
      unsub = onSnapshot(peersCol, (snapshot) => {
        this.trackRead(snapshot.docs.length || 1);
        const peers: MeshPeerSignal[] = [];
        snapshot.forEach((d) => peers.push(d.data() as MeshPeerSignal));
        callback(peers);
      });
    } catch (err) {
      console.warn("Firestore subscribeMeshRoom fallback:", err);
    }

    return () => {
      if (unsub) unsub();
    };
  }
}

export const firestoreService = new RealFirestoreEngine();
