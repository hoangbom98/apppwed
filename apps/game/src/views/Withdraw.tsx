import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';
import { createWithdraw, getWithdrawHistory } from '@/api/apiViTien';
import { getBankAccounts, BankAccount } from '@/api/apiNganHang';
import { useWalletStore } from '@/store/walletStore';
import { TransactionList } from '@/components/vi-tien/DanhSachGiaoDich';
import { formatVND } from '@/utils/dinhDang';

const buildSchema = (maxBalance: number) =>
  yup.object({
    amount: yup
      .number()
      .typeError('Vui lòng nhập số tiền')
      .min(50_000, 'Tối thiểu 50,000 ₫')
      .max(maxBalance, 'Vượt quá số dư khả dụng')
      .required('Vui lòng nhập số tiền'),
    payment_method: yup.string().required(),
    address: yup.string().required('Vui lòng nhập địa chỉ / số tài khoản'),
  });

type FormValues = { amount: number; payment_method: string; address: string };

export default function Withdraw() {
  const { balance } = useWalletStore();
  const [tab, setTab] = useState<'form' | 'history'>('form');

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(buildSchema(balance)) as any,
    defaultValues: { payment_method: 'banking' },
  });
  const method = watch('payment_method');

  // Load saved bank accounts for banking method
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ['bank-accounts'],
    queryFn: getBankAccounts,
    enabled: method === 'banking',
    staleTime: 60_000,
  });

  const wdMut = useMutation({
    mutationFn: (data: FormValues) => createWithdraw(data),
    onSuccess: () => {
      toast.success('Yêu cầu rút tiền đã được tạo!');
      reset();
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Rút tiền thất bại');
    },
  });

  const { data: history } = useQuery({
    queryKey: ['withdraw-history'],
    queryFn: getWithdrawHistory,
    enabled: tab === 'history',
  });

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Rút tiền</h1>

      {/* Balance */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs text-gray-500 dark:text-gray-400">Số dư khả dụng</p>
        <p className="text-xl font-black text-primary dark:text-secondary">{formatVND(balance)}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['form', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            {t === 'form' ? 'Rút ngay' : 'Lịch sử'}
          </button>
        ))}
      </div>

      {tab === 'form' && (
        <form onSubmit={handleSubmit((d) => wdMut.mutate(d))} className="space-y-4">
          {/* Method */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Phương thức</label>
            <select
              {...register('payment_method')}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors text-sm"
            >
              <option value="banking">Ngân hàng</option>
              <option value="usdt">USDT</option>
              <option value="momo">MoMo</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              {method === 'usdt' ? 'Địa chỉ ví USDT' : 'Số tài khoản / Số điện thoại'}
            </label>
            {method === 'banking' && bankAccounts.length > 0 ? (
              <select
                {...register('address')}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors text-sm"
              >
                <option value="">-- Chọn tài khoản đã lưu --</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.accountNumber}>
                    {acc.bankName} – {acc.accountNumber} ({acc.accountName})
                    {acc.isDefault ? ' ✓' : ''}
                  </option>
                ))}
                <option value="__manual__">Nhập tay...</option>
              </select>
            ) : (
              <input
                {...register('address')}
                placeholder={method === 'usdt' ? 'Địa chỉ ví USDT...' : 'Số tài khoản / số điện thoại...'}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors text-sm"
              />
            )}
            {errors.address && (
              <p className="mt-1 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.address.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Số tiền</label>
            <input
              {...register('amount')}
              type="number"
              placeholder="Nhập số tiền muốn rút..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors text-sm"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.amount.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={wdMut.isPending}
            className="w-full py-4 bg-primary hover:bg-secondary text-white font-black rounded-2xl disabled:opacity-50 transition-colors text-base"
          >
            {wdMut.isPending ? 'Đang xử lý...' : 'Rút tiền'}
          </button>
        </form>
      )}

      {tab === 'history' && (
        <TransactionList transactions={history?.data || []} type="withdraw" />
      )}
    </div>
  );
}
