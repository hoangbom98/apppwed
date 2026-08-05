import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Gift, Clock, CheckCircle, Lock, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

// ── API helpers ───────────────────────────────────────────────────────────────
const getPromotions  = ()                 => api.get('/sports/promotions').then(r => r.data);
const getMyClaims    = ()                 => api.get('/sports/promotions/my').then(r => r.data);
const claimPromotion = (id: string)       => api.post(`/sports/promotions/${id}/claim`).then(r => r.data);

// ── Type label maps ────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  lucky_money:   { label: 'Lì xì',       color: 'from-red-600/20 to-orange-600/10 border-red-700/40' },
  bonus:         { label: 'Bonus',        color: 'from-green-600/20 to-emerald-600/10 border-green-700/40' },
  freebet:       { label: 'Free Bet',     color: 'from-blue-600/20 to-cyan-600/10 border-blue-700/40' },
  rebate:        { label: 'Hoàn tiền',    color: 'from-yellow-600/20 to-amber-600/10 border-yellow-700/40' },
  deposit_bonus: { label: 'Thưởng nạp',  color: 'from-purple-600/20 to-violet-600/10 border-purple-700/40' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(v: number) {
  return v.toLocaleString('vi-VN') + ' ₫';
}

// ── Promotion Card ────────────────────────────────────────────────────────────
function PromoCard({
  promo,
  claimedIds,
  onClaim,
  isClaiming,
  isLoggedIn,
}: {
  promo: any;
  claimedIds: Set<string>;
  onClaim: (id: string) => void;
  isClaiming: boolean;
  isLoggedIn: boolean;
}) {
  const cfg     = TYPE_LABELS[promo.type] ?? { label: promo.type, color: 'from-gray-600/20 to-gray-700/10 border-gray-700/40' };
  const claimed = claimedIds.has(promo.id);
  const now     = Date.now();
  const expired = new Date(promo.endDate).getTime() < now;
  const notYet  = new Date(promo.startDate).getTime() > now;

  return (
    <div className={`relative bg-gradient-to-br ${cfg.color} border rounded-2xl overflow-hidden`}>
      {/* Decorative gloss */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/3 -translate-y-8 translate-x-8" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
              <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase">{cfg.label}</span>
              <p className="font-bold text-white text-sm leading-tight">{promo.name}</p>
            </div>
          </div>
          {claimed && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-950/50 px-2 py-0.5 rounded-full">
              <CheckCircle size={10} /> Đã nhận
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="mb-3">
          <p className="text-2xl font-black text-white">{formatAmount(parseFloat(promo.value))}</p>
          {promo.minBet && (
            <p className="text-[11px] text-gray-400 mt-0.5">Cần cược tối thiểu {formatAmount(parseFloat(promo.minBet))}</p>
          )}
          {promo.maxClaim > 1 && (
            <p className="text-[11px] text-gray-400">Tối đa {promo.maxClaim} lần / người</p>
          )}
        </div>

        {promo.description && (
          <p className="text-xs text-gray-300 mb-3 leading-relaxed">{promo.description}</p>
        )}

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-3">
          <Clock size={10} />
          <span>{formatDate(promo.startDate)} → {formatDate(promo.endDate)}</span>
        </div>

        {/* CTA */}
        {!isLoggedIn ? (
          <Link to="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors">
            <Lock size={13} /> Đăng nhập để nhận
          </Link>
        ) : claimed ? (
          <div className="w-full py-2.5 bg-green-950/40 border border-green-800/30 rounded-xl text-sm text-green-400 font-semibold text-center">
            ✓ Đã nhận thành công
          </div>
        ) : expired ? (
          <div className="w-full py-2.5 bg-gray-800/60 rounded-xl text-sm text-gray-500 font-medium text-center">
            Đã hết hạn
          </div>
        ) : notYet ? (
          <div className="w-full py-2.5 bg-gray-800/60 rounded-xl text-sm text-gray-500 font-medium text-center">
            Chưa bắt đầu
          </div>
        ) : (
          <button
            onClick={() => onClaim(promo.id)}
            disabled={isClaiming}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {isClaiming ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
            ) : (
              <><Sparkles size={14} /> Nhận ngay</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PromotionsPage() {
  const { isLoggedIn } = useAuthStore();
  const qc = useQueryClient();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'available' | 'history'>('available');

  const { data: promosRes, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn:  getPromotions,
    staleTime: 60_000,
  });

  const { data: myRes, isLoading: myLoading } = useQuery({
    queryKey: ['my-promotions'],
    queryFn:  getMyClaims,
    enabled:  isLoggedIn,
    staleTime: 30_000,
  });

  const promos: any[]  = promosRes?.data || [];
  const myClaims: any[] = myRes?.data    || [];

  // Set of promotion IDs this user has already claimed
  const claimedIds = new Set<string>(myClaims.map((c: any) => c.promotionId));

  const claimMut = useMutation({
    mutationFn: (id: string) => claimPromotion(id),
    onSuccess: (_data: any, _id: string) => {
      setClaimingId(null);
      qc.invalidateQueries({ queryKey: ['my-promotions'] });
      qc.invalidateQueries({ queryKey: ['sports-wallet'] });
    },
    onError: () => setClaimingId(null),
  });

  const handleClaim = (id: string) => {
    setClaimingId(id);
    claimMut.mutate(id);
  };

  return (
    <div className="pb-6">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-red-900/70 via-orange-900/40 to-gray-900 px-5 py-6 overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={18} className="text-red-400" />
            <span className="text-red-400 text-xs font-semibold uppercase tracking-wide">Khuyến mãi</span>
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">Lì xì &amp; Bonus</h1>
          <p className="text-sm text-gray-400 mt-1">Nhận thưởng hàng ngày, hoàn tiền cược, lì xì may mắn</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-4 bg-gray-900">
        {(['available', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === t ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t === 'available' ? `Khuyến mãi (${promos.length})` : `Lịch sử nhận`}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Available Promotions */}
        {tab === 'available' && (
          <div>
            {isLoading && (
              <div className="grid gap-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-48 bg-gray-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            )}
            {!isLoading && promos.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p className="font-medium">Chưa có khuyến mãi nào</p>
                <p className="text-xs mt-1 text-gray-600">Quay lại sau để nhận ưu đãi mới nhất</p>
              </div>
            )}
            <div className="grid gap-3">
              {promos.map((p: any) => (
                <PromoCard
                  key={p.id}
                  promo={p}
                  claimedIds={claimedIds}
                  onClaim={handleClaim}
                  isClaiming={claimingId === p.id && claimMut.isPending}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>

            {/* Claim result toast area */}
            {claimMut.isSuccess && (
              <div className="mt-4 p-4 bg-green-950/60 border border-green-800/40 rounded-2xl text-center">
                <p className="text-green-400 font-bold text-base">{(claimMut.data as any)?.message}</p>
                <p className="text-xs text-gray-400 mt-1">Số dư đã được cập nhật vào ví của bạn</p>
              </div>
            )}

            {claimMut.isError && (
              <div className="mt-4 p-4 bg-red-950/60 border border-red-800/40 rounded-2xl text-center">
                <p className="text-red-400 font-semibold text-sm">
                  {(claimMut.error as any)?.response?.data?.message || 'Không thể nhận khuyến mãi. Vui lòng thử lại.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Claim History */}
        {tab === 'history' && (
          <div>
            {!isLoggedIn && (
              <div className="text-center py-16 text-gray-500">
                <Lock size={32} className="mx-auto mb-3 text-gray-600" />
                <p className="font-medium">Đăng nhập để xem lịch sử</p>
                <Link to="/login" className="inline-block mt-4 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold">
                  Đăng nhập
                </Link>
              </div>
            )}
            {isLoggedIn && myLoading && (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
            )}
            {isLoggedIn && !myLoading && myClaims.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p>Chưa nhận khuyến mãi nào</p>
              </div>
            )}
            <div className="space-y-2">
              {myClaims.map((c: any) => (
                <div key={c.id} className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{c.promotion?.name ?? 'Khuyến mãi'}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(c.claimedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-sm">+{formatAmount(parseFloat(c.amount))}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
