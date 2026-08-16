import React, { useState, useEffect, useRef } from "react";
import {
  ToothLogoIcon,
  ToothSpeakerIcon,
  ToothShieldIcon,
  ToothSparkleIcon,
} from "./ToothIcons";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Shield,
  Radio,
  Lock,
  ScreenShare,
  Signal,
  Settings,
} from "lucide-react";
import { UserIdentity, MeshPeerSignal } from "../types";
import { webrtcService } from "../services/webrtcManager";
import { firestoreService } from "../services/firestoreEngine";

interface VoiceRoomMeshViewProps {
  roomId: string;
  roomName: string;
  currentUser: UserIdentity;
  onLeave: () => void;
}

export const VoiceRoomMeshView: React.FC<VoiceRoomMeshViewProps> = ({
  roomId,
  roomName,
  currentUser,
  onLeave,
}) => {
  const [peers, setPeers] = useState<MeshPeerSignal[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [insertableStreamsEnabled, setInsertableStreamsEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const audioIntervalRef = useRef<any>(null);

  useEffect(() => {
    webrtcService
      .joinMeshVoiceRoom(
        roomId,
        currentUser.id,
        currentUser.displayName,
        currentUser.publicKeySpki
      )
      .then(() => {
        const stream = webrtcService.getLocalStream();
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
        }
      });

    const unsubscribe = firestoreService.subscribeMeshRoom(roomId, (meshPeers) => {
      setPeers(meshPeers);
    });

    audioIntervalRef.current = setInterval(() => {
      const vol = webrtcService.getAudioVolume();
      setAudioLevel(vol);
    }, 100);

    return () => {
      clearInterval(audioIntervalRef.current);
      unsubscribe();
      webrtcService.leaveMeshVoiceRoom(roomId, currentUser.id);
    };
  }, [roomId, currentUser]);

  const toggleMic = () => {
    const stream = webrtcService.getLocalStream();
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    const stream = webrtcService.getLocalStream();
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  return (
    <div
      id="discord-voice-stage"
      className="flex-1 bg-[#1e1f22] flex flex-col h-full overflow-hidden select-none"
    >
      {/* 1. Discord Voice Header */}
      <div className="h-12 border-b border-[#2b2d31] px-4 flex items-center justify-between bg-[#2b2d31] shrink-0">
        <div className="flex items-center gap-2">
          <ToothSpeakerIcon className="w-5 h-5 text-[#23a55a]" />
          <h2 className="font-bold text-white text-sm">
            {roomName}
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#23a55a]/10 text-[#23a55a] border border-[#23a55a]/30 font-mono">
            Mesh WebRTC ({peers.length + 1} węzłów)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e1f22] rounded-[4px] text-xs font-mono text-[#23a55a]">
            <Signal className="w-3.5 h-3.5" />
            <span>PING: 12ms (P2P Mesh)</span>
          </div>
        </div>
      </div>

      {/* 2. Grid of Voice / Video Tiles */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Local User Tile */}
          <div
            id="discord-local-voice-card"
            className="bg-[#2b2d31] rounded-[8px] overflow-hidden relative flex flex-col items-center justify-center aspect-video shadow-md group border border-[#35373c]"
          >
            {isVideoEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-xl transition-all ${
                    audioLevel > 15
                      ? "ring-4 ring-[#23a55a] scale-105"
                      : "ring-2 ring-[#35373c]"
                  }`}
                  style={{ backgroundColor: currentUser.avatarColor || "#5865F2" }}
                >
                  <ToothLogoIcon className="w-12 h-12 text-white" />
                </div>
                {isMuted && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#da373c] text-white flex items-center justify-center border-2 border-[#2b2d31]">
                    <MicOff className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            )}

            {/* User tag pill */}
            <div className="absolute bottom-3 left-3 bg-[#111214]/80 backdrop-blur-sm px-2.5 py-1 rounded-[4px] text-xs font-medium text-white flex items-center gap-1.5">
              <span>{currentUser.displayName} (Ty)</span>
              {audioLevel > 15 && (
                <div className="w-2 h-2 rounded-full bg-[#23a55a] animate-ping" />
              )}
            </div>
          </div>

          {/* Remote Peers in Mesh */}
          {peers
            .filter((p) => p.peerId !== currentUser.id)
            .map((peer) => (
              <div
                key={peer.peerId}
                id={`peer-card-${peer.peerId}`}
                className="bg-[#2b2d31] rounded-[8px] overflow-hidden relative flex flex-col items-center justify-center aspect-video shadow-md border border-[#35373c]"
              >
                <div className="w-20 h-20 rounded-full bg-[#23A55A] flex items-center justify-center font-bold text-white text-2xl shadow-xl ring-2 ring-[#35373c]">
                  <ToothLogoIcon className="w-12 h-12 text-white" />
                </div>

                <div className="absolute bottom-3 left-3 bg-[#111214]/80 backdrop-blur-sm px-2.5 py-1 rounded-[4px] text-xs font-medium text-white flex items-center gap-1.5">
                  <span>{peer.peerName}</span>
                  <ToothShieldIcon className="w-3.5 h-3.5 text-[#23a55a]" />
                </div>
              </div>
            ))}

          {/* Waiting for other teeth tile */}
          {peers.filter((p) => p.peerId !== currentUser.id).length === 0 && (
            <div className="bg-[#2b2d31]/50 border border-dashed border-[#4e5058] rounded-[8px] p-6 flex flex-col items-center justify-center text-center aspect-video">
              <ToothLogoIcon className="w-10 h-10 text-[#5865f2] mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-white">
                Czekamy na kolejne zęby w pokoju...
              </p>
              <p className="text-xs text-[#949ba4] mt-1 max-w-xs">
                Otwórz nową kartę przeglądarki, aby automatycznie nawiązać połączenie Full-Mesh WebRTC.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Discord Floating Bottom Media Controls */}
      <div className="h-20 bg-[#2b2d31] border-t border-[#202225] px-6 flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={toggleVideo}
          title={isVideoEnabled ? "Wyłącz kamerę" : "Włącz kamerę"}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow ${
            isVideoEnabled
              ? "bg-[#23a55a] text-white hover:bg-[#1f934f]"
              : "bg-[#383a40] text-white hover:bg-[#4e5058]"
          }`}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleMic}
          title={isMuted ? "Włącz mikrofon" : "Wycisz mikrofon"}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow ${
            isMuted
              ? "bg-[#da373c] text-white hover:bg-[#b82e32]"
              : "bg-[#383a40] text-white hover:bg-[#4e5058]"
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Screen Share / Stream */}
        <button
          onClick={async () => {
            if (webrtcService.getIsScreenSharing()) {
              await webrtcService.stopScreenShare();
            } else {
              await webrtcService.startScreenShare();
            }
          }}
          title={webrtcService.getIsScreenSharing() ? "Zatrzymaj stream" : "Udostępnij ekran (Stream)"}
          className={`px-4 h-12 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow font-semibold text-xs ${
            webrtcService.getIsScreenSharing()
              ? "bg-amber-500 text-black hover:bg-amber-400 font-bold animate-pulse"
              : "bg-[#383a40] text-white hover:bg-[#5865F2]"
          }`}
        >
          <ScreenShare className="w-5 h-5" />
          <span>{webrtcService.getIsScreenSharing() ? "Stream Aktywny" : "Streamuj Ekran"}</span>
        </button>

        <button
          onClick={onLeave}
          title="Rozłącz się z kanałem głosowym"
          className="w-12 h-12 rounded-full bg-[#da373c] hover:bg-[#b82e32] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
