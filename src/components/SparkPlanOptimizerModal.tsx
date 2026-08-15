import React from "react";
import {
  ToothShieldIcon,
  ToothLogoIcon,
  ToothSparkleIcon,
} from "./ToothIcons";
import {
  Activity,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Database,
  Layers,
  X,
  Gauge,
} from "lucide-react";
import { FirestoreQuotaStats } from "../types";

interface SparkPlanOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: FirestoreQuotaStats;
}

export const SparkPlanOptimizerModal: React.FC<SparkPlanOptimizerModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen) return null;

  const readPercent = Math.min(100, (stats.reads / 50000) * 100);
  const writePercent = Math.min(100, (stats.writes / 20000) * 100);

  return (
    <div
      id="spark-optimizer-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#232428] rounded-[8px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Discord Header */}
        <div className="p-4 border-b border-[#232428] bg-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00a8fc] text-white flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                Optymalizator Planu Firestore Spark (ToothChat Engine)
              </h3>
              <p className="text-xs text-[#949ba4]">
                Zero-Cost architektura: monitorowanie zapytań do bazy Google Cloud Firestore
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
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* Quotas Metric Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Reads Metric */}
            <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#949ba4] font-semibold">Odczyty (Dokumenty / Doba):</span>
                <span className="text-[#00a8fc] font-mono font-bold text-sm">
                  {stats.reads.toLocaleString()} / 50 000
                </span>
              </div>
              <div className="w-full h-2 bg-[#1e1f22] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00a8fc] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, readPercent)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#23a55a] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zużyto {readPercent.toFixed(2)}% limitu Spark
              </span>
            </div>

            {/* Writes Metric */}
            <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#949ba4] font-semibold">Zapisy (Dokumenty / Doba):</span>
                <span className="text-[#5865f2] font-mono font-bold text-sm">
                  {stats.writes.toLocaleString()} / 20 000
                </span>
              </div>
              <div className="w-full h-2 bg-[#1e1f22] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5865f2] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, writePercent)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#23a55a] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zużyto {writePercent.toFixed(2)}% limitu Spark
              </span>
            </div>
          </div>

          {/* Spark Plan Cost Guarantee */}
          <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#23a55a]/40 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-[#23a55a] text-sm">Szacowany Koszt Infrastruktury Google Cloud:</h4>
              <p className="text-[#dbdee1] text-[11px]">Darmowy plan Spark bez karty kredytowej (100% Free Tier)</p>
            </div>
            <div className="text-xl font-bold font-mono text-[#23a55a]">
              $0.00 / mc
            </div>
          </div>

          {/* Applied Architectural Optimizations List */}
          <div className="space-y-2 font-mono text-[11px]">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider font-sans flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#f0b232]" />
              Zastosowane Optymalizacje ToothChat:
            </h4>
            <div className="bg-[#2b2d31] p-4 rounded-[6px] border border-[#3f4147] space-y-2.5 text-[#dbdee1]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#23a55a] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Agregacja Sygnalizacji WebRTC (Batching):</strong> Kandydaci ICE są zapisywani w pojedynczym dokumencie sesji, oszczędzając 95% operacji zapisu Firestore.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#23a55a] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Natychmiastowy Unsubscribe:</strong> Zmiana kanału w aplikacji natychmiast anuluje subskrypcje Firestore, zapobiegając nadmiarowym odczytom w tle.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
