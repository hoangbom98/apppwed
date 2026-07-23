import { useQuery } from '@tanstack/react-query';
import { getWallet, getWalletHistory, createDeposit, createWithdrawal } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Copy, QrCode } from 'lucide-react';
import { useState } from 'react';

type Mode = 'overview' | 'deposit' | 'withdraw';

const MOCK_BALANCES = [
  { asset:'USDT', free:3820.50,  locked:400,   icon:'💵' },
  { asset:'BTC',  free:0.05820,  locked:0.005, icon:'🟠' },
  { asset:'ETH',  free:1.24500,  locked:0,     icon:'💎' },
  { asset:'BNB',  free:5.80000,  locked:0,     icon:'🟡' },
  { asset:'SOL',  free:12.00000, locked:5,     icon:'🟣' },
];

const MOCK_HISTORY = [
  { id:1, type:'deposit',  amount:1000,  asset:'USDT', status:'completed', createdAt: new Date(Date.now()-86400000).toISOString(),  note:'Nạp USDT BEP20' },
  { id:2, type:'withdraw', amount:500,   asset:'USDT', status:'completed', createdAt: new Date(Date.now()-172800000).toISOString(), note:'Rút về Vietcombank' },
  { id:3, type:'deposit',  amount:2500,  asset:'USDT', status:'pending',   createdAt: new Date(Date.now()-3600000).toISOString(),   note:'Nạp bank chuyển khoản' },
  { id:4, type:'withdraw', amount:300,   asset:'USDT', status:'rejected',  createdAt: new Date(Date.now()-259200000).toISOString(), note:'Rút về Techcombank' },
  { id:5, type:'deposit',  amount:0.01,  asset:'BTC',  status:'completed', createdAt: new Date(Date.now()-432000000).toISOString(), note:'Nạp BTC on-chain' },
];

const DEPOSIT_METHODS = [
  { id:'bank',   label:'Chuyển khoản ngân hàng', icon:'🏦', fee:'0 đ',    note:'15 - 30 phút' },
  { id:'usdt',   label:'USDT (BEP20 / TRC20)',   icon:'💵', fee:'1 USDT', note:'5 - 10 phút'  },
  { id:'crypto', label:'Crypto on-chain',         icon:'₿',  fee:'Mạng',  note:'10 - 60 phút' },
];

export default function WalletPage() {
  const { user } = useAuthStore();
  const [mode, setMode]     = useState<Mode>('overview');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('usdt');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);

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

  const balances = walletData?.data ?? MOCK_BALANCES;
  const history  = histData?.data  ?? MOCK_HISTORY;

  const totalUSDT = balances.reduce((s: number, b: any) => {
    if (b.asset === 'USDT') return s + b.free + b.locked;
    // simplified: assume 1:1000 for others
    return s;
  }, 0);

  const copyAddress = () => {
    navigator.clipboard.writeText('0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B');
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) { setMsg('Nhập số tiền hợp lệ'); return; }
    setLoading(true); setMsg('');
    try {
      await createDeposit({ amount: parseFloat(amount), paymentMethod: method, currency: 'USDT' });
      setMsg('✅ Yêu cầu nạp tiền đã được gửi. Chờ xác nhận.');
      setAmount('');
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Lỗi nạp tiền');
    } finally { setLoading(false); }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) { setMsg('Nhập số tiền hợp lệ'); return; }
    setLoading(true); setMsg('');
    try {
      await createWithdrawal({ amount: parseFloat(amount), paymentMethod: method, currency: 'USDT' });
      setMsg('✅ Yêu cầu rút tiền đã được gửi. Đang xử lý.');
      setAmount('');
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Lỗi rút tiền');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Total balance banner */}
      <div className="relative bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-blue-400" />
            <p className="text-xs text-gray-400 font-medium">Tổng tài sản ước tính</p>
          </div>
          <p className="text-4xl font-black text-white">{fmt(totalUSDT, 2)} <span className="text-xl text-gray-400">USDT</span></p>
          <p className="text-xs text-gray-500 mt-1">≈ {(totalUSDT * 24500).toLocaleString('vi-VN')} ₫</p>
        </div>
        <div className="relative z-10 flex gap-3 mt-5">
          <button
            onClick={() => { setMode('deposit'); setMsg(''); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <ArrowUpRight size={16} />Nạp tiền
          </button>
          <button
            onClick={() => { setMode('withdraw'); setMsg(''); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <ArrowDownLeft size={16} />Rút tiền
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw form */}
      {(mode === 'deposit' || mode === 'withdraw') && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-base">
              {mode === 'deposit' ? '💰 Nạp tiền' : '💸 Rút tiền'}
            </h2>
            <button onClick={() => setMode('overview')} className="text-gray-500 hover:text-white text-xs">✕ Đóng</button>
          </div>

          {/* Method selection */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DEPOSIT_METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  method === m.id
                    ? 'bg-blue-950/50 border-blue-600/50 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <p className="text-lg mb-1">{m.icon}</p>
                <p className="text-[11px] font-semibold leading-tight">{m.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{m.note}</p>
              </button>
            ))}
          </div>

          {/* USDT address (deposit only) */}
          {mode === 'deposit' && method === 'usdt' && (
            <div className="mb-4 p-4 bg-gray-800 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">Địa chỉ ví USDT (BEP20)</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-blue-400 flex-1 truncate">
                  0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B
                </p>
                <button onClick={copyAddress} className="p-1.5 text-gray-400 hover:text-white">
                  {copiedAddr ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
                <QrCode size={14} className="text-gray-400" />
              </div>
              <p className="text-[10px] text-yellow-400 mt-2">⚠ Chỉ gửi USDT BEP20. Tài sản khác sẽ mất vĩnh viễn.</p>
            </div>
          )}

          {/* Amount */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">Số tiền (USDT)</label>
            <div className="relative">
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Nhập số tiền..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">USDT</span>
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
              msg.startsWith('✅') ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
            }`}>{msg}</div>
          )}

          <button
            onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
              mode === 'deposit' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
          >
            {loading ? 'Đang xử lý...' : mode === 'deposit' ? 'Xác nhận nạp tiền' : 'Xác nhận rút tiền'}
          </button>
        </div>
      )}

      {/* Asset list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-bold text-white">Danh sách tài sản</h2>
        </div>
        <div className="divide-y divide-gray-800/50">
          {balances.map((b: any) => (
            <div key={b.asset} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{b.icon || '🪙'}</div>
                <div>
                  <p className="font-semibold text-white">{b.asset}</p>
                  <p className="text-[11px] text-gray-500">{b.locked > 0 ? `${b.locked} khóa` : 'Khả dụng'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{fmt(b.free, b.asset === 'USDT' ? 2 : 6)}</p>
                <p className="text-[11px] text-gray-500">{b.asset === 'USDT' ? '≈' : ''} {fmt(b.free + b.locked, b.asset === 'USDT' ? 2 : 6)} tổng</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-bold text-white">Lịch sử giao dịch</h2>
        </div>
        <div className="divide-y divide-gray-800/50">
          {history.map((tx: any) => {
            const isDeposit = tx.type === 'deposit';
            const StatusIcon = tx.status === 'completed' ? CheckCircle : tx.status === 'pending' ? Clock : XCircle;
            return (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDeposit ? 'bg-green-950/60 text-green-400' : 'bg-orange-950/60 text-orange-400'}`}>
                    {isDeposit ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{tx.note || (isDeposit ? 'Nạp tiền' : 'Rút tiền')}</p>
                    <p className="text-[10px] text-gray-500">{fmtTime(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${isDeposit ? 'text-green-400' : 'text-orange-400'}`}>
                    {isDeposit ? '+' : '-'}{fmt(tx.amount, 2)} {tx.asset || 'USDT'}
                  </p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 ${
                    tx.status === 'completed' ? 'text-green-400' : tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    <StatusIcon size={10} />
                    {tx.status === 'completed' ? 'Thành công' : tx.status === 'pending' ? 'Đang xử lý' : 'Từ chối'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
