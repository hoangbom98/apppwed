import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getReferralCode, getReferralStats, getReferralDownline, getReferralCommissions
} from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import {
  Users, Copy, CheckCircle, Gift, TrendingUp, Share2,
  ChevronRight, Clock,
} from 'lucide-react';

type Tab = 'overview' | 'downline' | 'commissions';

export default function ReferralPage() {
  const { user } = useAuthStore();
  const [tab, setTab]       = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  const { data: codeData }  = useQuery({
    queryKey: ['referral-code'],
    queryFn:  getReferralCode,
    enabled:  !!user,
  });
  const { data: statsData } = useQuery({
    queryKey: ['referral-stats'],
    queryFn:  getReferralStats,
    enabled:  !!user,
  });
  const { data: downlineData } = useQuery({
    queryKey: ['referral-downline', tab],
    queryFn:  () => getReferralDownline(),
    enabled:  !!user && tab === 'downline',
  });
  const { data: commData } = useQuery({
    queryKey: ['referral-commissions', tab],
    queryFn:  () => getReferralCommissions(),
    enabled:  !!user && tab === 'commissions',
  });

  const refCode  = codeData?.data?.code  ?? '--------';
  const refLink  = codeData?.data?.link  ?? '';
  const stats    = statsData?.data ?? { f1Total: 0, f2Total: 0, totalReferrals: 0, totalCommission: 0 };
  const downline = downlineData?.data ?? [];
  const commissions = commData?.data ?? [];
  const commSummary = commData?.summary ?? { totalEarned: 0, totalPending: 0 };

  const copyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(refLink || `${window.location.origin}/register?ref=${refCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <Users size={48} className="mx-auto mb-4 text-gray-700" />
        <p className="text-gray-400 text-lg font-medium">Vui lòng đăng nhập để xem chương trình giới thiệu</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Share2 size={20} className="text-purple-400" />
          Chương trình giới thiệu
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Giới thiệu bạn bè, nhận hoa hồng F1 5% — F2 2% lợi nhuận đầu tư.</p>
      </div>

      {/* Referral code card */}
      <div className="bg-gradient-to-br from-purple-900/30 via-purple-800/10 to-pink-900/20 border border-purple-700/30 rounded-2xl p-6">
        <p className="text-xs text-gray-400 mb-2">Mã giới thiệu của bạn</p>
        <div className="flex items-center gap-3">
          <p className="text-4xl font-black text-white tracking-widest">{refCode}</p>
          <button
            onClick={copyCode}
            className="p-2 bg-purple-700/40 hover:bg-purple-600/60 rounded-xl text-purple-300 transition-colors"
          >
            {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
          </button>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Share2 size={14} /> Sao chép đường dẫn giới thiệu
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Link:{' '}
          <span className="text-purple-300 font-mono text-[11px]">
            {refLink || `${window.location.origin}/register?ref=${refCode}`}
          </span>
        </p>
      </div>

      {/* Commission tiers info */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Hoa hồng F1', desc: 'Người được bạn giới thiệu trực tiếp', rate: '5%', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-900/30' },
          { label: 'Hoa hồng F2', desc: 'Người được F1 của bạn giới thiệu',     rate: '2%', color: 'text-blue-400 bg-blue-950/40 border-blue-900/30' },
        ].map(t => (
          <div key={t.label} className={`rounded-xl p-4 border ${t.color}`}>
            <p className="text-xs text-gray-400">{t.label}</p>
            <p className="text-3xl font-black text-white">{t.rate}</p>
            <p className="text-[10px] text-gray-500 mt-1">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'F1 trực tiếp',  val: stats.f1Total,          color: 'text-yellow-400', icon: Users    },
          { label: 'F2 gián tiếp',  val: stats.f2Total,          color: 'text-blue-400',   icon: Users    },
          { label: 'Tổng giới thiệu', val: stats.totalReferrals, color: 'text-white',      icon: Share2   },
          { label: 'Tổng hoa hồng', val: `${fmt(stats.totalCommission, 2)} USD`, color: 'text-green-400', icon: Gift },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <s.icon size={14} className={`mb-2 ${s.color}`} />
            <p className={`font-black text-xl ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'downline', 'commissions'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              tab === t ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {t === 'overview' ? 'Tổng quan' : t === 'downline' ? 'Danh sách giới thiệu' : 'Lịch sử hoa hồng'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Cách hoạt động</h3>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Chia sẻ mã giới thiệu', desc: 'Gửi mã hoặc đường dẫn của bạn cho bạn bè.' },
              { step: '2', title: 'Bạn bè đăng ký',        desc: 'Họ đăng ký tài khoản và nhập mã của bạn.' },
              { step: '3', title: 'Họ đầu tư',             desc: 'Khi F1 của bạn thực hiện đầu tư sinh lợi.' },
              { step: '4', title: 'Bạn nhận hoa hồng',     desc: 'Hoa hồng 5% (F1) hoặc 2% (F2) tự động vào ví mỗi ngày.' },
            ].map(s => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downline Tab */}
      {tab === 'downline' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-bold text-white">Danh sách giới thiệu</h2>
          </div>
          {downline.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={40} className="mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500">Chưa có người được giới thiệu</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {downline.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${ref.level === 1 ? 'bg-yellow-700' : 'bg-blue-800'} flex items-center justify-center text-xs font-bold text-white`}>
                      F{ref.level}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {ref.referred?.fullName || ref.referred?.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-gray-500">{ref.referred?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${
                      ref.referred?.kycStatus === 'verified' ? 'bg-green-950/60 text-green-400' : 'bg-gray-800 text-gray-400'
                    }`}>
                      {ref.referred?.kycStatus === 'verified' ? 'KYC' : 'Chưa KYC'}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">{fmtTime(ref.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commissions Tab */}
      {tab === 'commissions' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-950/40 border border-green-900/30 rounded-xl p-4">
              <p className="text-xs text-gray-400">Đã nhận</p>
              <p className="text-2xl font-black text-green-400">{fmt(commSummary.totalEarned, 2)} USD</p>
            </div>
            <div className="bg-yellow-950/40 border border-yellow-900/30 rounded-xl p-4">
              <p className="text-xs text-gray-400">Đang chờ</p>
              <p className="text-2xl font-black text-yellow-400">{fmt(commSummary.totalPending, 2)} USD</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-bold text-white">Lịch sử hoa hồng</h2>
            </div>
            {commissions.length === 0 ? (
              <div className="py-16 text-center">
                <Gift size={40} className="mx-auto mb-3 text-gray-700" />
                <p className="text-gray-500">Chưa có hoa hồng nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {commissions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full ${c.level === 1 ? 'bg-yellow-700' : 'bg-blue-800'} flex items-center justify-center text-[10px] font-bold text-white`}>
                        F{c.level}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Từ: {c.fromUser?.fullName || c.fromUser?.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-gray-500 capitalize">{c.source} · {fmtTime(c.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-400">+{fmt(parseFloat(c.amount), 2)} USD</p>
                      <div className={`flex items-center justify-end gap-1 text-[10px] ${c.status === 'paid' ? 'text-green-500' : 'text-yellow-400'}`}>
                        {c.status === 'paid' ? <CheckCircle size={9} /> : <Clock size={9} />}
                        {c.status === 'paid' ? 'Đã nhận' : 'Đang xử lý'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
