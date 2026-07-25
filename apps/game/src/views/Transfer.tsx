/**
 * Transfer.tsx — Chuyển tiền nội bộ
 * Features: transfer to other user, history, trading password required
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, History, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { transferToUser, getTransferHistory, getWalletBalance } from '@/api/transfer';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];

export default function Transfer() {
  const qc = useQueryClient();
  const [tab, setTab]         = useState<'send' | 'history'>('send');
  const [toUser, setToUser]   = useState('');
  const [amount, setAmount]   = useState('');
  const [pwd, setPwd]         = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn:  getWalletBalance,
    select:   (r: any) => r?.data ?? r,
  });

  const { data: history = [], isLoading: histLoading } = useQuery({
    queryKey: ['transfer-history'],
    queryFn:  getTransferHistory,
    enabled:  tab === 'history',
    select:   (r: any) => r?.data ?? [],
  });

  const mut = useMutation({
    mutationFn: transferToUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['transfer-history'] });
      toast.success('Chuyển tiền thành công!');
      setToUser(''); setAmount(''); setPwd('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const available = wallet ? parseFloat(wallet.balance) - parseFloat(wallet.frozen || 0) : 0;

  return (
    <div className="min-h-screen bg-dark pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
           style={{ background: 'var(--game-primary)' }}>
        <button onClick={() => window.history.back()} className="p-1 text-white">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1">Chuyển tiền</h1>
        <button onClick={() => setTab(t => t === 'send' ? 'history' : 'send')}
                className="text-white/70 hover:text-white">
          <History size={20} />
        </button>
      </div>

      {/* Balance card */}
      <div className="mx-4 mt-4 rounded-2xl p-4 text-white"
           style={{ background: 'linear-gradient(135deg, var(--game-primary), #0f7a4e)' }}>
        <p className="text-xs opacity-70">Số dư khả dụng</p>
        <p className="text-2xl font-black mt-1">{formatVND(available)}</p>
      </div>

      {tab === 'send' ? (
        <div className="mx-4 mt-4 space-y-4">
          {/* To user */}
          <div className="game-card rounded-xl p-4">
            <label className="text-xs text-gray-400 block mb-2">Tên đăng nhập người nhận</label>
            <input
              value={toUser}
              onChange={e => setToUser(e.target.value)}
              placeholder="Nhập username hoặc email"
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none"
            />
          </div>

          {/* Amount */}
          <div className="game-card rounded-xl p-4">
            <label className="text-xs text-gray-400 block mb-2">Số tiền</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    amount === String(a)
                      ? 'text-black border-transparent'
                      : 'text-gray-400 border-white/10 bg-white/5'
                  }`}
                  style={amount === String(a) ? { background: 'var(--game-accent)' } : {}}
                >
                  {formatVND(a)}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Hoặc nhập số tiền"
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none"
              />
              <button onClick={() => setAmount(String(Math.floor(available)))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: 'var(--game-accent)' }}>
                Tất cả
              </button>
            </div>
          </div>

          {/* Trading password */}
          <div className="game-card rounded-xl p-4">
            <label className="text-xs text-gray-400 block mb-2">Mật khẩu giao dịch</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={pwd}
                onChange={e => setPwd(e.target.value)}
                placeholder="6 chữ số"
                maxLength={6}
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none pr-12"
              />
              <button onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {showPwd ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-yellow-400 bg-yellow-400/5 rounded-xl p-3">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>Vui lòng kiểm tra kỹ thông tin người nhận. Giao dịch không thể hoàn tác.</span>
          </div>

          {/* Submit */}
          <button
            disabled={!toUser || !amount || Number(amount) <= 0 || !pwd || pwd.length < 6 || mut.isPending}
            onClick={() => mut.mutate({ toUsername: toUser, amount: Number(amount), tradingPassword: pwd  })}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: 'var(--game-accent)', color: '#000' }}
          >
            <Send size={16} />
            {mut.isPending ? 'Đang xử lý...' : 'Chuyển tiền'}
          </button>
        </div>
      ) : (
        <div className="mx-4 mt-4 space-y-2">
          {histLoading
            ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            : history.length === 0
            ? <div className="text-center py-16 text-gray-500 text-sm">Chưa có lịch sử chuyển tiền</div>
            : history.map((t: any) => (
              <div key={t.id} className="game-card rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{t.createdAt?.slice(0, 16)}</p>
                  <p className="text-sm text-white font-semibold mt-0.5">{t.note}</p>
                </div>
                <p className={`text-sm font-bold ${parseFloat(t.amount) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(t.amount) > 0 ? '+' : ''}{formatVND(Math.abs(parseFloat(t.amount)))}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
