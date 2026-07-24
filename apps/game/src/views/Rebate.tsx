/**
 * Rebate.tsx — Hoàn trả hàng ngày (Fanshui)
 * Học từ /var/www/wap/src/views/account/Fanshui.vue
 * Features: available rebate amount, claim button, history table, rates by VIP
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRebateStatus, claimRebate, getRebateHistory, getRebateRates } from '@/api/rebate';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

const STATUS_LABELS: Record<number, { label: string; cls: string }> = {
  0: { label: 'Đang duyệt', cls: 'text-yellow-500 bg-yellow-500/10' },
  1: { label: 'Đã duyệt',   cls: 'text-green-500  bg-green-500/10'  },
};

export default function Rebate() {
  const qc   = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'history' | 'rates'>('overview');

  const { data: status, isLoading: stLoading } = useQuery({
    queryKey: ['rebate-status'],
    queryFn:  getRebateStatus,
  });

  const { data: history, isLoading: histLoading } = useQuery<any[]>({
    queryKey: ['rebate-history'],
    queryFn:  () => getRebateHistory(),
    enabled:  tab === 'history',
  });

  const { data: rates, isLoading: ratesLoading } = useQuery<any[]>({
    queryKey: ['rebate-rates'],
    queryFn:  () => getRebateRates(),
    enabled:  tab === 'rates',
  });

  const claimMut = useMutation({
    mutationFn: claimRebate,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['rebate-status'] });
      qc.invalidateQueries({ queryKey: ['rebate-history'] });
      toast.success(`Đã nhận hoàn trả ${formatVND(res?.data?.amount || 0)}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const histList   = history ?? [];
  const ratesList  = rates   ?? [];
  const available  = (status as any)?.data?.available ?? 0;
  const canClaim   = (status as any)?.data?.canClaim  ?? false;
  const betAmount  = (status as any)?.data?.betAmount ?? 0;
  const rate       = (status as any)?.data?.rate      ?? '0%';

  return (
    <div className="min-h-screen bg-dark pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
           style={{ background: 'var(--game-primary)' }}>
        <button onClick={() => history.length > 0 ? null : window.history.back()}
                className="p-1 text-white">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1">Hoàn trả hàng ngày</h1>
      </div>

      {/* Stats card */}
      <div className="mx-4 mt-4 rounded-2xl p-4 text-white"
           style={{ background: 'linear-gradient(135deg, var(--game-primary), #0f7a4e)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs opacity-75 mb-1">Hoàn trả khả dụng</p>
            {stLoading ? (
              <div className="h-8 w-32 rounded shimmer-bg" />
            ) : (
              <p className="text-2xl font-black">{formatVND(available)}</p>
            )}
            <p className="text-xs opacity-60 mt-1">Cược hôm qua: {formatVND(betAmount)} · Tỷ lệ: {rate}</p>
          </div>
          <Gift size={40} className="opacity-30" />
        </div>

        <button
          disabled={!canClaim || available <= 0 || claimMut.isPending}
          onClick={() => claimMut.mutate()}
          className="mt-4 w-full py-2.5 rounded-xl font-bold text-sm transition-opacity disabled:opacity-40"
          style={{ background: 'var(--game-accent)', color: '#000' }}
        >
          {claimMut.isPending ? 'Đang xử lý...' : canClaim && available > 0 ? 'Nhận ngay' : 'Đã nhận hôm nay'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mx-4 mt-4 rounded-xl overflow-hidden border border-white/10">
        {(['overview', 'history', 'rates'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              tab === t
                ? 'text-white'
                : 'text-gray-400 bg-white/5'
            }`}
            style={tab === t ? { background: 'var(--game-primary)' } : {}}
          >
            {t === 'overview' ? 'Tổng quan' : t === 'history' ? 'Lịch sử' : 'Tỷ lệ VIP'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="mx-4 mt-4 space-y-3">
          <div className="game-card p-4 rounded-xl">
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--game-accent)' }}>Hướng dẫn</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex gap-2"><CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" /> Mỗi ngày chỉ nhận 1 lần hoàn trả.</li>
              <li className="flex gap-2"><CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" /> Hoàn trả tính dựa trên cược hợp lệ ngày hôm qua.</li>
              <li className="flex gap-2"><CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" /> Tỷ lệ hoàn trả phụ thuộc vào cấp VIP.</li>
              <li className="flex gap-2"><AlertCircle size={14} className="text-yellow-500 shrink-0 mt-0.5" /> Sau 24:00 mỗi ngày, hoàn trả sẽ được tính lại.</li>
            </ul>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="mx-4 mt-4">
          {histLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">Chưa có lịch sử</div>
          ) : (
            <div className="space-y-2">
              {history.map((item: any) => (
                <div key={item.id} className="game-card rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{item.createdAt?.slice(0, 16)}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      Cược: {formatVND(item.betAmount)} · Tỷ lệ: {item.rate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--game-accent)' }}>
                      +{formatVND(item.amount)}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_LABELS[item.status]?.cls}`}>
                      {STATUS_LABELS[item.status]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rates tab */}
      {tab === 'rates' && (
        <div className="mx-4 mt-4">
          {ratesLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <div className="game-card rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--game-primary)' }}>
                    <th className="py-3 px-3 text-left text-white font-semibold">Cấp VIP</th>
                    <th className="py-3 px-3 text-right text-white font-semibold">Thể thao</th>
                    <th className="py-3 px-3 text-right text-white font-semibold">Casino</th>
                    <th className="py-3 px-3 text-right text-white font-semibold">Xổ số</th>
                  </tr>
                </thead>
                <tbody>
                  {(ratesList.length ? ratesList : [
                    { vip: 'VIP 1', sports: '0.3%', casino: '0.4%', lottery: '0.2%' },
                    { vip: 'VIP 2', sports: '0.4%', casino: '0.5%', lottery: '0.3%' },
                    { vip: 'VIP 3', sports: '0.5%', casino: '0.6%', lottery: '0.4%' },
                    { vip: 'VIP 4', sports: '0.6%', casino: '0.7%', lottery: '0.5%' },
                    { vip: 'VIP 5', sports: '0.8%', casino: '0.9%', lottery: '0.7%' },
                  ]).map((r: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                      <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--game-accent)' }}>{r.vip}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{r.sports}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{r.casino}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300">{r.lottery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
