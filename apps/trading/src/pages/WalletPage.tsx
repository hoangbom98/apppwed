import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWallet, getWalletHistory, createWithdrawal } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useState } from 'react';

type Mode = 'overview' | 'withdraw';

const WITHDRAW_METHODS = [
  { id: 'bank',  label: 'Ngân hàng', time: '15–60 phút' },
  { id: 'usdt',  label: 'USDT',      time: '5–15 phút'  },
];

export default function WalletPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [mode, setMode]     = useState<Mode>('overview');
  const [amount, setAmount] = useState('');
  const [wMethod, setWMethod] = useState('bank');
  const [bankInfo, setBankInfo] = useState('');
  const [msg, setMsg]       = useState('');

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn:  () => getWallet(),
    enabled:  !!user,
  });
  const { data: histData } = useQuery({
    queryKey: ['wallet-history'],
    queryFn:  () => getWalletHistory(),
    enabled:  !!user,
  });

  const wallet  = walletData?.data ?? null;
  const balance = parseFloat(String(wallet?.balance ?? 0));
  const frozen  = parseFloat(String(wallet?.frozen  ?? 0));
  // Transaction model: id, userId, amount, type, referenceId, referenceType, note, balanceAfter, createdAt
  // No status field — display type-based icon instead
  const history: any[] = histData?.data ?? [];

  const withdrawMut = useMutation({
    mutationFn: (vars: any) => createWithdrawal(vars),
    onSuccess: () => {
      setMsg('Yêu cầu rút tiền đã gửi. Đang xử lý.');
      setAmount('');
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: (e: any) => setMsg(e.response?.data?.message || 'Lỗi rút tiền'),
  });

  const handleWithdraw = () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) { setMsg('Nhập số tiền hợp lệ'); return; }
    if (amtNum > balance - frozen) { setMsg('Số dư khả dụng không đủ'); return; }
    setMsg('');
    withdrawMut.mutate({
      amount:   amtNum,
      method:   wMethod,
      bankInfo: wMethod === 'bank' ? { raw: bankInfo } : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Balance banner */}
      <div className="relative bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-blue-400" />
            <p className="text-xs text-gray-400 font-medium">Số dư khả dụng</p>
          </div>
          <p className="text-4xl font-black text-white">
            {fmt(balance - frozen, 2)} <span className="text-xl text-gray-400">USD</span>
          </p>
          {frozen > 0 && (
            <p className="text-xs text-yellow-400 mt-1">{fmt(frozen, 2)} USD đang khóa</p>
          )}
        </div>
        <div className="relative z-10 flex gap-3 mt-5">
          {/* Deposit → dedicated page */}
          <Link
            to="/deposit"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <ArrowUpRight size={16} />Nạp tiền
          </Link>
          <button
            onClick={() => { setMode('withdraw'); setMsg(''); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <ArrowDownLeft size={16} />Rút tiền
          </button>
        </div>
      </div>

      {/* Withdraw form */}
      {mode === 'withdraw' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-base">Rút tiền</h2>
            <button onClick={() => setMode('overview')} className="text-gray-500 hover:text-white text-xs">Đóng</button>
          </div>

          {/* Method */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {WITHDRAW_METHODS.map(m => (
              <button key={m.id} onClick={() => setWMethod(m.id)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  wMethod === m.id
                    ? 'bg-orange-950/40 border-orange-600/50 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}>
                <p className="text-[11px] font-semibold">{m.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{m.time}</p>
              </button>
            ))}
          </div>

          {/* Bank info */}
          {wMethod === 'bank' && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Thông tin ngân hàng nhận</label>
              <input
                value={bankInfo} onChange={e => setBankInfo(e.target.value)}
                placeholder="VCB – 1234567890 – NGUYEN VAN A"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          )}

          {/* Amount */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">
              Số tiền (khả dụng: <span className="text-white">{fmt(balance - frozen, 2)} USD</span>)
            </label>
            <div className="relative">
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Nhập số tiền..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USD</span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-4">
            {[100, 500, 1000, 5000].map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold">
                {v.toLocaleString()}
              </button>
            ))}
          </div>

          {msg && (
            <div className={`mb-3 p-3 rounded-xl text-xs font-medium ${
              msg.startsWith('Yêu cầu') ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
            }`}>{msg}</div>
          )}

          <button
            onClick={handleWithdraw} disabled={withdrawMut.isPending}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            {withdrawMut.isPending ? 'Đang gửi...' : 'Xác nhận rút tiền'}
          </button>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-bold text-white">Lịch sử giao dịch</h2>
        </div>
        {history.length === 0 ? (
          <div className="py-10 text-center bn-muted text-sm">Chưa có giao dịch nào</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
            {history.map((tx: any) => {
              // deposit, profit, referral, trade_close = credit; withdraw, trade_open, fee = debit
              const isCredit = ['deposit', 'profit', 'referral', 'trade_close', 'bonus'].includes(tx.type);
              const amt = parseFloat(tx.amount ?? 0);
              return (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isCredit ? 'bg-green-950/60 text-green-400' : 'bg-orange-950/60 text-orange-400'}`}>
                      {isCredit ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.note || tx.type}</p>
                      <p className="text-[10px] bn-muted">{fmtTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${isCredit ? 'text-green-400' : 'text-orange-400'}`}>
                      {isCredit ? '+' : ''}{fmt(amt, 2)} USD
                    </p>
                    <p className="text-[10px] bn-muted">Số dư: {fmt(parseFloat(tx.balanceAfter ?? 0), 2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
