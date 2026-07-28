import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBankAccounts, useAddBankAccount, useSetDefaultAccount } from '../hooks/useBanking';
import { useForm } from 'react-hook-form';

interface AddForm {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const VN_BANKS = [
  'Vietcombank', 'VietinBank', 'BIDV', 'Agribank',
  'Techcombank', 'MB Bank', 'TPBank', 'VPBank',
  'ACB', 'SHB', 'HDBank', 'OCB', 'MSB', 'Sacombank',
];

export default function Accounts() {
  const nav = useNavigate();
  const { data: accounts, isLoading } = useBankAccounts();
  const { mutateAsync: addAccount, isPending: adding } = useAddBankAccount();
  const { mutateAsync: setDefault } = useSetDefaultAccount();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddForm>();

  const onSubmit = async (values: AddForm) => {
    try {
      await addAccount(values);
      toast.success('Đã thêm tài khoản ngân hàng!');
      reset();
      setShowForm(false);
    } catch {
      toast.error('Không thể thêm tài khoản');
    }
  };

  const onSetDefault = async (id: string) => {
    try {
      await setDefault(id);
      toast.success('Đã đặt làm tài khoản mặc định!');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => nav(-1)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bank-surface)' }}>
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold">Tài khoản ngân hàng</h1>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--bank-primary)', color: '#fff' }}
        >
          <Plus size={14} />
          Thêm
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl p-4 mb-4" style={{ background: 'var(--bank-surface)', border: '1px solid var(--bank-border)' }}>
          <p className="font-semibold text-sm mb-3">Thêm tài khoản mới</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--bank-muted)' }}>Ngân hàng</label>
              <select
                {...register('bankName', { required: 'Vui lòng chọn ngân hàng' })}
                className="w-full py-2.5 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bank-bg)', border: '1px solid var(--bank-border)' }}
              >
                <option value="">-- Chọn ngân hàng --</option>
                {VN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.bankName && <p className="text-xs mt-1" style={{ color: 'var(--bank-danger)' }}>{errors.bankName.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--bank-muted)' }}>Số tài khoản</label>
              <input
                {...register('accountNumber', { required: 'Nhập số tài khoản' })}
                placeholder="0123456789"
                className="w-full py-2.5 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bank-bg)', border: '1px solid var(--bank-border)' }}
              />
              {errors.accountNumber && <p className="text-xs mt-1" style={{ color: 'var(--bank-danger)' }}>{errors.accountNumber.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--bank-muted)' }}>Chủ tài khoản</label>
              <input
                {...register('accountName', { required: 'Nhập tên chủ tài khoản' })}
                placeholder="NGUYEN VAN A"
                style={{ textTransform: 'uppercase' } as React.CSSProperties}
                className="w-full py-2.5 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bank-bg)', border: '1px solid var(--bank-border)' } as React.CSSProperties}
              />
              {errors.accountName && <p className="text-xs mt-1" style={{ color: 'var(--bank-danger)' }}>{errors.accountName.message}</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="flex-1 py-2.5 rounded-lg text-sm" style={{ border: '1px solid var(--bank-border)' }}>Hủy</button>
            <button type="submit" disabled={adding} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--bank-primary)' }}>
              {adding ? '...' : 'Lưu tài khoản'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading && <div className="py-10 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--bank-primary) transparent transparent transparent' }} /></div>}
      {!isLoading && accounts?.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--bank-muted)' }}>Chưa có tài khoản ngân hàng nào</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm font-semibold" style={{ color: 'var(--bank-primary)' }}>+ Thêm tài khoản</button>
        </div>
      )}
      <div className="space-y-3">
        {accounts?.map(acc => (
          <div key={acc.id} className="rounded-xl p-4" style={{ background: 'var(--bank-surface)', border: `2px solid ${acc.isDefault ? 'var(--bank-primary)' : 'var(--bank-border)'}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{acc.bankName}</p>
                <p className="text-base font-bold mt-0.5 tracking-wider">{acc.accountNumber}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--bank-muted)' }}>{acc.accountName}</p>
              </div>
              <div className="flex gap-2">
                {!acc.isDefault && (
                  <button onClick={() => onSetDefault(acc.id)} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: 'var(--bank-bg)' }}>
                    <Star size={16} color="var(--bank-muted)" />
                  </button>
                )}
                {acc.isDefault && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: '#e0f2fe', color: 'var(--bank-primary)' }}>
                    <Star size={12} fill="currentColor" /> Mặc định
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
