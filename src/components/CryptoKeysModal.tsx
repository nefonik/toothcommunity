import React, { useState } from "react";
import {
  ToothShieldIcon,
  ToothLogoIcon,
  ToothGearIcon,
} from "./ToothIcons";
import {
  KeyRound,
  Shield,
  Copy,
  Check,
  Binary,
  X,
  Lock,
  Unlock,
  RefreshCw,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { UserIdentity } from "../types";
import {
  encryptMessagePayload,
  decryptMessagePayload,
  generateGroupChannelKey,
} from "../crypto/e2ee";

interface CryptoKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserIdentity;
  rawToken: string;
}

export const CryptoKeysModal: React.FC<CryptoKeysModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  rawToken,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Interactive Crypto Lab State
  const [labPlainText, setLabPlainText] = useState("Ściśle tajna wiadomość E2EE: ToothChat Web Crypto API");
  const [labCiphertext, setLabCiphertext] = useState("");
  const [labIv, setLabIv] = useState("");
  const [labFingerprint, setLabFingerprint] = useState("");
  const [labDecryptedText, setLabDecryptedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunLabEncryption = async () => {
    try {
      setIsProcessing(true);
      const testKey = await generateGroupChannelKey();
      const enc = await encryptMessagePayload(labPlainText, testKey);
      setLabCiphertext(enc.ciphertext);
      setLabIv(enc.iv);
      setLabFingerprint(enc.keyFingerprint);

      // Decrypt test
      const dec = await decryptMessagePayload(enc.ciphertext, enc.iv, testKey);
      setLabDecryptedText(dec);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="crypto-keys-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#232428] rounded-[8px] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Discord Header */}
        <div className="p-4 border-b border-[#232428] bg-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#f0b232] text-[#1e1f22] flex items-center justify-center">
              <ToothShieldIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Kryptograficzny Skarbiec Tożsamości ToothChat
              </h3>
              <p className="text-xs text-[#949ba4]">
                Natywne Web Crypto API w Twojej przeglądarce (Zero-Knowledge AES-256-GCM / ECDH)
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs font-mono select-text">
          {/* Stateless Auth Concept Box */}
          <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] space-y-2">
            <div className="flex items-center gap-2 text-[#5865F2] font-bold text-sm font-sans">
              <Fingerprint className="w-4 h-4" />
              1. Autoryzacja Tokenowa (Stateless):
            </div>
            <p className="text-[#dbdee1] font-sans leading-relaxed text-xs">
              Brak tradycyjnych haseł i maili. System generuje unikalny token kryptograficzny. Baza danych Firestore przechowuje <strong className="text-[#23a55a]">wyłącznie hash SHA-256</strong> tego tokena.
            </p>

            <div className="space-y-2 pt-2">
              <div>
                <span className="text-[#f0b232] font-semibold block mb-1">
                  Tajny Master Token (Zapisany TYLKO w Twoim kliencie / RAM):
                </span>
                <div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded border border-[#3f4147] text-[#f0b232]">
                  <span className="truncate flex-1">{rawToken || "tooth_tok_demo_a1b2c3d4e5f67890"}</span>
                  <button
                    onClick={() => handleCopy(rawToken, "rawToken")}
                    className="p-1 text-[#949ba4] hover:text-white cursor-pointer"
                  >
                    {copiedField === "rawToken" ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[#23a55a] font-semibold block mb-1">
                  SHA-256 Hash Tokena (Przechowywany w Google Firestore):
                </span>
                <div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded border border-[#3f4147] text-[#23a55a]">
                  <span className="truncate flex-1">{currentUser.tokenHash}</span>
                  <button
                    onClick={() => handleCopy(currentUser.tokenHash, "tokenHash")}
                    className="p-1 text-[#949ba4] hover:text-white cursor-pointer"
                  >
                    {copiedField === "tokenHash" ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Asymmetric ECDH Keys */}
          <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] space-y-3">
            <div className="flex items-center gap-2 text-[#00a8fc] font-bold text-sm font-sans">
              <ToothShieldIcon className="w-4 h-4" />
              2. Asymetryczne Klucze ECDH (Krzywa Eliptyczna NIST P-256):
            </div>
            <p className="text-[#dbdee1] font-sans leading-relaxed text-xs">
              Klucz publiczny jest publikowany w Firestore, aby inni użytkownicy mogli wyliczyć wspólny sekret (Diffie-Hellman) i zaszyfrować wiadomości skierowane do Ciebie.
            </p>

            <div>
              <span className="text-[#00a8fc] font-semibold block mb-1">
                Klucz Publiczny ECDH (SPKI Base64):
              </span>
              <div className="flex items-center gap-2 bg-[#1e1f22] p-2 rounded border border-[#3f4147] text-[#00a8fc]">
                <span className="truncate flex-1">{currentUser.publicKeySpki}</span>
                <button
                  onClick={() => handleCopy(currentUser.publicKeySpki, "pubKey")}
                  className="p-1 text-[#949ba4] hover:text-white cursor-pointer"
                >
                  {copiedField === "pubKey" ? <Check className="w-3.5 h-3.5 text-[#23a55a]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Web Crypto API Laboratory */}
          <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#f0b232] font-bold text-sm font-sans">
                <Cpu className="w-4 h-4" />
                3. Interaktywne Laboratorium Szyfrowania (AES-256-GCM):
              </div>
              <button
                onClick={handleRunLabEncryption}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-[4px] font-sans font-semibold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                Test Szyfrowania
              </button>
            </div>

            <div>
              <label className="block text-[#949ba4] mb-1 font-sans text-xs">Tekst jawny do zaszyfrowania w RAM:</label>
              <input
                type="text"
                value={labPlainText}
                onChange={(e) => setLabPlainText(e.target.value)}
                className="w-full bg-[#1e1f22] p-2 rounded border border-[#3f4147] text-white focus:outline-none focus:border-[#5865f2]"
              />
            </div>

            {labCiphertext && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#1e1f22] p-2.5 rounded border border-[#3f4147]">
                  <span className="text-[#f0b232] font-semibold block mb-1">
                    Ciphertext (AES-256-GCM Base64):
                  </span>
                  <p className="text-[#f0b232] break-all text-[11px]">{labCiphertext}</p>
                </div>

                <div className="bg-[#1e1f22] p-2.5 rounded border border-[#3f4147]">
                  <span className="text-[#23a55a] font-semibold block mb-1">
                    IV (96-bit Random Vector):
                  </span>
                  <p className="text-[#23a55a] break-all text-[11px]">{labIv}</p>
                  <span className="text-[#949ba4] block mt-2 text-[10px]">Fingerprint: {labFingerprint}</span>
                </div>

                <div className="col-span-full bg-[#23a55a]/10 p-2.5 rounded border border-[#23a55a]/30 text-[#23a55a]">
                  <span className="font-semibold block mb-1 flex items-center gap-1 font-sans">
                    <Check className="w-3.5 h-3.5" /> Wynik deszyfracji po stronie odbiorcy:
                  </span>
                  <p className="text-white font-sans text-sm">{labDecryptedText}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
