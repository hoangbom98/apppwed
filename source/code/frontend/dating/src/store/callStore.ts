import { create } from 'zustand';

export type CallState = 'idle' | 'calling' | 'ringing' | 'active';

export interface CallParticipant {
  id: number;
  full_name: string;
  avatar: string | null;
}

interface CallStoreState {
  callState: CallState;
  callType: 'voice' | 'video' | null;
  remoteUser: CallParticipant | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  duration: number;
  isMuted: boolean;
  isCameraOff: boolean;
  startCall: (user: CallParticipant, type: 'voice' | 'video') => void;
  endCall: () => void;
  setRemoteStream: (s: MediaStream) => void;
  setLocalStream: (s: MediaStream) => void;
  setCallState: (s: CallState) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  tick: () => void;
}

export const useCallStore = create<CallStoreState>()((set) => ({
  callState: 'idle',
  callType: null,
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  duration: 0,
  isMuted: false,
  isCameraOff: false,

  startCall: (user, type) => set({ callState: 'calling', remoteUser: user, callType: type }),
  endCall: () =>
    set({ callState: 'idle', remoteUser: null, localStream: null, remoteStream: null, duration: 0 }),
  setRemoteStream: (s) => set({ remoteStream: s }),
  setLocalStream: (s) => set({ localStream: s }),
  setCallState: (s) => set({ callState: s }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),
  tick: () => set((s) => ({ duration: s.duration + 1 })),
}));
