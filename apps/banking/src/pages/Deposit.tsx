import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateDeposit } from '../hooks/useBanking';

const METHODS = [
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', fee: 0, min: 10 },
  { id: 'momo',          label: 'MoMo',                   fee: 0, min: 10 },
  { id: 'usdt',          label: 'USDT (TRC20)',            fee: 1, min: 20 },
];

const AMOUNTS = [50, 100, 200, 500, 1000];

export default function Deposit() {
  const nav = useNavigate();
  const [method, setMethod] = useState(METHODS[0].id);
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const { mutateAsync, isPending } = useCreateDeposit();

  const selectedMethod = METHODS.find(m => m.id === method)!;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Đã sao chép!');
    });
  };

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (amt < selectedMethod.min) {
      toast.error(`Số tiền tối thiểu là $${selectedMethod.min}`);
      return;
    }
    try {
      await mutateAsync({ amount: amt, method });
      toast.success('Yêu cầu nạp tiền đã được gửi!');
      nav('/history');
    } catch {
      toast.error('Không thể tạo yêu cầu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="px-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => nav(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bank-surface)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Nạp tiền</h1>
      </div>

      {/* Method selector */}
      <p className="text-sm font-semibold mb-3">Phương thức nạp</p>
      <div className="flex flex-col gap-2 mb-5">
        {METHODS.map(m => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: method === m.id ? '#e0f2fe' : 'var(--bank-surface)',
              border: `2px solid ${method === m.id ? 'var(--bank-primary)' : 'var(--bank-border)'}`,
            }}
          >
            <span className="text-sm font-medium">{m.label}</span>
            <span className="text-xs" style={{ color: 'var(--bank-muted)' }}>
              {m.fee > 0 ? `Phí: $${m.fee}` : 'Miễn phí'} · Tối thiểu: ${m.min}
            </span>
          </button>
        ))}
      </div>

      {/* Amount */}
      <p className="text-sm font-semibold mb-2">Số tiền (USD)</p>
      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: 'var(--bank-muted)' }}>$</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full py-3 pl-8 pr-4 rounded-xl text-lg font-bold outline-none"
          style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)', color: 'var(--bank-text)' }}
        />
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {AMOUNTS.map(a => (
          <button
            key={a}
            onClick={() => setAmount(String(a))}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: amount === String(a) ? 'var(--bank-primary)' : 'var(--bank-surface)',
              color:      amount === String(a) ? '#fff' : 'var(--bank-text)',
              border:     `1px solid ${amount === String(a) ? 'var(--bank-primary)' : 'var(--bank-border)'}`,
            }}
          >
            ${a}
          </button>
        ))}
      </div>

      {/* Bank transfer info */}
      {method === 'bank_transfer' && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}>
          <p className="text-sm font-semibold mb-3">Thông tin chuyển khoản</p>
          {[
            { label: 'Ngân hàng', value: 'Vietcombank' },
            { label: 'Số tài khoản', value: '1234567890' },
            { label: 'Chủ tài khoản', value: 'LKVIP GROUP' },
            { label: 'Nội dung', value: `NAP ${amount || '?'} USD` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: 'var(--bank-border)' }}>
              <span className="text-xs" style={{ color: 'var(--bank-muted)' }}>{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{value}</span>
                <button onClick={() => handleCopy(value)} className="p-1 rounded">
                  {copied ? <CheckCircle2 size={14} color="var(--bank-success)" /> : <Copy size={14} color="var(--bank-muted)" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!amount || isPending}
        className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
        style={{ background: 'var(--bank-primary)' }}
      >
        {isPending ? 'Đang xử lý...' : 'Xác nhận nạp tiền'}
      </button>
    </div>
  );
}
