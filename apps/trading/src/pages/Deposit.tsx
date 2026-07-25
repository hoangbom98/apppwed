import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Clock, CheckCircle, XCircle, Copy } from 'lucide-react';
import { getDeposits, createDeposit } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtTime } from '@/utils/formatters';

const METHODS = [
  { id: 'bank',  label: 'Chuyển khoản ngân hàng', fee: '0 đ',    time: '15–30 phút' },
  { id: 'usdt',  label: 'USDT (TRC20 / BEP20)',   fee: '1 USDT', time: '5–10 phút'  },
  { id: 'momo',  label: 'MoMo',                    fee: '0 đ',    time: '5–10 phút'  },
];

const STATUS_ICON: Record<string, React.FC<{ size: number; className: string }>> = {
  pending:  Clock as any,
  approved: CheckCircle as any,
  rejected: XCircle as any,
};
const STATUS_STYLE: Record<string, string> = {
  pending:  'text-yellow-400',
  approved: 'text-green-400',
  rejected: 'text-red-400',
};

export default function DepositPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [method, setMethod] = useState('bank');
  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [txHash, setTxHash] = useState('');
  const [msg, setMsg]       = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['deposits'],
    queryFn:  () => getDeposits(),
    enabled:  !!user,
  });
  const deposits = data?.data ?? [];

  const depositMut = useMutation({
    mutationFn: (vars: any) => createDeposit(vars),
    onSuccess: () => {
      setMsg('Yêu cầu nạp tiền đã gửi. Chờ admin duyệt.');
      setAmount(''); setNote(''); setTxHash('');
      qc.invalidateQueries({ queryKey: ['deposits'] });
    },
    onError: (e: any) => setMsg(e.response?.data?.message || 'Lỗi nạp tiền'),
  });

  const handleSubmit = () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) { setMsg('Nhập số tiền hợp lệ'); return; }
    setMsg('');
    depositMut.mutate({ amount: amtNum, method, note: note || undefined, txHash: txHash || undefined });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE');
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 rounded-xl bg-green-950/50 border border-green-800/30">
          <ArrowUpRight size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Nạp tiền</h1>
          <p className="text-xs text-gray-500">Gửi yêu cầu nạp tiền, admin duyệt trong 5–30 phút</p>
        </div>
      </div>

      {/* Method selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-4 text-sm">Chọn phương thức nạp</h2>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`p-3 rounded-xl text-left transition-all border ${
                method === m.id
                  ? 'bg-green-950/40 border-green-600/50 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}>
              <p className="text-[11px] font-semibold leading-tight">{m.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{m.time}</p>
            </button>
          ))}
        </div>

        {/* USDT deposit address */}
        {method === 'usdt' && (
          <div className="mb-4 p-4 bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500 mb-2">Địa chỉ ví USDT (TRC20)</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-xs text-blue-400 flex-1 truncate">TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE</p>
              <button onClick={copyAddress} className="p-1.5 text-gray-400 hover:text-white">
                {copiedAddr ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-yellow-400 mt-2">Chỉ gửi USDT TRC20. Tài sản khác sẽ mất vĩnh viễn.</p>
            <div className="mt-3">
              <label className="text-xs text-gray-500 mb-1 block">Tx Hash (hash giao dịch, tuỳ chọn)</label>
              <input
                value={txHash} onChange={e => setTxHash(e.target.value)}
                placeholder="0x..."
                className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Bank info */}
        {method === 'bank' && (
          <div className="mb-4 p-4 bg-gray-800 rounded-xl text-sm">
            <p className="text-xs text-gray-500 mb-3">Thông tin chuyển khoản</p>
            <div className="space-y-2 text-white">
              <div className="flex justify-between"><span className="text-gray-400 text-xs">Ngân hàng</span><span className="font-semibold text-xs">Vietcombank</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-xs">Số tài khoản</span><span className="font-mono font-semibold text-xs">1234567890</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-xs">Chủ tài khoản</span><span className="font-semibold text-xs">CONG TY LKVIP</span></div>
              <div className="flex justify-between"><span className="text-gray-400 text-xs">Nội dung CK</span><span className="font-semibold text-xs text-yellow-400">NAPTIEN {user?.id?.slice(0, 8).toUpperCase() ?? 'MUID'}</span></div>
            </div>
          </div>
        )}

        {/* Amount input */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Số tiền (USD)</label>
          <div className="relative">
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Nhập số tiền..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
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

        {/* Note */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">Ghi chú (tuỳ chọn)</label>
          <input
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Ví dụ: Chuyển khoản lúc 14:30..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {msg && (
          <div className={`mb-3 p-3 rounded-xl text-xs font-medium ${
            msg.startsWith('Yêu cầu') ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
          }`}>{msg}</div>
        )}

        <button
          onClick={handleSubmit} disabled={depositMut.isPending}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        >
          {depositMut.isPending ? 'Đang gửi...' : 'Gửi yêu cầu nạp tiền'}
        </button>
      </div>

      {/* History */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-bold text-white">Lịch sử nạp tiền</h2>
        </div>
        {isLoading && <div className="p-8 text-center text-gray-500">Đang tải...</div>}
        {!isLoading && deposits.length === 0 && (
          <div className="p-8 text-center text-gray-500">Chưa có lịch sử nạp tiền</div>
        )}
        <div className="divide-y divide-gray-800/50">
          {deposits.map((dep: any) => {
            const SIcon = STATUS_ICON[dep.status] ?? Clock;
            return (
              <div key={dep.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-950/40 text-green-400">
                    <ArrowUpRight size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Nạp qua {dep.method?.toUpperCase() ?? '—'}
                    </p>
                    <p className="text-[10px] text-gray-500">{fmtTime(dep.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-400 text-sm">+{fmt(Number(dep.amount), 2)} USD</p>
                  <div className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 ${STATUS_STYLE[dep.status] ?? 'text-gray-400'}`}>
                    <SIcon size={10} className={STATUS_STYLE[dep.status] ?? 'text-gray-400'} />
                    {dep.status === 'approved' ? 'Đã duyệt' : dep.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
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
