/**
 * Core Type Definitions for ZeroCord: E2EE Discord-like WebRTC & Firestore Messenger
 */

export interface UserIdentity {
  id: string; // Unique User ID (e.g. usr_8f9a2b...)
  displayName: string;
  email?: string;
  emailVerified?: boolean;
  role?: "superadmin" | "admin" | "user"; // Global admin rights
  avatarUrl?: string; // Custom uploaded avatar base64 or URL
  avatarDecoration?: string; // ID of equipped animated avatar decoration (e.g. "fire_flames", "neon_cyber")
  unlockedDecorations?: string[]; // Array of unlocked decoration IDs
  points?: number; // Tooth Points (Punkty Zębów) earned by sending messages / promo codes
  totalMessagesSent?: number; // Total messages sent counter for 1000pts/100msg bonus
  customStatus?: string; // Custom status message (e.g. "Gra w ToothChat", "Zarobiony")
  tokenHash: string; // SHA-256 hash of stateless master token stored in Firestore
  publicKeySpki: string; // Base64 encoded ECDH P-256 Public Key (SPKI)
  signingPublicKeySpki?: string; // Ed25519 / ECDSA Public Key for message signatures
  avatarColor: string;
  status: "online" | "idle" | "dnd" | "offline";
  createdAt: number;
  lastSeen: number;
}

export interface LocalCryptoKeys {
  rawToken: string; // Stateless master secret generated on client (NEVER stored on server)
  tokenHash: string; // SHA-256(rawToken)
  ecdhKeyPair: CryptoKeyPair;
  publicKeyBase64: string;
  privateKeyBase64: string;
}

export interface EncryptedMessagePayload {
  id: string;
  channelId: string;
  serverId?: string; // Optional if direct message
  senderId: string;
  senderName: string;
  senderPublicKey: string; // Ephemeral or identity public key (SPKI base64)
  senderAvatarUrl?: string; // Uploaded custom avatar
  senderAvatarDecoration?: string; // Equipped animated avatar decoration ID
  senderAvatarColor?: string; // Custom avatar fallback background color
  recipientId?: string; // For 1-on-1 direct messages
  ciphertext: string; // Base64 ciphertext produced by AES-256-GCM
  iv: string; // 12-byte initialization vector (Base64)
  authTag?: string; // Included in standard AES-GCM ciphertext or separated
  keyFingerprint: string; // SHA-256 preview of key used
  timestamp: number;
  text?: string;
  content?: string;
  // Local client-side decrypted cache (NEVER written to Firestore)
  decryptedText?: string;
  decryptionFailed?: boolean;
}

export interface ServerChannel {
  id: string;
  serverId: string;
  name: string;
  type: "text" | "voice";
  topic?: string;
  isEncrypted: boolean;
  ratchetVersion: number;
}

export type ServerRole = "admin" | "support" | "member";

export interface ServerGuild {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  roles?: Record<string, ServerRole>; // userId -> role ("admin" | "support" | "member")
  mutedUserIds?: string[]; // User IDs muted on this server
  timeouts?: Record<string, number>; // userId -> timestamp until timeout expires
  channels: ServerChannel[];
  groupSharedKeyCiphertext?: Record<string, string>; // userId -> encrypted group secret
  createdAt: number;
}

export interface DirectChatSession {
  id: string;
  participantIds: [string, string];
  participants: UserIdentity[];
  lastMessageTimestamp: number;
  unreadCount?: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderPublicKey: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  timestamp: number;
}

// WebRTC 1-on-1 Signaling Models for Firestore
export interface CallSession {
  id: string;
  callerId: string;
  callerName: string;
  callerPublicKey: string;
  receiverId: string;
  receiverName: string;
  status: "calling" | "connected" | "ended" | "rejected";
  type: "video" | "voice";
  offer?: {
    type: "offer";
    sdp: string;
  };
  answer?: {
    type: "answer";
    sdp: string;
  };
  iceCandidates?: any[];
  createdAt: number;
  connectedAt?: number;
}

export interface IceCandidatePayload {
  id?: string;
  candidate: RTCIceCandidateInit;
  peerId: string;
  type: "caller" | "receiver";
  timestamp: number;
}

// WebRTC Mesh Voice Room Signaling Models for Firestore
export interface MeshPeerSignal {
  peerId: string;
  peerName: string;
  peerPublicKey: string;
  roomId: string;
  audioMuted: boolean;
  videoEnabled: boolean;
  joinedAt: number;
  lastHeartbeat: number;
  sdpOffers?: Record<string, { sdp: string; type: "offer" }>; // targetPeerId -> Offer
  sdpAnswers?: Record<string, { sdp: string; type: "answer" }>; // targetPeerId -> Answer
  iceCandidates?: Record<string, RTCIceCandidateInit[]>; // targetPeerId -> Candidates
}

// Gemini AI Insights
export interface GeminiSummaryResult {
  summary: string;
  actionItems?: string[];
  sentiment?: string;
  isSimulated?: boolean;
}

export interface FirestoreQuotaStats {
  reads: number;
  writes: number;
  deletes: number;
  estimatedSparkCost: string;
}
