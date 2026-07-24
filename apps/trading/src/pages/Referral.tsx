import { useQuery } from '@tanstack/react-query';
import { Users, Gift, Copy, CheckCircle, TrendingUp, Link as LinkIcon } from 'lucide-react';
import { getReferralCode, getReferralTree, getReferralSummary, getReferralCommissions } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import { useState } from 'react';

export default function ReferralPage() {
  const { user } = useAuthStore();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl]   = useState(false);
  const [tab, setTab] = useState<'tree' | 'commission'>('tree');

  const { data: codeData } = useQuery({
    queryKey: ['referral-code'],
    queryFn:  () => getReferralCode(),
    enabled:  !!user,
  });
  const { data: summaryData } = useQuery({
    queryKey: ['referral-summary'],
    queryFn:  () => getReferralSummary(),
    enabled:  !!user,
  });
  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['referral-tree'],
    queryFn:  () => getReferralTree(),
    enabled:  !!user && tab === 'tree',
  });
  const { data: commData, isLoading: commLoading } = useQuery({
    queryKey: ['referral-commissions'],
    queryFn:  () => getReferralCommissions(),
    enabled:  !!user && tab === 'commission',
  });

  const code        = codeData?.data?.code        ?? '—';
  const referralUrl = codeData?.data?.referralUrl  ?? '';
  const summary     = summaryData?.data ?? { f1Count: 0, f2Count: 0, totalCommission: 0 };
  const f1          = treeData?.data?.f1  ?? [];
  const f2          = treeData?.data?.f2  ?? [];
  const commissions = commData?.data       ?? [];

  const copy = (text: string, which: 'code' | 'url') => {
    navigator.clipboard.writeText(text);
    if (which === 'code') { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
    else                  { setCopiedUrl(true);  setTimeout(() => setCopiedUrl(false),  2000); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 rounded-xl bg-pink-950/50 border border-pink-800/30">
          <Gift size={20} className="text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Giới thiệu</h1>
          <p className="text-xs text-gray-500">Giới thiệu bạn bè, nhận hoa hồng F1/F2</p>
        </div>
      </div>

      {/* Referral code card */}
      <div className="relative bg-gradient-to-br from-pink-600/20 via-purple-600/10 to-indigo-600/20 border border-pink-500/20 rounded-2xl p-6 overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs text-gray-400 mb-3 font-medium">Mã giới thiệu của bạn</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl font-black tracking-widest text-white font-mono">{code}</div>
            <button onClick={() => copy(code, 'code')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              {copiedCode ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-300" />}
            </button>
          </div>
          {referralUrl && (
            <div className="flex items-center gap-2 p-3 bg-black/30 rounded-xl">
              <LinkIcon size={13} className="text-gray-400 flex-shrink-0" />
              <p className="text-xs text-blue-300 font-mono flex-1 truncate">{referralUrl}</p>
              <button onClick={() => copy(referralUrl, 'url')}
                className="flex-shrink-0 p-1 hover:text-white text-gray-400 transition-colors">
                {copiedUrl ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <Users size={16} className="text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{summary.f1Count}</p>
          <p className="text-xs text-gray-500 mt-0.5">F1 trực tiếp</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <Users size={16} className="text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-white">{summary.f2Count}</p>
          <p className="text-xs text-gray-500 mt-0.5">F2 gián tiếp</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <TrendingUp size={16} className="text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-black text-green-400">{fmt(summary.totalCommission, 2)}</p>
          <p className="text-xs text-gray-500 mt-0.5">USD hoa hồng</p>
        </div>
      </div>

      {/* Commission rates info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-950/30 border border-blue-800/20 rounded-xl p-4">
          <p className="text-xs text-blue-400 font-semibold mb-1">Hoa hồng F1</p>
          <p className="text-2xl font-black text-white">5%</p>
          <p className="text-xs text-gray-500 mt-1">Trên mỗi khoản đầu tư của người bạn giới thiệu trực tiếp</p>
        </div>
        <div className="bg-purple-950/30 border border-purple-800/20 rounded-xl p-4">
          <p className="text-xs text-purple-400 font-semibold mb-1">Hoa hồng F2</p>
          <p className="text-2xl font-black text-white">2%</p>
          <p className="text-xs text-gray-500 mt-1">Trên mỗi khoản đầu tư của người F1 của bạn giới thiệu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {(['tree', 'commission'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-pink-700 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t === 'tree' ? '👥 Mạng lưới' : '💰 Hoa hồng'}
          </button>
        ))}
      </div>

      {/* Tree tab */}
      {tab === 'tree' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {treeLoading && <div className="p-8 text-center text-gray-500">Đang tải...</div>}
          {!treeLoading && f1.length === 0 && (
            <div className="p-8 text-center text-gray-500">Chưa có ai đăng ký qua mã của bạn</div>
          )}
          {f1.length > 0 && (
            <>
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <Users size={14} className="text-blue-400" />
                <span className="font-bold text-white text-sm">F1 — Trực tiếp ({f1.length})</span>
              </div>
              <div className="divide-y divide-gray-800/50">
                {f1.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-medium text-white text-sm">{r.user?.fullName ?? r.user?.email ?? r.referredId}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{r.user?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">{fmtTime(r.createdAt)}</p>
                      <span className={`text-[10px] ${r.user?.kycStatus === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {r.user?.kycStatus === 'verified' ? '✓ KYC' : 'Chờ KYC'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {f2.length > 0 && (
            <>
              <div className="p-4 border-t border-b border-gray-800 flex items-center gap-2">
                <Users size={14} className="text-purple-400" />
                <span className="font-bold text-white text-sm">F2 — Gián tiếp ({f2.length})</span>
              </div>
              <div className="divide-y divide-gray-800/50">
                {f2.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="font-medium text-white text-sm">{r.user?.fullName ?? r.user?.email ?? r.referredId}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{r.user?.email}</p>
                    </div>
                    <p className="text-[10px] text-gray-500">{fmtTime(r.createdAt)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Commission tab */}
      {tab === 'commission' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <TrendingUp size={14} className="text-green-400" />
            <span className="font-bold text-white text-sm">Lịch sử hoa hồng</span>
          </div>
          {commLoading && <div className="p-8 text-center text-gray-500">Đang tải...</div>}
          {!commLoading && commissions.length === 0 && (
            <div className="p-8 text-center text-gray-500">Chưa có hoa hồng nào</div>
          )}
          <div className="divide-y divide-gray-800/50">
            {commissions.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-white">Hoa hồng F{c.level}</p>
                  <p className="text-[10px] text-gray-500">{fmtTime(c.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400 text-sm">+{fmt(Number(c.amount), 2)} USD</p>
                  <p className={`text-[10px] ${c.status === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {c.status === 'PAID' ? 'Đã nhận' : 'Đang xử lý'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
