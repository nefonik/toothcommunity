import React, { useEffect, useRef, useState } from "react";
import {
  ToothLogoIcon,
  ToothShieldIcon,
} from "./ToothIcons";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Terminal,
  Activity,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { CallSession, UserIdentity } from "../types";
import { webrtcService } from "../services/webrtcManager";
import { firestoreService } from "../services/firestoreEngine";

interface DirectCallModalProps {
  call: CallSession;
  currentUser: UserIdentity;
  onClose: () => void;
}

export const DirectCallModal: React.FC<DirectCallModalProps> = ({
  call,
  currentUser,
  onClose,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [signalingLogs, setSignalingLogs] = useState<string[]>([]);
  const [iceState, setIceState] = useState("checking");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const addLog = (msg: string) => {
    setSignalingLogs((prev) => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    addLog(`Inicjalizacja sesji ToothChat P2P: ${call.id}`);
    addLog(`Pobieranie strumienia mediów getUserMedia()...`);

    const isCaller = call.callerId === currentUser.id;

    if (isCaller) {
      addLog(`Utworzono SDP Offer -> Zapisano w Firestore /calls/${call.id}`);
    } else {
      addLog(`Odebrano SDP Offer -> Tworzenie SDP Answer`);
      webrtcService.answerDirectCall(call).then(() => {
        addLog(`Zapisano SDP Answer w Firestore /calls/${call.id}`);
      });
    }

    const localStream = webrtcService.getLocalStream();
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    const remoteStream = webrtcService.getRemoteStream();
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    const unsub = firestoreService.subscribeCall(call.id, (updated) => {
      if (updated?.status === "ended" || updated?.status === "rejected") {
        addLog(`Rozmówca zakończył połączenie`);
        setTimeout(() => onClose(), 1000);
      } else if (updated?.status === "connected") {
        setIceState("connected");
        addLog(`✅ Połączenie P2P WebRTC nawiązane (ToothChat E2EE Active)`);
      }
    });

    return () => {
      unsub();
      webrtcService.endDirectCall(call.id);
    };
  }, [call, currentUser, onClose]);

  return (
    <div
      id="direct-call-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#313338] border border-[#232428] rounded-[8px] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Discord Header */}
        <div className="p-4 border-b border-[#232428] bg-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold">
              <ToothLogoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Rozmowa P2P z{" "}
                {call.callerId === currentUser.id ? call.receiverName : call.callerName}
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#23a55a]/10 text-[#23a55a] border border-[#23a55a]/30 font-mono">
                  Tooth E2EE
                </span>
              </h3>
              <p className="text-xs text-[#949ba4] font-mono flex items-center gap-2">
                <span>Stan ICE: {iceState}</span>
                <span>•</span>
                <span>Firestore Document: calls/{call.id.slice(0, 12)}...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#23a55a] bg-[#23a55a]/10 px-3 py-1.5 rounded border border-[#23a55a]/30">
            <ToothShieldIcon className="w-4 h-4" />
            <span>Zero-Knowledge WebRTC</span>
          </div>
        </div>

        {/* Main Video Stage */}
        <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
          {/* Remote Video */}
          <div className="bg-[#1e1f22] border border-[#3f4147] rounded-[8px] overflow-hidden relative aspect-video flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-white font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#23a55a]" />
              Zdalny Strumień ({call.callerId === currentUser.id ? call.receiverName : call.callerName})
            </div>
          </div>

          {/* Local Video */}
          <div className="bg-[#1e1f22] border border-[#3f4147] rounded-[8px] overflow-hidden relative aspect-video flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? "hidden" : ""}`}
            />
            {isVideoOff && (
              <div className="text-xs text-[#949ba4] font-mono">Kamera wyłączona</div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] text-[#23a55a] font-mono flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#23a55a]" />
              Twój Podgląd
            </div>
          </div>

          {/* Real-time Firestore Signaling Log Console */}
          <div className="col-span-full bg-[#1e1f22] border border-[#3f4147] rounded-[6px] p-3 font-mono text-[11px] text-[#dbdee1]">
            <div className="text-[#5865f2] font-bold mb-1.5 flex items-center gap-1.5 border-b border-[#2b2d31] pb-1">
              <Terminal className="w-3.5 h-3.5" />
              Konsola Sygnalizacji ToothChat (Google Cloud Firestore onSnapshot):
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
              {signalingLogs.map((log, idx) => (
                <div key={idx} className="text-[#949ba4]">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 bg-[#2b2d31] border-t border-[#232428] flex items-center justify-center gap-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMuted ? "bg-[#da373c] text-white" : "bg-[#383a40] text-white hover:bg-[#4e5058]"
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVideoOff ? "bg-[#da373c] text-white" : "bg-[#383a40] text-white hover:bg-[#4e5058]"
            }`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-[#da373c] hover:bg-[#b82e32] text-white flex items-center justify-center transition-all cursor-pointer shadow"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
