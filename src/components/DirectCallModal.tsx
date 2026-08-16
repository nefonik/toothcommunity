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
  Monitor,
  MonitorOff,
  Sparkles,
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [signalingLogs, setSignalingLogs] = useState<string[]>([]);
  const [iceState, setIceState] = useState("Połączono (P2P)");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const isEndedRef = useRef(false);

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

    // Subscribe to remote stream
    const unsubRemote = webrtcService.onRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        addLog(`Odebrano zdalny strumień wideo/audio od rozmówcy`);
      }
    });

    // Subscribe to screen share state
    const unsubScreen = webrtcService.onScreenShareChange((sharing) => {
      setIsScreenSharing(sharing);
      if (sharing) {
        addLog(`💻 Udostępnianie ekranu aktywne (Stream na żywo)`);
        const sStream = webrtcService.getScreenStream();
        if (localVideoRef.current && sStream) {
          localVideoRef.current.srcObject = sStream;
        }
      } else {
        const lStream = webrtcService.getLocalStream();
        if (localVideoRef.current && lStream) {
          localVideoRef.current.srcObject = lStream;
        }
      }
    });

    const unsubCall = firestoreService.subscribeCall(call.id, (updated) => {
      if (updated?.status === "ended" || updated?.status === "rejected") {
        if (!isEndedRef.current) {
          isEndedRef.current = true;
          addLog(`Rozmówca zakończył połączenie`);
          setTimeout(() => onClose(), 800);
        }
      } else if (updated?.status === "connected") {
        setIceState("Połączono (P2P)");
        addLog(`✅ Połączenie P2P WebRTC nawiązane (ToothChat E2EE Active)`);
      }
    });

    return () => {
      unsubRemote();
      unsubScreen();
      unsubCall();
    };
  }, [call.id, currentUser.id]);

  const handleHangup = () => {
    isEndedRef.current = true;
    webrtcService.endDirectCall(call.id);
    onClose();
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await webrtcService.stopScreenShare();
      setIsScreenSharing(false);
    } else {
      const stream = await webrtcService.startScreenShare();
      if (stream) {
        setIsScreenSharing(true);
      }
    }
  };

  const handleToggleMute = () => {
    const stream = webrtcService.getLocalStream();
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    const stream = webrtcService.getLocalStream();
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div
      id="direct-call-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
    >
      <div className="bg-[#313338] border border-[#232428] rounded-[10px] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Discord Header */}
        <div className="p-4 border-b border-[#232428] bg-[#2b2d31] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold shadow-md">
              <ToothLogoIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Rozmowa P2P z{" "}
                {call.callerId === currentUser.id ? call.receiverName : call.callerName}
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#23a55a]/10 text-[#23a55a] border border-[#23a55a]/30 font-mono">
                  Tooth E2EE
                </span>
                {isScreenSharing && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> STREAMUJESZ EKRAN
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#949ba4] font-mono flex items-center gap-2">
                <span className="text-[#23a55a] font-semibold">{iceState}</span>
                <span>•</span>
                <span>E2EE Audio & Wideo</span>
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
          <div className="bg-[#1e1f22] border border-[#3f4147] rounded-[8px] overflow-hidden relative aspect-video flex items-center justify-center shadow-inner">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-[11px] text-white font-medium flex items-center gap-1.5 border border-white/10">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#23a55a]" />
              Zdalny Strumień ({call.callerId === currentUser.id ? call.receiverName : call.callerName})
            </div>
          </div>

          {/* Local Video */}
          <div className="bg-[#1e1f22] border border-[#3f4147] rounded-[8px] overflow-hidden relative aspect-video flex items-center justify-center shadow-inner">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff && !isScreenSharing ? "hidden" : ""}`}
            />
            {isVideoOff && !isScreenSharing && (
              <div className="text-xs text-[#949ba4] font-mono">Kamera wyłączona</div>
            )}
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-[11px] text-[#23a55a] font-medium flex items-center gap-1.5 border border-white/10">
              <Activity className="w-3.5 h-3.5 text-[#23a55a]" />
              {isScreenSharing ? "Podgląd Twojego Streamu Ekranu" : "Twój Podgląd Kamery"}
            </div>
          </div>

          {/* Real-time Firestore Signaling Log Console */}
          <div className="col-span-full bg-[#1e1f22] border border-[#3f4147] rounded-[6px] p-3 font-mono text-[11px] text-[#dbdee1]">
            <div className="text-[#5865f2] font-bold mb-1.5 flex items-center gap-1.5 border-b border-[#2b2d31] pb-1">
              <Terminal className="w-3.5 h-3.5" />
              Konsola Sygnalizacji ToothChat P2P E2EE:
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
            onClick={handleToggleMute}
            title={isMuted ? "Włącz mikrofon" : "Wycisz mikrofon"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow ${
              isMuted ? "bg-[#da373c] text-white" : "bg-[#383a40] text-white hover:bg-[#4e5058]"
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={handleToggleVideo}
            title={isVideoOff ? "Włącz kamerę" : "Wyłącz kamerę"}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow ${
              isVideoOff ? "bg-[#da373c] text-white" : "bg-[#383a40] text-white hover:bg-[#4e5058]"
            }`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Screen Share / Stream Button */}
          <button
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? "Zatrzymaj stream ekranu" : "Udostępnij ekran / Streamuj"}
            className={`px-4 h-11 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow font-semibold text-xs ${
              isScreenSharing
                ? "bg-amber-500 text-black hover:bg-amber-400 font-bold animate-pulse"
                : "bg-[#383a40] text-white hover:bg-[#5865F2]"
            }`}
          >
            {isScreenSharing ? (
              <>
                <MonitorOff className="w-5 h-5" />
                <span>Zatrzymaj Stream</span>
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5" />
                <span>Udostępnij Ekran (Stream)</span>
              </>
            )}
          </button>

          <button
            onClick={handleHangup}
            title="Rozłącz się"
            className="w-11 h-11 rounded-full bg-[#da373c] hover:bg-[#b82e32] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
