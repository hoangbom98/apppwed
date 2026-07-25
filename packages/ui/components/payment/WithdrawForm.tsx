// @ts-nocheck
/**
 * WithdrawForm.jsx — Shared withdrawal form component.
 *
 * Usage (Game, Dating, Trade, Sports):
 *   import { WithdrawForm } from '@ui';
 *   <WithdrawForm onSuccess={(order) => showSuccess(order)} />
 *
 * The component:
 *  1. Loads available withdraw methods from /payment/gateways
 *  2. Renders a GatewaySelector + amount input + address input
 *  3. Validates via shared Yup withdrawSchema
 *  4. Submits to POST /{project}/payment/withdraw
 *  5. Calls onSuccess(order) after confirmed
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import { withdrawSchema } from '../../utils/validators';
import { useWalletStore } from '../../store/walletStore';
import { formatVND } from '../../utils/formatters';
import GatewaySelector from './GatewaySelector';
import Input from '../Form/Input';
import FormField from '../Form/FormField';
import Button from '../Button';
import Spinner from '../Spinner';

const project = import.meta.env.VITE_PROJECT || 'game';

/**
 * @param {{
 *   minAmount?:   number   – minimum withdrawal (default 50000)
 *   onSuccess?:   (order: object) => void
 *   className?:   string
 * }} props
 */
export default function WithdrawForm({ minAmount = 50_000, onSuccess, className = '' }) {
  const { balance, fetchBalance } = useWalletStore();
  const [selectedGw, setSelectedGw] = useState(null);
  const [serverError, setServerError] = useState(null);

  const schema = withdrawSchema(minAmount, balance);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data) =>
      api.post(`/${project}/payment/withdraw`, {
        amount:         Number(data.amount),
        payment_method: selectedGw,
        address:        data.address,
      }).then(r => r.data?.data ?? r.data),

    onSuccess: (order) => {
      fetchBalance();
      reset();
      setSelectedGw(null);
      setServerError(null);
      onSuccess?.(order);
    },
    onError: (err) => {
      setServerError(err.response?.data?.message || 'Rút tiền thất bại. Vui lòng thử lại.');
    },
  });

  const onSubmit = (data) => {
    if (!selectedGw) { setServerError('Vui lòng chọn phương thức rút tiền.'); return; }
    setServerError(null);
    mutation.mutate(data);
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Current balance hint */}
      <div className="text-sm text-gray-400">
        Số dư khả dụng:{' '}
        <span className="text-white font-semibold">{formatVND(balance)}</span>
      </div>

      {/* Gateway selector */}
      <div>
        <p className="text-sm text-gray-300 mb-2 font-medium">Phương thức rút tiền</p>
        <GatewaySelector selected={selectedGw} onChange={setSelectedGw} disabled={mutation.isPending} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Amount */}
        <FormField label="Số tiền rút" error={errors.amount?.message}>
          <Input
            type="number"
            placeholder={`Tối thiểu ${minAmount.toLocaleString('vi-VN')} ₫`}
            {...register('amount')}
            disabled={mutation.isPending}
          />
        </FormField>

        {/* Address / account number */}
        <FormField label="Địa chỉ / Số tài khoản" error={errors.address?.message}>
          <Input
            type="text"
            placeholder="Nhập số tài khoản hoặc địa chỉ ví"
            {...register('address')}
            disabled={mutation.isPending}
          />
        </FormField>

        {/* Server error */}
        {serverError && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2.5">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? <><Spinner size="xs" className="mr-2" /> Đang xử lý…</> : 'Rút tiền'}
        </Button>
      </form>
    </div>
  );
}
