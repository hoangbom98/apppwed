import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, RefreshCw, CreditCard } from 'lucide-react';
import { getWallet, getWalletHistory, createDeposit, createWithdrawal } from '@/api/sports';
import { MobileOutlined, DollarCircleOutlined, BankOutlined } from '@ant-design/icons';

type Mode = 'overview' | 'deposit' | 'withdraw';

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];
const DEPOSIT_METHODS: { id: string; label: string; note: string; icon: React.ReactNode }[] = [
  { id:'momo',   label:'MoMo',     note:'Tức thì',   icon:<MobileOutlined style={{ color:'#a50064' }} /> },
  { id:'zalopay',label:'ZaloPay',  note:'Tức thì',   icon:<DollarCircleOutlined style={{ color:'#0068FF' }} /> },
  { id:'bank',   label:'Ngân hàng',note:'5-15 phút', icon:<BankOutlined style={{ color:'#1a56db' }} /> },
];

export default function WalletPage() {
  const { user, isLoggedIn } = useAuthStore();
  const [mode, setMode]     = useState<Mode>('overview');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('momo');
  const [msg, setMsg]       = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sports-wallet'],
    queryFn:  getWallet,
    enabled:  isLoggedIn,
  });
  const { data: histData, isLoading: histLoading } = useQuery({
    queryKey: ['sports-wallet-history'],
    queryFn:  () => getWalletHistory({ limit: 30 }),
    enabled:  isLoggedIn,
  });

  const balance = data?.balance ?? data?.data?.balance ?? 0;
  const history = histData?.data ?? histData?.transactions ?? [];

  const depositMut = useMutation({
    mutationFn: () => createDeposit({ amount: parseFloat(amount), method }),
    onSuccess: (_d: any) => {
      setMsg('Tạo đơn nạp tiền thành công!');
      setAmount('');
      refetch();
    },
    onError: (e: any) => setMsg(e.response?.data?.message || 'Lỗi nạp tiền'),
  });

  const withdrawMut = useMutation({
    mutationFn: () => createWithdrawal({ amount: parseFloat(amount) }),
    onSuccess: () => {
      setMsg('Yêu cầu rút tiền đã gửi!');
      setAmount('');
      refetch();
    },
    onError: (e: any) => setMsg(e.response?.data?.message || 'Lỗi rút tiền'),
  });

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Chưa đăng nhập</h2>
        <p className="text-gray-400 text-sm mb-6">Đăng nhập để xem ví và nạp tiền cá cược</p>
        <Link to="/login" className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition-colors">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 py-4 max-w-lg mx-auto space-y-4">
      {/* Balance banner */}
      <div className="bg-gradient-to-br from-green-600/20 via-emerald-600/10 to-teal-600/20 border border-green-500/20 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-green-400" />
            <p className="text-sm text-gray-400">Số dư khả dụng</p>
          </div>
          <button onClick={() => refetch()} className="text-gray-500 hover:text-white">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-3xl font-black text-white mb-1">
          {balance.toLocaleString('vi-VN')} <span className="text-lg text-gray-400">₫</span>
        </p>
        <p className="text-xs text-gray-500">Tài khoản: {user?.username || user?.email}</p>

        <div className="flex gap-3 mt-4">
          <button onClick={() => { setMode('deposit'); setMsg(''); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-bold transition-colors">
            <ArrowUpRight size={15} /> Nạp tiền
          </button>
          <button onClick={() => { setMode('withdraw'); setMsg(''); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-colors">
            <ArrowDownLeft size={15} /> Rút tiền
          </button>
        </div>
      </div>

      {/* Deposit / Withdraw form */}
      {(mode === 'deposit' || mode === 'withdraw') && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">{mode === 'deposit' ? 'Nạp tiền cá cược' : 'Rút tiền'}</h2>
            <button onClick={() => { setMode('overview'); setMsg(''); }} className="text-gray-500 hover:text-white text-xs">×</button>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DEPOSIT_METHODS.map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`p-3 rounded-xl text-center border transition-all ${
                  method === m.id ? 'bg-green-950/50 border-green-600/50 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}>
                <p className="text-xl mb-1">{m.icon}</p>
                <p className="text-[11px] font-semibold">{m.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{m.note}</p>
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">Số tiền (₫)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {QUICK_AMOUNTS.map(v => (
              <button key={v} onClick={() => setAmount(String(v))}
                className="py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold">
                {(v / 1000).toFixed(0)}K
              </button>
            ))}
          </div>

          {msg && (
            <div className={`mb-3 p-3 rounded-xl text-xs font-medium ${
              msg.startsWith('Tạo') || msg.startsWith('Yêu cầu') ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
            }`}>{msg}</div>
          )}

          <button
            onClick={() => mode === 'deposit' ? depositMut.mutate() : withdrawMut.mutate()}
            disabled={depositMut.isPending || withdrawMut.isPending || !amount}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${
              mode === 'deposit' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'
            }`}
          >
            {depositMut.isPending || withdrawMut.isPending ? 'Đang xử lý...' :
              mode === 'deposit' ? `Nạp ${amount ? Number(amount).toLocaleString('vi-VN') + ' ₫' : 'tiền'}` : 'Xác nhận rút tiền'}
          </button>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <CreditCard size={16} className="text-green-400" />
          <h2 className="font-bold text-white">Lịch sử giao dịch</h2>
        </div>
        {histLoading && (
          <div className="py-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!histLoading && history.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm">Chưa có giao dịch nào</div>
        )}
        <div className="divide-y divide-gray-800/50">
          {history.map((tx: any) => {
            const isDeposit = tx.type === 'deposit';
            const StatusIcon = tx.status === 'completed' ? CheckCircle : tx.status === 'pending' ? Clock : XCircle;
            return (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDeposit ? 'bg-green-950/60 text-green-400' : 'bg-orange-950/60 text-orange-400'}`}>
                    {isDeposit ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{tx.note}</p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(tx.createdAt).toLocaleString('vi-VN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${isDeposit ? 'text-green-400' : 'text-orange-400'}`}>
                    {isDeposit ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} ₫
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
