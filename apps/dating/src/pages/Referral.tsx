import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getReferralInfo, getReferralHistory } from '@/api/community';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/common/PageHeader';
import { Share2, Copy, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatVND, formatTime } from '@/utils/formatters';

export default function Referral() {
  const { user } = useAuthStore();
  const { data } = useQuery({ queryKey: ['referral'], queryFn: getReferralInfo });
  const { data: histData } = useQuery({ queryKey: ['referral-history'], queryFn: getReferralHistory });

  const code = user?.referral_code || data?.code || '------';
  const earnings = data?.total_earnings || 0;
  const history = histData?.history || [];

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã!');
  };

  return (
    <div>
      <PageHeader title="Giới thiệu bạn bè" />
      <div className="px-4 pb-8 space-y-5">

        {/* Referral card */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl p-6 text-white text-center">
          <div className="text-4xl mb-3">🎁</div>
          <h2 className="font-black text-xl mb-1">Mời bạn bè – Nhận thưởng</h2>
          <p className="text-white/80 text-sm mb-5">Mỗi bạn bè đăng ký bạn nhận 50 xu hoa hồng!</p>

          <div className="bg-white/20 rounded-2xl px-4 py-3 mb-3">
            <p className="text-xs text-white/70 mb-1">Mã giới thiệu của bạn</p>
            <p className="text-2xl font-black tracking-widest">{code}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={copyCode}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold">
              <Copy size={16} /> Sao chép
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-pink-500 rounded-xl text-sm font-bold">
              <Share2 size={16} /> Chia sẻ
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-amber-600">{data?.total_referrals || 0}</p>
            <p className="text-xs text-amber-500 mt-1">Bạn bè đã giới thiệu</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-green-600">{earnings.toLocaleString()}</p>
            <p className="text-xs text-green-500 mt-1">Tổng xu nhận được</p>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-3">📋 Lịch sử hoa hồng</h3>
            <div className="space-y-2">
              {history.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                    <Gift size={16} className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{h.friend_name} đã đăng ký</p>
                    <p className="text-xs text-gray-400">{formatTime(h.created_at)}</p>
                  </div>
                  <span className="text-sm font-bold text-green-500">+{h.reward} xu</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
