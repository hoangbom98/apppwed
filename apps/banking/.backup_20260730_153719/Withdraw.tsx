import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet, useCreateWithdrawal, useBankAccounts } from '../hooks/useBanking';

const METHODS = [
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', fee: 5, min: 50 },
  { id: 'usdt',          label: 'USDT (TRC20)',            fee: 2, min: 20 },
];

const AMOUNTS = [50, 100, 200, 500];

export default function Withdraw() {
  const nav = useNavigate();
  const { data: wallet } = useWallet();
  const { data: accounts } = useBankAccounts();
  const { mutateAsync, isPending } = useCreateWithdrawal();

  const [method, setMethod] = useState(METHODS[0].id);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');

  const selectedMethod = METHODS.find(m => m.id === method) ?? METHODS[0];
  const avail = Number(wallet?.balance ?? 0) - Number(wallet?.frozen ?? 0);
  const amtNum = Number(amount);
  const net = amtNum - selectedMethod.fee;
  const defaultAccount = accounts?.find(a => a.isDefault);

  const handleSubmit = async () => {
    if (amtNum < selectedMethod.min) {
      toast.error(`Số tiền tối thiểu là $${selectedMethod.min}`);
      return;
    }
    if (amtNum > avail) {
      toast.error('Số dư khả dụng không đủ');
      return;
    }
    const bankInfo = method === 'bank_transfer' && defaultAccount
      ? { bankName: defaultAccount.bankName, accountNumber: defaultAccount.accountNumber, accountName: defaultAccount.accountName }
      : undefined;
    try {
      await mutateAsync({ amount: amtNum, fee: selectedMethod.fee, method, address: address || undefined, bankInfo });
      toast.success('Yêu cầu rút tiền đã được gửi, chờ duyệt!');
      nav('/history');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? 'Không thể tạo yêu cầu');
    }
  };

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => nav(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bank-surface)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold">Rút tiền</h1>
      </div>

      {/* Balance */}
      <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}>
        <p className="text-xs" style={{ color: 'var(--bank-muted)' }}>Số dư khả dụng</p>
        <p className="text-xl font-bold" style={{ color: 'var(--bank-primary)' }}>
          ${avail.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Method */}
      <p className="text-sm font-semibold mb-3">Phương thức rút</p>
      <div className="flex gap-2 mb-5">
        {METHODS.map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: method === m.id ? '#e0f2fe' : 'var(--bank-surface)',
              border: `2px solid ${method === m.id ? 'var(--bank-primary)' : 'var(--bank-border)'}`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Amount */}
      <p className="text-sm font-semibold mb-2">Số tiền rút (USD)</p>
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
      <div className="flex gap-2 mb-4 flex-wrap">
        {AMOUNTS.map(a => (
          <button key={a} onClick={() => setAmount(String(a))}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: amount === String(a) ? 'var(--bank-primary)' : 'var(--bank-surface)',
              color:      amount === String(a) ? '#fff' : 'var(--bank-text)',
              border:     `1px solid ${amount === String(a) ? 'var(--bank-primary)' : 'var(--bank-border)'}`,
            }}
          >${a}</button>
        ))}
        <button onClick={() => setAmount(String(Math.floor(avail)))}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}
        >Tất cả</button>
      </div>

      {/* Address for USDT */}
      {method === 'usdt' && (
        <div className="mb-4">
          <p className="text-sm font-semibold mb-2">Địa chỉ ví TRC20</p>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ USDT TRC20..."
            className="w-full py-3 px-4 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)', color: 'var(--bank-text)' }}
          />
        </div>
      )}

      {/* Bank account for bank_transfer */}
      {method === 'bank_transfer' && (
        <div className="mb-4 rounded-xl p-3" style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}>
          {defaultAccount ? (
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--bank-muted)' }}>Tài khoản nhận</p>
              <p className="text-sm font-semibold">{defaultAccount.bankName} — {defaultAccount.accountNumber}</p>
              <p className="text-xs" style={{ color: 'var(--bank-muted)' }}>{defaultAccount.accountName}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle size={16} color="var(--bank-warning)" />
              <p className="text-sm" style={{ color: 'var(--bank-muted)' }}>
                Chưa có tài khoản ngân hàng.{' '}
                <button onClick={() => nav('/accounts')} className="font-semibold underline" style={{ color: 'var(--bank-primary)' }}>Thêm ngay</button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {amtNum > 0 && (
        <div className="rounded-xl p-3 mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--bank-muted)' }}>Số tiền rút</span>
            <span>${amtNum.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: 'var(--bank-muted)' }}>Phí</span>
            <span>-${selectedMethod.fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t pt-1" style={{ borderColor: '#bbf7d0' }}>
            <span>Nhận thực tế</span>
            <span style={{ color: 'var(--bank-success)' }}>${Math.max(0, net).toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!amount || isPending || (method === 'bank_transfer' && !defaultAccount)}
        className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
        style={{ background: 'var(--bank-primary)' }}
      >
        {isPending ? 'Đang xử lý...' : 'Yêu cầu rút tiền'}
      </button>
    </div>
  );
}
