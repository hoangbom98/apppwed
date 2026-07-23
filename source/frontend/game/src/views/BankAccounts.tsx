import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Plus, Trash2, Star, X, AlertCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBankAccounts, addBankAccount, deleteBankAccount, setDefaultBankAccount } from '@/api/apiNganHang';
import { VN_BANKS } from '@/utils/tainguyen';
import { Skeleton } from '@/components/chung/KhungTaiTrang';

const schema = yup.object({
  bank_code:      yup.string().required('Chọn ngân hàng'),
  account_number: yup.string().min(8, 'Số TK tối thiểu 8 ký tự').required('Nhập số tài khoản'),
  account_holder: yup.string().min(3, 'Tên tối thiểu 3 ký tự').required('Nhập tên chủ tài khoản'),
});
type FormValues = yup.InferType<typeof schema>;

// Mask account number: show first 3 and last 3 digits
function maskNumber(n: string) {
  const clean = n.replace(/\s/g, '');
  if (clean.length <= 6) return '•'.repeat(clean.length);
  return clean.slice(0, 3) + '•'.repeat(clean.length - 6) + clean.slice(-3);
}

export default function BankAccount() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [revealedId, setRevealedId] = useState<number | null>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: getBankAccounts,
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });
  const selectedBankCode = watch('bank_code');
  const selectedBank = VN_BANKS.find(b => b.code === selectedBankCode);

  const addMut = useMutation({
    mutationFn: (d: FormValues) => addBankAccount({
      bank_code: d.bank_code,
      bank_name: VN_BANKS.find(b => b.code === d.bank_code)?.name || d.bank_code,
      account_number: d.account_number,
      account_holder: d.account_holder.toUpperCase(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Thêm tài khoản thành công!');
      reset();
      setShowForm(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Thêm tài khoản thất bại'),
  });

  const delMut = useMutation({
    mutationFn: deleteBankAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-accounts'] }); toast.success('Đã xóa tài khoản'); },
    onError: () => toast.error('Xóa tài khoản thất bại'),
  });

  const defaultMut = useMutation({
    mutationFn: setDefaultBankAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank-accounts'] }); toast.success('Đã đặt làm tài khoản mặc định'); },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Tài khoản ngân hàng</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-secondary text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Thêm tài khoản</h2>
                <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit((d) => addMut.mutate(d))} className="space-y-4">
                {/* Bank select */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Ngân hàng</label>
                  <select
                    {...register('bank_code')}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {VN_BANKS.map(b => (
                      <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                  {errors.bank_code && (
                    <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.bank_code.message}</p>
                  )}
                </div>

                {/* Account number */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Số tài khoản</label>
                  <input
                    {...register('account_number')}
                    placeholder="Nhập số tài khoản..."
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                  />
                  {errors.account_number && (
                    <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.account_number.message}</p>
                  )}
                </div>

                {/* Account holder */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Tên chủ tài khoản</label>
                  <input
                    {...register('account_holder')}
                    placeholder="NGUYEN VAN A"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary uppercase"
                  />
                  {errors.account_holder && (
                    <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.account_holder.message}</p>
                  )}
                </div>

                {/* Bank name preview */}
                {selectedBank && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-gray-500">Ngân hàng đã chọn</p>
                    <p className="text-sm font-bold text-primary dark:text-secondary">{selectedBank.name}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addMut.isPending}
                  className="w-full py-3 bg-primary hover:bg-secondary text-white font-black rounded-xl disabled:opacity-50 transition-colors"
                >
                  {addMut.isPending ? 'Đang thêm...' : 'Thêm tài khoản'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">Chưa có tài khoản ngân hàng</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-sm"
          >
            Thêm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => {
            const isRevealed = revealedId === acc.id;
            return (
              <motion.div
                key={acc.id}
                layout
                className={`relative p-4 rounded-xl border-2 transition-colors ${
                  acc.is_default
                    ? 'border-primary bg-primary/5 dark:border-secondary dark:bg-secondary/5'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {/* Default badge */}
                {acc.is_default && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold text-accent bg-accent/20 px-2 py-0.5 rounded-full">
                    Mặc định
                  </span>
                )}
                {/* Bank name + code */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary dark:text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{acc.bank_name}</p>
                    <p className="text-[10px] text-gray-400">{acc.bank_code}</p>
                  </div>
                </div>
                {/* Account number with toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Số tài khoản</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm tracking-widest">
                      {isRevealed ? acc.account_number : maskNumber(acc.account_number)}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{acc.account_holder}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Eye toggle */}
                    <button
                      onClick={() => setRevealedId(isRevealed ? null : acc.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {/* Set default */}
                    {!acc.is_default && (
                      <button
                        onClick={() => defaultMut.mutate(acc.id)}
                        disabled={defaultMut.isPending}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-accent"
                        title="Đặt làm mặc định"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm('Xóa tài khoản này?')) delMut.mutate(acc.id);
                      }}
                      disabled={delMut.isPending}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center mt-6">Tối đa 5 tài khoản ngân hàng · Dùng để rút tiền</p>
    </div>
  );
}
