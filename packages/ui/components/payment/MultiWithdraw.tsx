// @ts-nocheck
/**
 * MultiWithdraw.tsx — shared-ui/components/payment
 * --------------------------------------------------
 * Unified withdrawal form supporting 4 channels:
 *   USDT (TRC20/ERC20/BEP20), Alipay, WeChat Pay, Bank Transfer
 *
 * Each channel renders its own account info sub-form.
 * Final payload: POST /payment/withdraw { gatewayCode, amount, address?, bankInfo? }
 *
 * Usage:
 *   <MultiWithdraw
 *     balance={walletBalance}
 *     onSuccess={(orderId) => toast('Yêu cầu đã được gửi!')}
 *   />
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import Button from '../Button';
import { BankOutlined } from '@ant-design/icons';

type Channel = 'usdt' | 'alipay' | 'wechat' | 'bank';

interface ChannelConfig {
  code:   Channel;
  label:  string;
  icon:   React.ReactNode;
  color:  string;
}

const CHANNELS: ChannelConfig[] = [
  { code: 'usdt',   label: 'USDT',      icon: '₮',                              color: 'text-green-600'  },
  { code: 'alipay', label: 'Alipay',    icon: <span style={{ color:'#1677ff' }}>A</span>, color: 'text-blue-600' },
  { code: 'wechat', label: 'WeChat Pay',icon: <span style={{ color:'#07c160' }}>W</span>, color: 'text-green-500' },
  { code: 'bank',   label: 'Ngân hàng', icon: <BankOutlined />,                 color: 'text-gray-700'   },
];

const VN_BANKS = [
  'Vietcombank', 'Techcombank', 'BIDV', 'VPBank', 'MB Bank',
  'Agribank', 'Sacombank', 'TPBank', 'ACB', 'VIB',
];

export interface MultiWithdrawProps {
  balance?:   number;
  minAmount?: number;
  onSuccess?: (orderId: string) => void;
}

export function MultiWithdraw({ balance = 0, minAmount = 50_000, onSuccess }: MultiWithdrawProps) {
  const [channel,  setChannel]  = useState<Channel>('usdt');
  const [amount,   setAmount]   = useState('');
  const [usdtNet,  setUsdtNet]  = useState('TRC20');
  const [address,  setAddress]  = useState('');
  const [phone,    setPhone]    = useState('');
  const [realName, setRealName] = useState('');
  const [bankCode, setBankCode] = useState('Vietcombank');
  const [acctNo,   setAcctNo]   = useState('');
  const [acctName, setAcctName] = useState('');

  const amt = parseFloat(amount) || 0;
  const feeRate = 0.005;
  const fee     = Math.ceil(amt * feeRate);
  const receive = Math.max(0, amt - fee);

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      let gatewayCode: string = channel;
      let address_: string | undefined;
      let bankInfo: Record<string, string> | undefined;

      switch (channel) {
        case 'usdt':
          address_ = address;
          break;
        case 'alipay':
        case 'wechat':
          bankInfo = { phone, realName, method: channel };
          break;
        case 'bank':
          bankInfo = { bankCode, accountNumber: acctNo, accountHolder: acctName };
          gatewayCode = 'bank';
          break;
      }

      const res = await api.post('/payment/withdraw', {
        gatewayCode,
        amount: amt,
        address: address_,
        bankInfo,
      });
      return res.data?.data as { orderId: string };
    },
    onSuccess: (data) => onSuccess?.(data?.orderId ?? ''),
  });

  const isValid = (): boolean => {
    if (amt < minAmount || amt > balance) return false;
    switch (channel) {
      case 'usdt':   return address.length > 10;
      case 'alipay':
      case 'wechat': return phone.length >= 10;
      case 'bank':   return acctNo.length >= 8 && acctName.length >= 3;
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-gray-800">Rút tiền</h3>

      {/* Channel selector */}
      <div className="grid grid-cols-4 gap-2">
        {CHANNELS.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => setChannel(c.code)}
            className={[
              'flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-1 transition-all text-xs font-medium',
              channel === c.code
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300',
            ].join(' ')}
          >
            <span className="text-xl">{c.icon}</span>
            <span className={channel === c.code ? 'text-blue-600' : 'text-gray-600'}>
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium text-gray-700">Số tiền rút</label>
          <span className="text-xs text-gray-500">
            Số dư: <span className="font-semibold text-gray-800">{balance.toLocaleString('vi-VN')} ₫</span>
          </span>
        </div>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min={minAmount}
          max={balance}
          placeholder={`Tối thiểu ${minAmount.toLocaleString('vi-VN')} ₫`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {amt > 0 && (
          <div className="mt-1.5 flex justify-between text-xs text-gray-500">
            <span>Phí: {fee.toLocaleString('vi-VN')} ₫ ({(feeRate * 100).toFixed(1)}%)</span>
            <span className="font-semibold text-green-600">Nhận: {receive.toLocaleString('vi-VN')} ₫</span>
          </div>
        )}
      </div>

      {/* Channel-specific fields */}
      {channel === 'usdt' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {['TRC20', 'ERC20', 'BEP20'].map(n => (
              <button key={n} type="button" onClick={() => setUsdtNet(n)}
                className={`rounded-lg border-2 py-1.5 text-xs font-semibold transition-colors ${
                  usdtNet === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                }`}>{n}</button>
            ))}
          </div>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={`Địa chỉ ví USDT ${usdtNet}`}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {(channel === 'alipay' || channel === 'wechat') && (
        <div className="space-y-3">
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Số điện thoại đăng ký"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={realName}
            onChange={e => setRealName(e.target.value)}
            placeholder="Họ tên chính chủ"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {channel === 'bank' && (
        <div className="space-y-3">
          <select
            value={bankCode}
            onChange={e => setBankCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {VN_BANKS.map(b => <option key={b}>{b}</option>)}
          </select>
          <input
            value={acctNo}
            onChange={e => setAcctNo(e.target.value)}
            placeholder="Số tài khoản"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            value={acctName}
            onChange={e => setAcctName(e.target.value)}
            placeholder="Tên chủ tài khoản (chính xác)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {/* Submit */}
      <Button
        className="w-full"
        disabled={!isValid()}
        loading={withdrawMutation.isPending}
        onClick={() => withdrawMutation.mutate()}
      >
        Xác nhận rút tiền
      </Button>

      {withdrawMutation.isSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 text-center">
          Yêu cầu rút tiền đã được gửi. Đang chờ xử lý.
        </div>
      )}

      {withdrawMutation.isError && (
        <p className="text-center text-sm text-red-600">
          {(withdrawMutation.error as any)?.response?.data?.message ?? 'Lỗi gửi yêu cầu rút tiền'}
        </p>
      )}
    </div>
  );
}

export default MultiWithdraw;
