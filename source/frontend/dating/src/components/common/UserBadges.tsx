import React from 'react';
import { Shield, CheckCircle, Crown } from 'lucide-react';

interface Props {
  isOnline?: boolean;
  isVerified?: boolean;
  vipLevel?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserBadges({ isOnline, isVerified, vipLevel = 0, size = 'md' }: Props) {
  const sz = size === 'sm' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5';
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {isOnline && (
        <span className={`${sz} rounded-full bg-green-100 text-green-600 font-medium flex items-center gap-0.5`}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Online
        </span>
      )}
      {isVerified && (
        <span className={`${sz} rounded-full bg-blue-100 text-blue-600 font-medium flex items-center gap-0.5`}>
          <CheckCircle size={10} />
          Xác minh
        </span>
      )}
      {vipLevel > 0 && (
        <span className={`${sz} rounded-full bg-amber-100 text-amber-600 font-medium flex items-center gap-0.5`}>
          <Crown size={10} />
          VIP {vipLevel}
        </span>
      )}
    </div>
  );
}
