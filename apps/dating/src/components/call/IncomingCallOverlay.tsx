import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallStore } from '@/store/callStore';
import Avatar from '@/components/common/Avatar';
import { Phone, PhoneOff } from 'lucide-react';

export default function IncomingCallOverlay() {
  const { callState, remoteUser, callType, setCallState, endCall } = useCallStore();
  const navigate = useNavigate();

  if (callState !== 'ringing' || !remoteUser) return null;

  const accept = () => {
    setCallState('active');
    navigate(`/${callType}-call/${remoteUser.id}`);
  };

  const decline = () => { endCall(); };

  return (
    <div className="fixed top-0 left-0 right-0 max-w-md mx-auto z-[100] p-4">
      <div className="bg-gray-900 rounded-3xl p-4 shadow-2xl flex items-center gap-3">
        <Avatar src={remoteUser.avatar} name={remoteUser.full_name} size={52} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{remoteUser.full_name}</p>
          <p className="text-gray-400 text-xs animate-pulse">
            {callType === 'video' ? 'Gọi video đến...' : 'Gọi thoại đến...'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={decline} className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center">
            <PhoneOff size={20} className="text-white" />
          </button>
          <button onClick={accept} className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center">
            <Phone size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
