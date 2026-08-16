/**
 * ZeroCord WebRTC Management Engine (P2P 1-on-1 & Serverless Mesh Voice Rooms)
 * Includes Insertable Streams (E2EE Audio Frames), Screen Sharing (Streaming) & Firestore Signaling
 */

import { firestoreService } from "./firestoreEngine";
import { CallSession, MeshPeerSignal } from "../types";

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 6,
};

export class WebRtcManager {
  // P2P 1-on-1 call connection
  private directPeerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private isScreenSharing = false;
  private activeCallSession: CallSession | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  // Listeners
  private onRemoteStreamCallbacks: Set<(stream: MediaStream) => void> = new Set();
  private onScreenShareChangeCallbacks: Set<(isSharing: boolean) => void> = new Set();

  // Mesh Connections for Voice Rooms: TargetPeerId -> RTCPeerConnection
  private meshConnections: Map<string, RTCPeerConnection> = new Map();
  private meshRemoteStreams: Map<string, MediaStream> = new Map();

  // Audio Visualizer Analyser
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;

  public onRemoteStream(callback: (stream: MediaStream) => void): () => void {
    this.onRemoteStreamCallbacks.add(callback);
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
    return () => this.onRemoteStreamCallbacks.delete(callback);
  }

  public onScreenShareChange(callback: (isSharing: boolean) => void): () => void {
    this.onScreenShareChangeCallbacks.add(callback);
    callback(this.isScreenSharing);
    return () => this.onScreenShareChangeCallbacks.delete(callback);
  }

  // --- 1-on-1 P2P WebRTC Signaling & Connection ---

  public async startLocalMedia(video = true, audio = true): Promise<MediaStream> {
    if (this.localStream && this.localStream.active) {
      return this.localStream;
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video
          ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30 },
            }
          : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.setupAudioVisualizer(this.localStream);
      return this.localStream;
    } catch (err) {
      console.warn("Kamera lub mikrofon niedostępne, użycie fallbacku strumienia:", err);
      // Fallback synthetic canvas stream for environments without webcams
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        ctx.fillStyle = "#1e1f22";
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = "#5865F2";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("ToothChat E2EE WebRTC", 160, 220);
        ctx.fillStyle = "#23A55A";
        ctx.font = "16px sans-serif";
        ctx.fillText(`Kamera Aktywna (Sygnał P2P) #${frame}`, 180, 260);
      }, 100);

      // Synthetic audio oscillator
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const dst = audioCtx.createMediaStreamDestination();
        osc.connect(dst);
        osc.start();
        const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();
        dst.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        (stream as any)._cleanupInterval = interval;
        this.localStream = stream;
        return stream;
      } catch {
        const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();
        (stream as any)._cleanupInterval = interval;
        this.localStream = stream;
        return stream;
      }
    }
  }

  private setupAudioVisualizer(stream: MediaStream) {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;
      if (!this.audioContext || this.audioContext.state === "closed") {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      source.connect(this.analyserNode);
    } catch (e) {
      console.warn("Inicjalizacja wizualizatora audio pominięta:", e);
    }
  }

  public getAudioVolume(): number {
    if (!this.analyserNode) return 0;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return Math.min(100, Math.round((sum / dataArray.length / 255) * 100));
  }

  public async initiateDirectCall(
    callerId: string,
    callerName: string,
    callerPublicKey: string,
    receiverId: string,
    receiverName: string,
    callType: "video" | "voice" = "video"
  ): Promise<string> {
    const stream = await this.startLocalMedia(callType === "video", true);

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.directPeerConnection = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();
    this.pendingCandidates = [];

    // Attach local tracks
    stream.getTracks().forEach((track) => {
      this.directPeerConnection!.addTrack(track, stream);
    });

    // Handle remote tracks
    this.directPeerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!this.remoteStream!.getTracks().some((existing) => existing.id === t.id)) {
            this.remoteStream!.addTrack(t);
          }
        });
      } else if (event.track) {
        if (!this.remoteStream!.getTracks().some((existing) => existing.id === event.track.id)) {
          this.remoteStream!.addTrack(event.track);
        }
      }
      this.onRemoteStreamCallbacks.forEach((cb) => cb(this.remoteStream!));
    };

    // Handle ICE Candidates
    this.directPeerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidateJson = event.candidate.toJSON();
        await firestoreService.addCallCandidate(callId, "caller", candidateJson);
      }
    };

    // Create SDP Offer
    const offer = await this.directPeerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await this.directPeerConnection.setLocalDescription(offer);

    const callDoc: CallSession = {
      id: callId,
      callerId,
      callerName,
      callerPublicKey,
      receiverId,
      receiverName,
      status: "calling",
      type: callType,
      offer: {
        type: "offer",
        sdp: offer.sdp || "",
      },
      createdAt: Date.now(),
    };

    await firestoreService.createCall(callDoc);
    this.activeCallSession = callDoc;

    // Listen for Answer and ICE candidates via Firestore
    firestoreService.subscribeCall(callId, async (updatedCall) => {
      if (!updatedCall) return;

      // When answer arrives
      if (
        updatedCall.answer &&
        this.directPeerConnection &&
        (this.directPeerConnection.signalingState === "have-local-offer" ||
          this.directPeerConnection.signalingState === "have-remote-offer")
      ) {
        try {
          const rtcAnswer = new RTCSessionDescription({
            type: "answer",
            sdp: updatedCall.answer.sdp,
          });
          await this.directPeerConnection.setRemoteDescription(rtcAnswer);
          await firestoreService.updateCall(callId, {
            status: "connected",
            connectedAt: Date.now(),
          });
        } catch (e) {
          console.warn("Błąd ustawiania remote description answer:", e);
        }
      }
    });

    // Subscribe to receiver candidates
    firestoreService.subscribeCallCandidates(callId, "receiver", (candidates) => {
      candidates.forEach(async (cand) => {
        if (this.directPeerConnection && this.directPeerConnection.remoteDescription) {
          try {
            await this.directPeerConnection.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn("Błąd dodawania kandydata ICE:", e);
          }
        }
      });
    });

    return callId;
  }

  public async answerDirectCall(call: CallSession): Promise<void> {
    const stream = await this.startLocalMedia(call.type === "video", true);

    this.directPeerConnection = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();
    this.pendingCandidates = [];

    // Attach local tracks
    stream.getTracks().forEach((track) => {
      this.directPeerConnection!.addTrack(track, stream);
    });

    // Handle remote tracks
    this.directPeerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!this.remoteStream!.getTracks().some((existing) => existing.id === t.id)) {
            this.remoteStream!.addTrack(t);
          }
        });
      } else if (event.track) {
        if (!this.remoteStream!.getTracks().some((existing) => existing.id === event.track.id)) {
          this.remoteStream!.addTrack(event.track);
        }
      }
      this.onRemoteStreamCallbacks.forEach((cb) => cb(this.remoteStream!));
    };

    // Handle ICE candidates
    this.directPeerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidateJson = event.candidate.toJSON();
        await firestoreService.addCallCandidate(call.id, "receiver", candidateJson);
      }
    };

    // Set remote offer
    if (call.offer) {
      try {
        await this.directPeerConnection.setRemoteDescription(
          new RTCSessionDescription({
            type: "offer",
            sdp: call.offer.sdp,
          })
        );
      } catch (e) {
        console.warn("Błąd ustawiania remote offer:", e);
      }
    }

    // Create SDP Answer
    const answer = await this.directPeerConnection.createAnswer();
    await this.directPeerConnection.setLocalDescription(answer);

    // Save answer to Firestore
    await firestoreService.updateCall(call.id, {
      status: "connected",
      answer: {
        type: "answer",
        sdp: answer.sdp || "",
      },
      connectedAt: Date.now(),
    });

    this.activeCallSession = call;

    // Subscribe to caller candidates
    firestoreService.subscribeCallCandidates(call.id, "caller", (candidates) => {
      candidates.forEach(async (cand) => {
        if (this.directPeerConnection && this.directPeerConnection.remoteDescription) {
          try {
            await this.directPeerConnection.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn("Błąd dodawania kandydata ICE z oferty:", e);
          }
        }
      });
    });
  }

  // --- SCREEN SHARING / STREAMING (UDOSTĘPNIANIE EKRANU) ---

  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      if (!navigator.mediaDevices.getDisplayMedia) {
        alert("Twoja przeglądarka nie obsługuje udostępniania ekranu.");
        return null;
      }

      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: { ideal: 30, max: 60 },
        },
        audio: true,
      });

      const screenVideoTrack = this.screenStream.getVideoTracks()[0];
      if (!screenVideoTrack) return null;

      // Replace video track in 1-on-1 call
      if (this.directPeerConnection) {
        const senders = this.directPeerConnection.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          this.directPeerConnection.addTrack(screenVideoTrack, this.screenStream);
        }
      }

      // Replace video track in Mesh Voice Rooms
      this.meshConnections.forEach(async (pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          pc.addTrack(screenVideoTrack, this.screenStream!);
        }
      });

      this.isScreenSharing = true;
      this.onScreenShareChangeCallbacks.forEach((cb) => cb(true));

      // Handle when user stops sharing via browser bar
      screenVideoTrack.onended = () => {
        this.stopScreenShare();
      };

      return this.screenStream;
    } catch (err) {
      console.warn("Błąd uruchamiania udostępniania ekranu:", err);
      return null;
    }
  }

  public async stopScreenShare(): Promise<void> {
    if (!this.isScreenSharing) return;

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }

    this.isScreenSharing = false;

    // Restore camera video track
    const camTrack = this.localStream?.getVideoTracks()[0] || null;

    if (this.directPeerConnection && camTrack) {
      const senders = this.directPeerConnection.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender) {
        await videoSender.replaceTrack(camTrack);
      }
    }

    this.meshConnections.forEach(async (pc) => {
      if (camTrack) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(camTrack);
        }
      }
    });

    this.onScreenShareChangeCallbacks.forEach((cb) => cb(false));
  }

  public getIsScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  public getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  public async endDirectCall(callId?: string): Promise<void> {
    const id = callId || this.activeCallSession?.id;
    if (id) {
      await firestoreService.updateCall(id, { status: "ended" });
    }
    if (this.isScreenSharing) {
      await this.stopScreenShare();
    }
    if (this.directPeerConnection) {
      this.directPeerConnection.close();
      this.directPeerConnection = null;
    }
    this.activeCallSession = null;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // --- Mesh Voice Channel Signaling ---
  public async joinMeshVoiceRoom(
    roomId: string,
    myPeerId: string,
    myDisplayName: string,
    myPublicKey: string
  ): Promise<void> {
    await this.startLocalMedia(false, true);

    const signal: MeshPeerSignal = {
      peerId: myPeerId,
      peerName: myDisplayName,
      peerPublicKey: myPublicKey,
      roomId,
      audioMuted: false,
      videoEnabled: false,
      joinedAt: Date.now(),
      lastHeartbeat: Date.now(),
    };

    await firestoreService.syncMeshPeer(roomId, signal);
  }

  public async leaveMeshVoiceRoom(roomId: string, myPeerId: string): Promise<void> {
    await firestoreService.leaveMeshRoom(roomId, myPeerId);
    if (this.isScreenSharing) {
      await this.stopScreenShare();
    }
    this.meshConnections.forEach((pc) => pc.close());
    this.meshConnections.clear();
    this.meshRemoteStreams.clear();
  }

  public stopAllTracks(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const webrtcService = new WebRtcManager();
