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
  private deletedUserIds: Set<string> = new Set();
  private userListeners: Array<(users: UserIdentity[]) => void> = [];

  constructor() {
    try {
      const savedDeleted = localStorage.getItem("toothchat_deleted_users");
      if (savedDeleted) {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed)) {
          this.deletedUserIds = new Set(parsed);
        }
      }
    } catch {}
    // Ensure usr_alice / ToothAdmin is permanently blacklisted
    this.deletedUserIds.add("usr_alice");
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
        id: "usr_cfx_admin",
        displayName: "cfx",
        email: "cfx@gmail.com",
        role: "superadmin",
        avatarUrl: "",
        avatarDecoration: "flame_crown",
        unlockedDecorations: [
          "flame_crown",
          "neon_cyber",
          "cyber_grid",
          "galaxy_portal",
          "prism_flux",
          "ice_crystals",
          "fire_flames",
          "glitch_matrix",
          "diamond_sparkle",
          "gold_aura",
        ],
        points: 999999,
        customStatus: "👑 Master Administrator ToothChat",
        tokenHash: "cfxRootAdminMasterToken2026==",
        publicKeySpki: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAECFXROOT",
        avatarColor: "#5865f2",
        status: "online",
        createdAt: Date.now() - 86400000 * 30,
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

    defaultUsers.forEach((u) => {
      if (!this.deletedUserIds.has(u.id)) {
        this.localFallbackUsers.set(u.id, u);
      }
    });
  }

  // --- Users in Firestore & Real-Time Sync ---
  public async registerUser(user: UserIdentity): Promise<UserIdentity> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(user.id);
    let remoteData: Partial<UserIdentity> | null = null;

    try {
      const userRef = doc(db, "users", user.id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        remoteData = snap.data() as Partial<UserIdentity>;
      }
    } catch (err) {
      console.warn("Firestore check user exists error:", err);
    }

    const points = remoteData?.points ?? existing?.points ?? user.points ?? 150;
    const unlockedDecorations =
      (remoteData?.unlockedDecorations && remoteData.unlockedDecorations.length > 0)
        ? remoteData.unlockedDecorations
        : (existing?.unlockedDecorations && existing.unlockedDecorations.length > 0)
        ? existing.unlockedDecorations
        : user.unlockedDecorations || [];
    const avatarDecoration =
      remoteData?.avatarDecoration || existing?.avatarDecoration || user.avatarDecoration || "";
    const avatarUrl =
      remoteData?.avatarUrl || existing?.avatarUrl || user.avatarUrl || "";
    const customStatus =
      remoteData?.customStatus !== undefined
        ? remoteData.customStatus
        : existing?.customStatus !== undefined
        ? existing.customStatus
        : user.customStatus || "";
    const role: "superadmin" | "admin" | "user" =
      remoteData?.role || existing?.role || user.role || "user";
    const displayName = user.displayName || remoteData?.displayName || existing?.displayName || "Użytkownik";

    const userToSave: UserIdentity = {
      ...user,
      displayName,
      role,
      avatarUrl,
      customStatus,
      points,
      unlockedDecorations,
      avatarDecoration,
      lastSeen: Date.now(),
    };

    this.localFallbackUsers.set(user.id, userToSave);

    try {
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, {
        id: userToSave.id,
        displayName: userToSave.displayName,
        email: userToSave.email || "",
        emailVerified: userToSave.emailVerified || false,
        role: userToSave.role,
        avatarUrl: userToSave.avatarUrl || "",
        avatarDecoration: userToSave.avatarDecoration || "",
        unlockedDecorations: userToSave.unlockedDecorations || [],
        points: userToSave.points,
        customStatus: userToSave.customStatus || "",
        tokenHash: userToSave.tokenHash,
        publicKeySpki: userToSave.publicKeySpki,
        avatarColor: userToSave.avatarColor || "#5865f2",
        status: userToSave.status || "online",
        createdAt: userToSave.createdAt,
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore registerUser fallback:", err);
    }

    return userToSave;
  }

  public isPurgedUser(u?: UserIdentity | null): boolean {
    if (!u) return true;
    if (this.deletedUserIds.has(u.id)) return true;
    if (u.id === "usr_alice") return true;
    if (
      u.displayName &&
      (u.displayName.toLowerCase().includes("alice") ||
        u.displayName.toLowerCase().includes("toothadmin"))
    ) {
      return true;
    }
    return false;
  }

  public subscribeUsers(callback: (users: UserIdentity[]) => void): () => void {
    this.trackRead(1);
    this.userListeners.push(callback);

    // Initial callback with current sanitized local list
    const initialList = Array.from(this.localFallbackUsers.values()).filter(
      (u) => !this.isPurgedUser(u)
    );
    callback(initialList);

    try {
      const usersCol = collection(db, "users");
      const unsub = onSnapshot(
        usersCol,
        (snapshot) => {
          this.trackRead(snapshot.docs.length || 1);
          const remoteUsers = new Map<string, UserIdentity>();
          snapshot.forEach((d) => {
            const u = d.data() as UserIdentity;
            if (u && u.id && !this.isPurgedUser(u)) {
              remoteUsers.set(u.id, u);
            }
          });

          // Sync localFallbackUsers with remote snapshot
          if (!snapshot.empty) {
            // Delete only explicitly removed users
            this.deletedUserIds.forEach((id) => this.localFallbackUsers.delete(id));
            this.localFallbackUsers.delete("usr_alice");

            remoteUsers.forEach((u, id) => {
              if (this.isPurgedUser(u)) return;
              const prev = this.localFallbackUsers.get(id);
              this.localFallbackUsers.set(id, {
                ...prev,
                ...u,
                points: u.points ?? prev?.points ?? 150,
                unlockedDecorations: u.unlockedDecorations ?? prev?.unlockedDecorations ?? [],
                avatarDecoration: u.avatarDecoration ?? prev?.avatarDecoration ?? "",
                avatarUrl: u.avatarUrl ?? prev?.avatarUrl ?? "",
                customStatus: u.customStatus ?? prev?.customStatus ?? "",
              });
            });
          } else {
            this.deletedUserIds.forEach((id) => this.localFallbackUsers.delete(id));
            this.localFallbackUsers.delete("usr_alice");
          }

          const cleanList = Array.from(this.localFallbackUsers.values()).filter(
            (u) => !this.isPurgedUser(u)
          );
          callback(cleanList);
        },
        (err) => {
          console.warn("Firestore subscribeUsers error:", err);
          const cleanList = Array.from(this.localFallbackUsers.values()).filter(
            (u) => !this.isPurgedUser(u)
          );
          callback(cleanList);
        }
      );
      return () => {
        unsub();
        this.userListeners = this.userListeners.filter((cb) => cb !== callback);
      };
    } catch (err) {
      console.warn("Firestore subscribeUsers fallback:", err);
      return () => {
        this.userListeners = this.userListeners.filter((cb) => cb !== callback);
      };
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
      await setDoc(userRef, {
        avatarUrl: avatarUrl,
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore updateUserAvatar fallback:", err);
    }
  }

  public async updateAvatarAndStatus(
    userId: string,
    avatarUrl: string,
    customStatus?: string,
    avatarDecoration?: string
  ): Promise<void> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (existing) {
      existing.avatarUrl = avatarUrl;
      if (customStatus !== undefined) existing.customStatus = customStatus;
      if (avatarDecoration !== undefined) existing.avatarDecoration = avatarDecoration;
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      const updateData: Record<string, any> = {
        avatarUrl: avatarUrl,
        lastSeen: Date.now(),
      };
      if (customStatus !== undefined) updateData.customStatus = customStatus;
      if (avatarDecoration !== undefined) updateData.avatarDecoration = avatarDecoration;
      await setDoc(userRef, updateData, { merge: true });
    } catch (err) {
      console.warn("Firestore updateAvatarAndStatus fallback:", err);
    }
  }

  // --- Tooth Points & Avatar Decorations Economy ---
  public async addPoints(userId: string, amount: number): Promise<number> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    const currentPoints = existing?.points ?? 150;
    const newPoints = Math.max(0, currentPoints + amount);

    if (existing) {
      existing.points = newPoints;
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        points: newPoints,
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore addPoints fallback:", err);
    }
    return newPoints;
  }

  /**
   * Records a user sending a message.
   * Awards +10 base ToothPoints.
   * Every 100 messages milestone awards +1,000 bonus ToothPoints!
   */
  public async recordUserMessageSent(
    userId: string
  ): Promise<{ newBalance: number; milestoneReached: boolean; totalMessages: number }> {
    const existing = this.localFallbackUsers.get(userId);
    const currentCount = (existing?.totalMessagesSent || 0) + 1;
    const currentPoints = existing?.points ?? 150;

    let pointsToAdd = 10;
    let milestoneReached = false;

    if (currentCount % 100 === 0) {
      milestoneReached = true;
      pointsToAdd += 1000;
    }

    const newPoints = currentPoints + pointsToAdd;

    if (existing) {
      existing.totalMessagesSent = currentCount;
      existing.points = newPoints;
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        totalMessagesSent: currentCount,
        points: newPoints,
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore recordUserMessageSent fallback:", err);
    }

    return {
      newBalance: newPoints,
      milestoneReached,
      totalMessages: currentCount,
    };
  }

  public async redeemPromoCode(
    userId: string,
    code: string
  ): Promise<{ success: boolean; message: string; pointsAdded?: number; newBalance?: number }> {
    const cleanCode = code.trim().toUpperCase();

    // Secret VIP Developer & Community Promo Codes
    const VIP_SECRET_CODES: Record<string, number> = {
      "CFX-ROOT-TOOTH": 500000,
      "TOOTH-CFX-MASTER": 1000000,
      "SEKRETNYZABEK": 50000,
      "CFX-VIP-UNLIMITED": 999999,
      "ADMIN-CFX-2026": 777777,
      "CFX123": 100000,
      "CFX": 500000,
      "TOOTH-RICH-777": 50000,
      "DENTAL-LEGEND": 25000,
      "CYBER-TOOTH": 10000,
      "TOOTH-ADMIN-777": 99999,
      "DENTIST-VIP": 15000,
      "DIAMOND-SMILE": 5000,
      "TOOTH2026": 20000,
      "ZABEK100": 10000,
      "SUPERZABEK": 30000,
      "PROMO2026": 25000,
      "TOOTH": 15000,
      "DENTIST": 20000,
    };

    if (!VIP_SECRET_CODES[cleanCode]) {
      return {
        success: false,
        message: "Nieprawidłowy kod promocyjny. Sprawdź poprawność wpisanego kodu.",
      };
    }

    const reward = VIP_SECRET_CODES[cleanCode];
    const newBalance = await this.addPoints(userId, reward);
    return {
      success: true,
      message: `🎉 Sukces! Pomyślnie aktywowano kod i dodano +${reward.toLocaleString()} ToothPoints do Twojego konta!`,
      pointsAdded: reward,
      newBalance,
    };
  }

  public async unlockDecoration(
    userId: string,
    decorationId: string,
    cost: number
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    const existing = this.localFallbackUsers.get(userId);
    const currentPoints = existing?.points ?? 150;
    const unlocked = existing?.unlockedDecorations || [];

    if (unlocked.includes(decorationId)) {
      return { success: true, message: "Ozdoba jest już odblokowana!", newBalance: currentPoints };
    }

    if (currentPoints < cost) {
      return {
        success: false,
        message: `Masz za mało punktów! Potrzebujesz ${cost} 🦷, a masz ${currentPoints} 🦷. Pisz wiadomości lub użyj kodu!`,
      };
    }

    const newPoints = currentPoints - cost;
    const newUnlocked = [...unlocked, decorationId];

    if (existing) {
      existing.points = newPoints;
      existing.unlockedDecorations = newUnlocked;
      existing.avatarDecoration = decorationId;
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        points: newPoints,
        unlockedDecorations: newUnlocked,
        avatarDecoration: decorationId,
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore unlockDecoration fallback:", err);
    }

    return {
      success: true,
      message: "✨ Odblokowano i założono nową ozdobę profilu!",
      newBalance: newPoints,
    };
  }

  public async setAvatarDecoration(userId: string, decorationId: string | null): Promise<void> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (existing) {
      existing.avatarDecoration = decorationId || "";
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        avatarDecoration: decorationId || "",
        lastSeen: Date.now(),
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore setAvatarDecoration fallback:", err);
    }
  }

  public async updateCustomStatus(userId: string, customStatus: string): Promise<void> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (existing) {
      existing.customStatus = customStatus;
      existing.lastSeen = Date.now();
    }

    try {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        customStatus: customStatus,
        lastSeen: Date.now(),
      }, { merge: true });
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
        const u = snap.data() as UserIdentity;
        this.localFallbackUsers.set(u.id, u);
        return u;
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
        snap.forEach((d) => {
          const u = d.data() as UserIdentity;
          if (u && u.id && !this.isPurgedUser(u)) {
            list.push(u);
            this.localFallbackUsers.set(u.id, u);
          }
        });
        for (const key of Array.from(this.localFallbackUsers.keys())) {
          const userVal = this.localFallbackUsers.get(key);
          if (this.isPurgedUser(userVal)) {
            this.localFallbackUsers.delete(key);
          }
        }
        return Array.from(this.localFallbackUsers.values()).filter(
          (u) => !this.isPurgedUser(u)
        );
      }
    } catch (err) {
      console.warn("Firestore getAllUsers fallback:", err);
    }
    return Array.from(this.localFallbackUsers.values()).filter(
      (u) => !this.isPurgedUser(u)
    );
  }

  // --- Servers & Channels Management ---
  private localServers: ServerGuild[] = [
    {
      id: "srv_tooth_hq",
      name: "ToothChat HQ",
      icon: "🦷",
      ownerId: "usr_cfx_admin",
      memberIds: ["usr_cfx_admin", "usr_bob", "usr_carol", "usr_dave"],
      roles: {
        usr_cfx_admin: "admin",
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
      ownerId: "usr_cfx_admin",
      memberIds: ["usr_cfx_admin", "usr_bob", "usr_carol", "usr_dave"],
      roles: {
        usr_cfx_admin: "admin",
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
      // Only auto-add currentUser to starter server srv_tooth_hq if desired, but NOT to private custom user servers
      if (s.id === "srv_tooth_hq" && currentUserId && !memberIds.includes(currentUserId)) {
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

    // If currentUserId is passed, only return servers the user belongs to (or starter server)
    if (currentUserId) {
      return list.filter(
        (s) => s.id === "srv_tooth_hq" || (s.memberIds && s.memberIds.includes(currentUserId))
      );
    }

    return list;
  }

  public getAllServersGlobal(): ServerGuild[] {
    return this.localServers;
  }

  public subscribeServers(currentUserId: string | undefined, callback: (servers: ServerGuild[]) => void): () => void {
    this.trackRead(1);
    try {
      const q = collection(db, "servers");
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          this.trackRead(snapshot.docs.length || 1);
          if (!snapshot.empty) {
            const list: ServerGuild[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as ServerGuild;
              if (data && data.id) {
                list.push(data);
              }
            });
            if (list.length > 0) {
              // Ensure default starter is included if not in snapshot
              const hasStarter = list.some((s) => s.id === "srv_tooth_hq");
              let combined = list;
              if (!hasStarter) {
                const starter = this.getServers(currentUserId).find((s) => s.id === "srv_tooth_hq");
                if (starter) combined = [starter, ...list];
              }
              this.localServers = combined;
              try {
                localStorage.setItem("toothchat_saved_servers", JSON.stringify(combined));
              } catch {}

              // Filter for current user only
              const userVisible = currentUserId
                ? combined.filter(
                    (s) =>
                      s.id === "srv_tooth_hq" ||
                      (s.memberIds && s.memberIds.includes(currentUserId))
                  )
                : combined;

              callback(userVisible);
              return;
            }
          }
          callback(this.getServers(currentUserId));
        },
        (err) => {
          console.warn("Firestore subscribeServers fallback to local:", err);
          callback(this.getServers(currentUserId));
        }
      );
      return unsub;
    } catch (e) {
      console.warn("subscribeServers error, using local fallback:", e);
      callback(this.getServers(currentUserId));
      return () => {};
    }
  }

  public async inviteUserToServer(serverId: string, targetUserId: string): Promise<ServerGuild | null> {
    this.trackWrite(1);
    let target: ServerGuild | null = null;

    try {
      const srvRef = doc(db, "servers", serverId);
      const snap = await getDoc(srvRef);
      if (snap.exists()) {
        target = snap.data() as ServerGuild;
      }
    } catch (err) {
      console.warn("Firestore inviteUserToServer getDoc fallback:", err);
    }

    if (!target) {
      target = this.localServers.find((s) => s.id === serverId) || null;
    }

    if (target) {
      const currentMembers = target.memberIds || [];
      if (!currentMembers.includes(targetUserId)) {
        target.memberIds = [...currentMembers, targetUserId];
      }
      if (!target.roles) target.roles = {};
      if (!target.roles[targetUserId]) {
        target.roles[targetUserId] = "member";
      }

      try {
        const srvRef = doc(db, "servers", serverId);
        await setDoc(srvRef, target, { merge: true });

        // Update local list
        this.localServers = this.localServers.map((s) => (s.id === serverId ? target! : s));
        localStorage.setItem("toothchat_saved_servers", JSON.stringify(this.localServers));
      } catch (err) {
        console.warn("Firestore inviteUserToServer save fallback:", err);
      }
      return target;
    }
    return null;
  }

  public async joinServerByCode(codeOrId: string, userId: string): Promise<ServerGuild | null> {
    this.trackWrite(1);
    let cleanQuery = codeOrId.trim();

    // Support invite URLs e.g. https://toothchat.app/join/srv_12345 or /join/srv_12345
    if (cleanQuery.includes("/join/")) {
      cleanQuery = cleanQuery.split("/join/")[1].split("/")[0].split("?")[0].trim();
    }

    const lower = cleanQuery.toLowerCase();
    
    // 1. Search in local memory / cache
    let found = this.localServers.find(
      (s) =>
        s.id.toLowerCase() === lower ||
        s.name.toLowerCase() === lower ||
        s.id.toLowerCase().endsWith(lower) ||
        `tooth-${s.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-6)}`.toLowerCase() === lower
    );

    // 2. If not found locally, query Firestore collection "servers"
    if (!found) {
      try {
        // Try direct ID lookup
        const srvRef = doc(db, "servers", cleanQuery);
        const snap = await getDoc(srvRef);
        if (snap.exists()) {
          found = snap.data() as ServerGuild;
        }
      } catch {}
    }

    if (!found) {
      try {
        // Try query all servers in Firestore
        const serversCol = collection(db, "servers");
        const snap = await getDocs(serversCol);
        snap.forEach((d) => {
          const s = d.data() as ServerGuild;
          if (
            s.id.toLowerCase() === lower ||
            s.name.toLowerCase() === lower ||
            s.id.toLowerCase().endsWith(lower) ||
            `tooth-${s.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-6)}`.toLowerCase() === lower
          ) {
            found = s;
          }
        });
      } catch (e) {
        console.warn("Firestore query servers error:", e);
      }
    }

    if (found) {
      return await this.inviteUserToServer(found.id, userId);
    }
    return null;
  }

  public async createServer(server: ServerGuild): Promise<ServerGuild[]> {
    this.trackWrite(1);
    const current = this.localServers;
    const updated = [...current.filter((s) => s.id !== server.id), server];
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
        recipientId: payload.recipientId || "",
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

  public subscribeIncomingDirectMessages(
    userId: string,
    callback: (senderIds: string[]) => void
  ): () => void {
    let unsubFirestore: Unsubscribe | null = null;
    try {
      const q = query(
        collection(db, "channel_messages"),
        where("recipientId", "==", userId)
      );

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          this.trackRead(snapshot.docChanges().length || 1);
          const senders = new Set<string>();
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            if (data.senderId && data.senderId !== userId) {
              senders.add(data.senderId);
            }
          });
          callback(Array.from(senders));
        },
        (error) => {
          console.warn("Firestore subscribeIncomingDirectMessages fallback:", error);
        }
      );
    } catch (err) {
      console.warn("Firestore subscribeIncomingDirectMessages error:", err);
    }

    return () => {
      if (unsubFirestore) unsubFirestore();
    };
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
  // --- WebRTC ICE Candidate Trickle Signaling ---
  public async addCallCandidate(
    callId: string,
    role: "caller" | "receiver",
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    this.trackWrite(1);
    try {
      const candId = `cand_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const candRef = doc(db, "calls", callId, `${role}_candidates`, candId);
      await setDoc(candRef, {
        candidate,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn("Firestore addCallCandidate fallback:", err);
    }
  }

  public subscribeCallCandidates(
    callId: string,
    role: "caller" | "receiver",
    callback: (candidates: RTCIceCandidateInit[]) => void
  ): () => void {
    let unsub: Unsubscribe | null = null;
    try {
      const colRef = collection(db, "calls", callId, `${role}_candidates`);
      unsub = onSnapshot(colRef, (snapshot) => {
        this.trackRead(snapshot.docs.length || 1);
        const list: RTCIceCandidateInit[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && data.candidate) list.push(data.candidate);
        });
        callback(list);
      });
    } catch (err) {
      console.warn("Firestore subscribeCallCandidates fallback:", err);
    }

    return () => {
      if (unsub) unsub();
    };
  }

  // ==========================================
  // --- MASTER GLOBAL ADMIN PANEL METHODS ---
  // ==========================================

  /**
   * Delete an entire server globally across Firestore and local storage
   */
  public async deleteServerGlobal(serverId: string): Promise<ServerGuild[]> {
    this.trackDelete(1);
    const servers = this.getServers();
    const filtered = servers.filter((s) => s.id !== serverId);
    this.localServers = filtered;

    try {
      localStorage.setItem("toothchat_saved_servers", JSON.stringify(filtered));
      const srvRef = doc(db, "servers", serverId);
      await deleteDoc(srvRef);
    } catch (err) {
      console.warn("Firestore deleteServerGlobal fallback:", err);
    }
    return [...filtered];
  }

  /**
   * Delete a user account globally across database, local fallback, and all servers
   */
  public async deleteUserAccountGlobal(userId: string): Promise<UserIdentity[]> {
    this.trackDelete(1);
    // 1. Mark as permanently deleted
    this.deletedUserIds.add(userId);
    try {
      localStorage.setItem(
        "toothchat_deleted_users",
        JSON.stringify(Array.from(this.deletedUserIds))
      );
    } catch {}

    // 2. Remove from local users cache
    this.localFallbackUsers.delete(userId);

    // 3. Delete user doc from Firestore
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
    } catch (err) {
      console.warn("Firestore deleteUserAccountGlobal (delete user) fallback:", err);
    }

    // 4. Remove user from all servers (memberIds and roles)
    try {
      const servers = this.getAllServersGlobal();
      const updatedServers = servers.map((srv) => {
        const newMemberIds = (srv.memberIds || []).filter((id) => id !== userId);
        const newRoles = { ...(srv.roles || {}) };
        delete newRoles[userId];
        return {
          ...srv,
          memberIds: newMemberIds,
          roles: newRoles,
        };
      });

      this.localServers = updatedServers;
      localStorage.setItem("toothchat_saved_servers", JSON.stringify(updatedServers));

      // Update Firestore servers
      for (const srv of updatedServers) {
        try {
          const srvRef = doc(db, "servers", srv.id);
          await updateDoc(srvRef, {
            memberIds: srv.memberIds,
            roles: srv.roles,
          });
        } catch (sErr) {
          console.warn(`Firestore remove user from server ${srv.id} error:`, sErr);
        }
      }
    } catch (srvErr) {
      console.warn("Firestore delete user from servers fallback:", srvErr);
    }

    // 5. Remove messages sent by this user from local messages cache
    this.localFallbackMessages.forEach((msgs, chnId) => {
      this.localFallbackMessages.set(
        chnId,
        msgs.filter((m) => m.senderId !== userId && (m as any).recipientId !== userId)
      );
    });

    const cleanUsers = Array.from(this.localFallbackUsers.values()).filter(
      (u) => !this.isPurgedUser(u)
    );

    // 6. Notify active listeners
    this.userListeners.forEach((cb) => {
      try {
        cb(cleanUsers);
      } catch (cbErr) {
        console.warn("User listener callback error:", cbErr);
      }
    });

    return cleanUsers;
  }

  /**
   * Update user details globally (as admin)
   */
  public async adminUpdateUser(
    userId: string,
    updates: Partial<UserIdentity>
  ): Promise<UserIdentity | null> {
    this.trackWrite(1);
    const existing = this.localFallbackUsers.get(userId);
    if (!existing) return null;

    const updatedUser = { ...existing, ...updates };
    this.localFallbackUsers.set(userId, updatedUser);

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, updates);
    } catch (err) {
      console.warn("Firestore adminUpdateUser fallback:", err);
    }

    return updatedUser;
  }

  /**
   * Fetch all messages across all channels for moderation
   */
  public async getAllMessagesGlobal(maxLimit = 100): Promise<EncryptedMessagePayload[]> {
    this.trackRead(1);
    const allMsgs: EncryptedMessagePayload[] = [];

    // Combine local fallback messages
    this.localFallbackMessages.forEach((msgs) => {
      allMsgs.push(...msgs);
    });

    try {
      const q = query(
        collection(db, "channel_messages"),
        orderBy("timestamp", "desc"),
        limit(maxLimit)
      );
      const snap = await getDocs(q);
      snap.forEach((doc) => {
        const data = doc.data() as any;
        const textContent = data.text || data.content || data.decryptedText || data.ciphertext || "";
        allMsgs.push({
          id: data.id || doc.id,
          channelId: data.channelId,
          serverId: data.serverId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderPublicKey: data.senderPublicKey || "",
          ciphertext: data.ciphertext || "",
          iv: data.iv || "",
          keyFingerprint: data.keyFingerprint || "",
          text: textContent,
          decryptedText: textContent,
          timestamp: data.timestamp || Date.now(),
        });
      });
    } catch (err) {
      console.warn("Firestore getAllMessagesGlobal query error:", err);
    }

    // Deduplicate by ID and sort descending
    const unique = new Map<string, EncryptedMessagePayload>();
    allMsgs.forEach((m) => unique.set(m.id, m));
    return Array.from(unique.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Global message deletion for Admin
   */
  public async deleteMessageGlobal(messageId: string, channelId?: string): Promise<void> {
    this.trackDelete(1);
    if (channelId) {
      const list = this.localFallbackMessages.get(channelId) || [];
      this.localFallbackMessages.set(channelId, list.filter((m) => m.id !== messageId));
    } else {
      this.localFallbackMessages.forEach((list, chId) => {
        this.localFallbackMessages.set(chId, list.filter((m) => m.id !== messageId));
      });
    }

    try {
      const msgRef = doc(db, "channel_messages", messageId);
      await deleteDoc(msgRef);
    } catch (err) {
      console.warn("Firestore deleteMessageGlobal fallback:", err);
    }
  }
}

export const firestoreService = new RealFirestoreEngine();
