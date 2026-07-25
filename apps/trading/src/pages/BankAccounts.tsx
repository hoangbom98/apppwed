import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, Trash2, Star, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { VN_BANKS } from '@lkvip/constants';
import {
  getBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  deleteBankAccount,
} from '@/api/trade';
import type { VNBank } from '@lkvip/types';

interface BankItem {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

function maskNumber(n: string) {
  const c = n.replace(/\s/g, '');
  if (c.length <= 6) return '•'.repeat(c.length);
  return c.slice(0, 3) + '•'.repeat(c.length - 6) + c.slice(-3);
}

export default function BankAccounts() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [form, setForm] = useState({ bank_code: '', account_number: '', account_holder: '', branch: '' });
  const [err, setErr] = useState('');

  const { data: accounts = [], isLoading } = useQuery<BankItem[]>({
    queryKey: ['bank-accounts'],
    queryFn: getBankAccounts,
  });

  const addMut = useMutation({
    mutationFn: () => {
      if (!form.bank_code || !form.account_number || !form.account_holder) {
        setErr('Vui lòng điền đầy đủ thông tin'); return Promise.reject();
      }
      const bank = (VN_BANKS as VNBank[]).find(b => b.code === form.bank_code);
      return addBankAccount({
        bank_code:      form.bank_code,
        bank_name:      bank?.name || form.bank_code,
        account_number: form.account_number,
        account_holder: form.account_holder.toUpperCase(),
        branch:         form.branch || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      setShowForm(false);
      setForm({ bank_code: '', account_number: '', account_holder: '', branch: '' });
      setErr('');
    },
    onError: (e: any) => setErr(e?.response?.data?.message || 'Thêm tài khoản thất bại'),
  });

  const defaultMut = useMutation({
    mutationFn: setDefaultBankAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteBankAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });

  const selectedBank = (VN_BANKS as VNBank[]).find(b => b.code === form.bank_code);

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tài khoản ngân hàng</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
        >
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Thêm tài khoản</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Bank select */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Ngân hàng</label>
                <select
                  value={form.bank_code}
                  onChange={e => setForm(f => ({ ...f, bank_code: e.target.value }))}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {(VN_BANKS as VNBank[]).map(b => (
                    <option key={b.code} value={b.code}>{b.name} ({b.shortName})</option>
                  ))}
                </select>
              </div>

              {/* Bank preview with logo */}
              {selectedBank && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                  <img src={(selectedBank as VNBank).logo} alt={(selectedBank as VNBank).shortName} className="w-8 h-8 object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{(selectedBank as VNBank).shortName}</p>
                    <p className="text-[10px] text-gray-500">BIN: {(selectedBank as VNBank).bin}</p>
                  </div>
                </div>
              )}

              {/* Account number */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Số tài khoản</label>
                <input
                  value={form.account_number}
                  onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                  placeholder="Nhập số tài khoản..."
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Account holder */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tên chủ tài khoản</label>
                <input
                  value={form.account_holder}
                  onChange={e => setForm(f => ({ ...f, account_holder: e.target.value }))}
                  placeholder="NGUYEN VAN A"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {err && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5" /> {err}
                </p>
              )}

              <button
                onClick={() => addMut.mutate()}
                disabled={addMut.isPending}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm disabled:opacity-50"
              >
                {addMut.isPending ? 'Đang thêm...' : 'Thêm tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center py-14 gap-3 text-center">
          <CreditCard className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có tài khoản ngân hàng</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full">
            Thêm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => {
            const isRev = revealed === acc.id;
            return (
              <div
                key={acc.id}
                className={`p-4 rounded-xl border-2 relative ${acc.isDefault ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
              >
                {acc.isDefault && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    Mặc định
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{acc.bankName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{acc.accountName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm text-gray-800 dark:text-gray-200 tracking-widest">
                    {isRev ? acc.accountNumber : maskNumber(acc.accountNumber)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setRevealed(isRev ? null : acc.id)} className="p-1 text-gray-400 hover:text-gray-600">
                      {isRev ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {!acc.isDefault && (
                      <button onClick={() => defaultMut.mutate(acc.id)} disabled={defaultMut.isPending} className="p-1 text-gray-400 hover:text-yellow-500" title="Đặt mặc định">
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Xóa tài khoản này?')) deleteMut.mutate(acc.id); }}
                      disabled={deleteMut.isPending}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400 mt-6">Tối đa 5 tài khoản · Dùng để rút tiền</p>
    </div>
  );
}
