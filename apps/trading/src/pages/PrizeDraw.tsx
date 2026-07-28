import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Trophy, History, Sparkles, Loader2, FileText } from 'lucide-react';
import {
  getPrizeConfigs,
  getRecentWinners,
  getMyPrizeRecords,
  drawPrize,
} from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import type { PrizeConfig } from '@/types';

const RARITY_COLORS = [
  'from-yellow-500 to-amber-700',
  'from-blue-500 to-indigo-700',
  'from-purple-500 to-pink-700',
  'from-green-500 to-emerald-700',
  'from-red-500 to-rose-700',
];

export default function PrizeDrawPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab]   = useState<'draw' | 'my' | 'recent'>('draw');
  const [msg, setMsg]   = useState('');
  const [winner, setWinner] = useState<{ title: string; amount: number } | null>(null);

  const { data: prizeData, isLoading: prizeLoading } = useQuery({
    queryKey: ['prize-configs'],
    queryFn:  () => getPrizeConfigs(),
  });

  const { data: recentData } = useQuery({
    queryKey: ['prize-recent'],
    queryFn:  () => getRecentWinners(),
    enabled:  tab === 'recent',
  });

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['prize-my'],
    queryFn:  () => getMyPrizeRecords(),
    enabled:  !!user && tab === 'my',
  });

  const prizes   = prizeData?.data  ?? [];
  const recent   = recentData?.data ?? [];
  const myRecords = myData?.data    ?? [];

  const drawMut = useMutation({
    mutationFn: (prizeId: string) => drawPrize({ prizeId }),
    onSuccess: (data) => {
      const record = data.data;
      const prizeTitle  = (record as { prize?: { title?: string } }).prize?.title ?? 'Phần thưởng';
      const prizeAmount = (record as { prize?: { prizeAmount?: number } }).prize?.prizeAmount ?? 0;
      setWinner({ title: prizeTitle, amount: Number(prizeAmount) });
      setMsg('');
      qc.invalidateQueries({ queryKey: ['prize-my'] });
      qc.invalidateQueries({ queryKey: ['prize-recent'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setMsg(err.response?.data?.message ?? 'Không đủ điểm hoặc đã hết lượt quay');
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-pink-950/50 border border-pink-800/30">
          <Gift size={20} className="text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Vòng quay may mắn</h1>
          <p className="text-xs text-gray-500">Dùng điểm tích luỹ để quay nhận thưởng</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {(['draw', 'my', 'recent'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setMsg(''); setWinner(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-pink-700 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t === 'draw' ? <><Gift size={13} className="inline mr-1" />Quay thưởng</> : t === 'my' ? <><Trophy size={13} className="inline mr-1" />Của tôi</> : <><FileText size={13} className="inline mr-1" />Gần đây</>}
          </button>
        ))}
      </div>

      {/* Draw tab */}
      {tab === 'draw' && (
        <>
          {/* Win overlay */}
          {winner && (
            <div className="relative bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/40 rounded-2xl p-6 text-center">
              <div className="mb-3"><Gift size={48} style={{ color: '#eab308' }} className="mx-auto" /></div>
              <p className="text-white font-black text-xl">Chúc mừng!</p>
              <p className="text-yellow-400 font-bold text-lg mt-1">{winner.title}</p>
              {winner.amount > 0 && (
                <p className="text-green-400 font-black text-2xl mt-1">+${fmt(winner.amount, 2)}</p>
              )}
              <button onClick={() => setWinner(null)}
                className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl text-sm transition-colors">
                Quay tiếp
              </button>
            </div>
          )}

          {prizeLoading && (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-pink-400" /></div>
          )}

          {msg && (
            <div className="p-3 rounded-xl text-xs font-medium bg-red-950 text-red-400 border border-red-900">{msg}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((p: PrizeConfig, idx: number) => {
              const color  = RARITY_COLORS[idx % RARITY_COLORS.length];
              const inStock = p.stock === -1 || p.stock > 0;
              return (
                <div key={p.id}
                  className={`relative bg-gray-900 border rounded-2xl p-5 transition-all ${
                    inStock ? 'border-gray-800 hover:border-pink-700/40' : 'border-gray-800 opacity-50'
                  }`}>
                  {/* Prize icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3`}>
                    <Trophy size={28} className="text-white" />
                  </div>
                  <p className="font-bold text-white text-center">{p.title}</p>
                  {p.description && (
                    <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">{p.description}</p>
                  )}
                  {Number(p.prizeAmount) > 0 && (
                    <p className="text-green-400 font-black text-center text-lg mt-2">
                      ${fmt(Number(p.prizeAmount), 2)}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-[11px]">
                    <span className="flex items-center gap-1 text-pink-400 font-semibold">
                      <Sparkles size={10} /> {p.costPoints} điểm
                    </span>
                    {p.stock !== -1 && (
                      <span className="text-gray-500">Còn: {p.stock}</span>
                    )}
                  </div>
                  {user && inStock && (
                    <button
                      onClick={() => drawMut.mutate(p.id)}
                      disabled={drawMut.isPending}
                      className="w-full mt-3 py-2.5 bg-pink-700 hover:bg-pink-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50">
                      {drawMut.isPending ? 'Đang quay...' : `Quay (${p.costPoints} điểm)`}
                    </button>
                  )}
                  {!user && (
                    <p className="text-center text-xs text-gray-500 mt-3">Đăng nhập để quay</p>
                  )}
                  {!inStock && (
                    <p className="text-center text-xs text-red-400 mt-3 font-semibold">Đã hết</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* My records */}
      {tab === 'my' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <History size={14} className="text-pink-400" />
            <h2 className="font-bold text-white">Lịch sử quay thưởng của tôi</h2>
          </div>
          {myLoading && <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-pink-400 mx-auto" /></div>}
          {!myLoading && myRecords.length === 0 && (
            <div className="p-8 text-center text-gray-500">Bạn chưa quay lần nào</div>
          )}
          <div className="divide-y divide-gray-800/50">
            {myRecords.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-pink-950/40 text-pink-400">
                    <Trophy size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{r.prize?.title ?? '—'}</p>
                    <p className="text-[10px] text-gray-500">{fmtTime(r.createdAt)}</p>
                  </div>
                </div>
                {r.prize && Number(r.prize.prizeAmount) > 0 ? (
                  <p className="font-bold text-green-400 text-sm">+${fmt(Number(r.prize.prizeAmount), 2)}</p>
                ) : (
                  <span className="text-[11px] text-gray-500 capitalize">{r.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent winners */}
      {tab === 'recent' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            <h2 className="font-bold text-white">Người trúng thưởng gần đây</h2>
          </div>
          {recent.length === 0 && (
            <div className="p-8 text-center text-gray-500">Chưa có lịch sử</div>
          )}
          <div className="divide-y divide-gray-800/50">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-white">{r.prize?.title ?? '—'}</p>
                  <p className="text-[10px] text-gray-500">{fmtTime(r.createdAt)}</p>
                </div>
                {r.prize && Number(r.prize.prizeAmount) > 0 && (
                  <p className="font-bold text-yellow-400 text-sm">${fmt(Number(r.prize.prizeAmount), 2)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
