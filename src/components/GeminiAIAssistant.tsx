import React, { useState } from "react";
import {
  ToothSparkleIcon,
  ToothShieldIcon,
  ToothLogoIcon,
} from "./ToothIcons";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ListTodo,
  RefreshCw,
  X,
  Send,
  Zap,
} from "lucide-react";
import { EncryptedMessagePayload } from "../types";

interface GeminiAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  messages: EncryptedMessagePayload[];
}

export const GeminiAIAssistant: React.FC<GeminiAIAssistantProps> = ({
  isOpen,
  onClose,
  channelName,
  messages,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "audit" | "custom">("summary");
  const [customPrompt, setCustomPrompt] = useState("");
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateSummary = async (instruction?: string) => {
    try {
      setIsLoading(true);
      setSummaryResult(null);

      const decryptedCleanMessages = messages.map((m) => ({
        authorName: m.senderName,
        text: m.decryptedText || "[Zaszyfrowany tekst]",
        timestamp: m.timestamp,
      }));

      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName,
          messages: decryptedCleanMessages,
          customInstruction: instruction || customPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error(`Błąd serwera: ${res.statusText}`);
      }

      const data = await res.json();
      setSummaryResult(data.summary);
      if (data.actionItems) setActionItems(data.actionItems);
      if (data.sentiment) setSentiment(data.sentiment);
    } catch (err: any) {
      console.error("Gemini Summarize Error:", err);
      setSummaryResult(`Błąd podczas generowania podsumowania: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSecurityAudit = async () => {
    try {
      setIsLoading(true);
      setAuditResult(null);

      const decryptedCleanMessages = messages.map((m) => ({
        authorName: m.senderName,
        text: m.decryptedText || "[Zaszyfrowany tekst]",
      }));

      const res = await fetch("/api/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: decryptedCleanMessages,
        }),
      });

      const data = await res.json();
      setAuditResult(data.auditResult);
    } catch (err: any) {
      setAuditResult(`Błąd audytu: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="gemini-ai-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-[#313338] border border-[#232428] rounded-[8px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Discord Modal Header */}
        <div className="bg-[#2b2d31] p-4 border-b border-[#232428] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white">
              <ToothSparkleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Gemini Tooth AI (Google AI Studio)
              </h3>
              <p className="text-xs text-[#949ba4]">
                Analiza zdeszyfrowanych lokalnie wiadomości dla kanału #{channelName}
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

        {/* Security Zero-Knowledge Guarantee Box */}
        <div className="bg-[#1e1f22] px-4 py-2.5 border-b border-[#2b2d31] flex items-start gap-2.5 text-xs text-[#dbdee1]">
          <ToothShieldIcon className="w-4 h-4 text-[#23a55a] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#23a55a]">
              Zero-Knowledge E2EE Gwarancja:
            </span>{" "}
            Klucze AES-GCM i ECDH nigdy nie opuszczają Twojej przeglądarki. Wiadomości są deszyfrowane w pamięci RAM klienta i dopiero na Twoje wyraźne żądanie przetwarzane przez model Gemini 2.5 Flash.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#232428] bg-[#2b2d31] px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setActiveTab("summary");
              if (!summaryResult) handleGenerateSummary();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t transition-all border-b-2 cursor-pointer ${
              activeTab === "summary"
                ? "border-[#5865F2] text-white bg-[#313338]"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Podsumowanie Wątku
          </button>

          <button
            onClick={() => {
              setActiveTab("audit");
              if (!auditResult) handleRunSecurityAudit();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t transition-all border-b-2 cursor-pointer ${
              activeTab === "audit"
                ? "border-[#5865F2] text-white bg-[#313338]"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <ToothShieldIcon className="w-3.5 h-3.5" />
            Audyt Bezpieczeństwa
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t transition-all border-b-2 cursor-pointer ${
              activeTab === "custom"
                ? "border-[#5865F2] text-white bg-[#313338]"
                : "border-transparent text-[#949ba4] hover:text-[#dbdee1]"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Własne Polecenie
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar text-sm text-[#dbdee1]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#5865f2] animate-spin" />
              <p className="text-sm font-medium text-white">
                Gemini 2.5 Flash analizuje zdeszyfrowany wątek...
              </p>
              <p className="text-xs text-[#949ba4] font-mono">
                Przetwarzanie {messages.length} wiadomości w bezpiecznym kontekście
              </p>
            </div>
          ) : activeTab === "summary" ? (
            <div className="space-y-4">
              {summaryResult ? (
                <div className="space-y-4">
                  <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] whitespace-pre-wrap leading-relaxed">
                    {summaryResult}
                  </div>

                  {actionItems.length > 0 && (
                    <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#5865f2]/40">
                      <h4 className="font-bold text-[#5865f2] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ListTodo className="w-4 h-4" />
                        Zadania do Wykonania:
                      </h4>
                      <ul className="space-y-1.5">
                        {actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-[#dbdee1]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#23a55a] shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleGenerateSummary()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4e5058] hover:bg-[#6d6f78] text-xs text-white rounded-[4px] transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Odśwież
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={() => handleGenerateSummary()}
                    className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-[4px] text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    Generuj Podsumowanie Gemini
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === "audit" ? (
            <div className="space-y-4">
              {auditResult ? (
                <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] whitespace-pre-wrap leading-relaxed">
                  {auditResult}
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={() => handleRunSecurityAudit()}
                    className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-[4px] text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    Uruchom Audyt Bezpieczeństwa
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#dbdee1]">
                Wprowadź instrukcję dla Gemini do analizy tego kanału:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="np. 'Wypisz najważniejsze ustalenia i terminy'..."
                className="w-full h-28 bg-[#1e1f22] border border-[#3f4147] rounded-[4px] p-3 text-xs text-white placeholder:text-[#80848e] focus:outline-none focus:border-[#5865f2]"
              />
              <button
                onClick={() => handleGenerateSummary(customPrompt)}
                disabled={!customPrompt.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] disabled:opacity-50 text-white rounded-[4px] text-xs font-semibold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Wyślij do Gemini
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
