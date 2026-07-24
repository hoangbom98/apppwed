import { useEffect, useRef } from 'react';
import { getSocket } from './useSocket';
import { useCallStore } from '@/store/callStore';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  ...(import.meta.env.VITE_TURN_SERVER
    ? [{ urls: import.meta.env.VITE_TURN_SERVER,
         username: import.meta.env.VITE_TURN_USER || '',
         credential: import.meta.env.VITE_TURN_CRED || '' }]
    : []),
];

export const useWebRTC = (remoteUserId: number, callType: 'voice' | 'video') => {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const { setLocalStream, setRemoteStream, setCallState, endCall } = useCallStore();

  const getLocalMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'video',
    });
    setLocalStream(stream);
    return stream;
  };

  const startCall = async () => {
    const socket = getSocket();
    if (!socket) return;

    const stream = await getLocalMedia();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (e) => setRemoteStream(e.streams[0]);
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('call:ice-candidate', { to: remoteUserId, candidate: e.candidate });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('call:offer', { to: remoteUserId, offer, type: callType });
    setCallState('calling');
  };

  const hangup = () => {
    const socket = getSocket();
    socket?.emit('call:end', { to: remoteUserId });
    pcRef.current?.close();
    pcRef.current = null;
    const ls = useCallStore.getState().localStream;
    ls?.getTracks().forEach((t) => t.stop());
    endCall();
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('call:answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      await pcRef.current?.setRemoteDescription(data.answer);
      setCallState('active');
    });

    socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      await pcRef.current?.addIceCandidate(data.candidate);
    });

    socket.on('call:end', () => {
      pcRef.current?.close();
      pcRef.current = null;
      endCall();
    });

    return () => {
      socket.off('call:answer');
      socket.off('call:ice-candidate');
      socket.off('call:end');
    };
  }, [remoteUserId]);

  return { startCall, hangup };
};
