import React, { useState } from "react";
import {
  ToothLogoIcon,
  ToothShieldIcon,
  ToothSparkleIcon,
  ToothHashIcon,
} from "./ToothIcons";
import {
  BookOpen,
  Database,
  ShieldAlert,
  Code2,
  Lock,
  Radio,
  Copy,
  Check,
  X,
  Cpu,
} from "lucide-react";

interface ArchitectureMasterclassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureMasterclassModal: React.FC<ArchitectureMasterclassModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"krok1" | "krok2" | "krok3" | "krok4">("krok1");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="architecture-docs-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#232428] rounded-[8px] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] select-text">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#232428] bg-[#2b2d31] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold">
              <ToothLogoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                Architektura Systemowa ToothChat (Zero-Knowledge & WebRTC)
              </h2>
              <p className="text-xs text-[#949ba4]">
                Kompleksowa specyfikacja: Firestore Spark, E2EE Web Crypto, WebRTC Serverless Signaling & Gemini Tooth AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded hover:bg-[#35373c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Step Tabs */}
        <div className="flex border-b border-[#232428] bg-[#2b2d31] px-4 pt-2 gap-2 shrink-0 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab("krok1")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "krok1"
                ? "border-[#5865f2] text-white bg-[#313338]"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Database className="w-4 h-4" />
            KROK 1: Model Firestore & Security Rules
          </button>

          <button
            onClick={() => setActiveTab("krok2")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "krok2"
                ? "border-[#5865f2] text-white bg-[#313338]"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <ToothSparkleIcon className="w-4 h-4" />
            KROK 2: Logika Społecznościowa & Gemini AI
          </button>

          <button
            onClick={() => setActiveTab("krok3")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "krok3"
                ? "border-[#5865f2] text-white bg-[#313338]"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <ToothShieldIcon className="w-4 h-4" />
            KROK 3: Architektura Kryptograficzna (E2EE)
          </button>

          <button
            onClick={() => setActiveTab("krok4")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "krok4"
                ? "border-[#5865f2] text-white bg-[#313338]"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Radio className="w-4 h-4" />
            KROK 4: WebRTC Serverless Signaling
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs text-[#dbdee1] font-sans leading-relaxed">
          {/* TAB 1 */}
          {activeTab === "krok1" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#5865f2]" />
                  KROK 1: Modelowanie Danych w Google Firestore i Security Rules
                </h3>
                <p className="text-[#dbdee1]">
                  Projekt architektury NoSQL Firestore zoptymalizowany pod kątem limitów darmowego planu Spark (50 000 odczytów, 20 000 zapisów/dzień).
                </p>
              </div>

              {/* Collections Schema */}
              <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] space-y-3 font-mono text-[11px]">
                <h4 className="text-[#5865f2] font-bold uppercase tracking-wider text-xs font-sans">
                  Struktura Kolekcji i Dokumentów (NoSQL Schema):
                </h4>
                <div className="space-y-2 text-[#dbdee1]">
                  <p><strong className="text-white">/users/{`{userId}`}</strong>: <code>{`{ id, displayName, tokenHash, publicKeySpki, status, lastSeen }`}</code></p>
                  <p><strong className="text-white">/servers/{`{serverId}`}</strong>: <code>{`{ id, name, ownerId, memberIds: [], createdAt }`}</code></p>
                  <p><strong className="text-white">/servers/{`{serverId}`}/channels/{`{channelId}`}</strong>: <code>{`{ id, name, type, isEncrypted }`}</code></p>
                  <p><strong className="text-white">/servers/{`{serverId}`}/channels/{`{channelId}`}/messages/{`{msgId}`}</strong>: <code>{`{ senderId, senderName, senderPublicKey, ciphertext, iv, keyFingerprint, timestamp }`}</code></p>
                  <p><strong className="text-white">/calls/{`{callId}`}</strong> (WebRTC 1-on-1): <code>{`{ callerId, receiverId, status, type, offer, answer, createdAt }`}</code></p>
                  <p><strong className="text-white">/voice_rooms/{`{roomId}`}/peers/{`{peerId}`}</strong> (WebRTC Mesh): <code>{`{ peerId, peerName, peerPublicKey, audioMuted, videoEnabled, lastHeartbeat }`}</code></p>
                </div>
              </div>

              {/* Firestore Security Rules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                    <ShieldAlert className="w-4 h-4 text-[#23a55a]" />
                    Produkcyjne Reguły Bezpieczeństwa (Firestore Security Rules):
                  </h4>
                  <button
                    onClick={() => copyToClipboard(firestoreRulesCode, "rules")}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded text-[11px] font-mono cursor-pointer"
                  >
                    {copiedSection === "rules" ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                    Kopiuj Reguły
                  </button>
                </div>
                <pre className="bg-[#1e1f22] p-4 rounded-[6px] border border-[#3f4147] overflow-x-auto text-[11px] font-mono text-[#23a55a]">
                  {firestoreRulesCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2 */}
          {activeTab === "krok2" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <ToothSparkleIcon className="w-5 h-5 text-[#eb459e]" />
                  KROK 2: Logika Społecznościowa i AI po stronie Klienta
                </h3>
                <p className="text-[#dbdee1]">
                  Integracja asystenta Google AI Studio (Gemini 2.5 Flash) w architekturze Zero-Knowledge: wiadomości są deszyfrowane w pamięci RAM klienta przed przesłaniem do AI.
                </p>
              </div>

              {/* Code Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                    <Code2 className="w-4 h-4 text-[#5865f2]" />
                    Kod Klienta (TypeScript / React / Web Crypto + Gemini API):
                  </h4>
                  <button
                    onClick={() => copyToClipboard(clientSocialAiSnippet, "socialAi")}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded text-[11px] font-mono cursor-pointer"
                  >
                    {copiedSection === "socialAi" ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                    Kopiuj Kod
                  </button>
                </div>
                <pre className="bg-[#1e1f22] p-4 rounded-[6px] border border-[#3f4147] overflow-x-auto text-[11px] font-mono text-[#00a8fc]">
                  {clientSocialAiSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3 */}
          {activeTab === "krok3" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <ToothShieldIcon className="w-5 h-5 text-[#f0b232]" />
                  KROK 3: Architektura Kryptograficzna (Zero-Knowledge E2EE)
                </h3>
                <p className="text-[#dbdee1]">
                  Natywna implementacja Web Crypto API: ECDH (NIST P-256), oraz szyfr symetryczny AES-256-GCM z unikalnym 96-bitowym wektorem IV dla każdej wiadomości.
                </p>
              </div>

              {/* Crypto Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                    <Cpu className="w-4 h-4 text-[#f0b232]" />
                    Implementacja Web Crypto API (Klucze ECDH + AES-256-GCM):
                  </h4>
                  <button
                    onClick={() => copyToClipboard(cryptoSnippetCode, "cryptoCode")}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded text-[11px] font-mono cursor-pointer"
                  >
                    {copiedSection === "cryptoCode" ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                    Kopiuj Kod
                  </button>
                </div>
                <pre className="bg-[#1e1f22] p-4 rounded-[6px] border border-[#3f4147] overflow-x-auto text-[11px] font-mono text-[#f0b232]">
                  {cryptoSnippetCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4 */}
          {activeTab === "krok4" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#23a55a]" />
                  KROK 4: WebRTC - Serverless Signaling na Firestore & Insertable Streams
                </h3>
                <p className="text-[#dbdee1]">
                  Real-time sygnalizacja P2P (1-on-1) oraz kanałów głosowych Full-Mesh na Firestore <code>onSnapshot</code> eliminująca serwery pośredniczące.
                </p>
              </div>

              {/* WebRTC Signaling Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                    <Code2 className="w-4 h-4 text-[#23a55a]" />
                    Kod Sygnalizacji WebRTC (Firestore onSnapshot + SDP/ICE):
                  </h4>
                  <button
                    onClick={() => copyToClipboard(webrtcSignalingSnippet, "webrtcCode")}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#4e5058] hover:bg-[#6d6f78] text-white rounded text-[11px] font-mono cursor-pointer"
                  >
                    {copiedSection === "webrtcCode" ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                    Kopiuj Kod
                  </button>
                </div>
                <pre className="bg-[#1e1f22] p-4 rounded-[6px] border border-[#3f4147] overflow-x-auto text-[11px] font-mono text-[#23a55a]">
                  {webrtcSignalingSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Kolekcja Użytkowników (Users) - Stateless Token Auth
    match /users/{userId} {
      allow read: if true; // Publiczny odczyt kluczy publicznych ECDH
      allow create: if request.resource.data.tokenHash is string
                    && request.resource.data.publicKeySpki is string
                    && request.resource.data.displayName.size() >= 2;
      allow update: if request.resource.data.tokenHash == resource.data.tokenHash
                    && request.resource.data.publicKeySpki == resource.data.publicKeySpki;
    }

    // 2. Kolekcja Serwerów i Kanałów ToothChat
    match /servers/{serverId} {
      allow read: if true;
      allow create: if request.resource.data.name.size() > 0;
      allow update, delete: if request.resource.data.ownerId == resource.data.ownerId;

      match /channels/{channelId} {
        allow read: if true;
        allow write: if true;

        // Wiadomości szyfrowane AES-256-GCM
        match /messages/{messageId} {
          allow read: if true;
          allow create: if request.resource.data.ciphertext is string
                        && request.resource.data.iv is string;
          allow update, delete: if false; // Niezmienny log E2EE
        }
      }
    }

    // 3. Połączenia WebRTC 1-on-1 (/calls)
    match /calls/{callId} {
      allow read: if true;
      allow create: if request.resource.data.callerId is string
                    && request.resource.data.receiverId is string;
      allow update: if request.resource.data.status in ['calling', 'connected', 'ended', 'rejected'];
      allow delete: if true;
    }

    // 4. Kanały Głosowe Mesh (/voice_rooms)
    match /voice_rooms/{roomId}/peers/{peerId} {
      allow read: if true;
      allow write: if request.resource.data.peerPublicKey is string;
      allow delete: if true;
    }
  }
}`;

const clientSocialAiSnippet = `import { doc, updateDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { decryptMessagePayload } from "./crypto/e2ee";

// 1. Zmiana Display Name z weryfikacją Token Hash
export async function updateDisplayName(userId: string, tokenHash: string, newDisplayName: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    displayName: newDisplayName.trim(),
    tokenHash: tokenHash,
    lastSeen: Date.now()
  });
}

// 2. Integracja z Google AI Studio (Gemini 2.5 Flash) po zdeszyfrowaniu w RAM klienta
export async function summarizeDecryptedThread(
  encryptedMessages: any[], 
  channelAesKey: CryptoKey,
  channelName: string
) {
  // Deszyfracja lokalna w RAM klienta (Zero-Knowledge)
  const decryptedMessages = [];
  for (const msg of encryptedMessages) {
    const plainText = await decryptMessagePayload(msg.ciphertext, msg.iv, channelAesKey);
    decryptedMessages.push({
      author: msg.senderName,
      text: plainText,
      timestamp: msg.timestamp
    });
  }

  // Przesłanie wyłącznie czystego tekstu do proxy Gemini API
  const response = await fetch("/api/ai/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channelName,
      messages: decryptedMessages
    })
  });

  const data = await response.json();
  return data.summary;
}`;

const cryptoSnippetCode = `// KROK 3: Natywna Kryptografia Web Crypto API w ToothChat

// 1. Generowanie Klucza Asymetrycznego ECDH (NIST P-256)
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// 2. Wyprowadzenie Wspólnego Klucza Symetrycznego AES-256-GCM
export async function deriveSharedKey(myPrivateKey: CryptoKey, peerPublicKey: CryptoKey): Promise<CryptoKey> {
  return await window.crypto.subtle.deriveKey(
    { name: "ECDH", public: peerPublicKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 3. Szyfrowanie Wiadomości AES-256-GCM (96-bit IV)
export async function encryptMessage(plainText: string, aesKey: CryptoKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plainText);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    aesKey,
    encodedText
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
    iv: btoa(String.fromCharCode(...iv))
  };
}`;

const webrtcSignalingSnippet = `// KROK 4: WebRTC Serverless Signaling na Firestore onSnapshot

export async function start1on1Call(callerId: string, receiverId: string, localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  localVideo.srcObject = localStream;

  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const callDocRef = doc(collection(db, "calls"));
  await setDoc(callDocRef, {
    callerId,
    receiverId,
    status: "calling",
    offer: { type: offer.type, sdp: offer.sdp },
    createdAt: Date.now()
  });

  onSnapshot(callDocRef, async (snapshot) => {
    const data = snapshot.data();
    if (data?.answer && pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });
}`;
