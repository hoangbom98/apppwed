import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Transfer() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => nav(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bank-surface)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Chuyển tiền nội bộ</h1>
      </div>

      <div className="rounded-xl p-4 mb-5 flex items-start gap-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <AlertCircle size={16} color="#d97706" className="flex-shrink-0 mt-0.5" />
        <p className="text-sm" style={{ color: '#92400e' }}>
          Chuyển tiền giữa các tài khoản LKVIP nội bộ. Giao dịch tức thì, không phí.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Email người nhận</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="example@email.com"
            className="w-full py-3 px-4 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)', color: 'var(--bank-text)' }}
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-2">Số tiền (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: 'var(--bank-muted)' }}>$</span>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              placeholder="0.00"
              className="w-full py-3 pl-8 pr-4 rounded-xl text-lg font-bold outline-none"
              style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)', color: 'var(--bank-text)' }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => toast.error('Tính năng đang phát triển — sẽ ra mắt sớm!')}
        className="w-full py-4 rounded-xl font-bold text-white mt-6 transition-all active:scale-[0.98]"
        style={{ background: 'var(--bank-primary)' }}
      >
        Chuyển tiền
      </button>
    </div>
  );
}
