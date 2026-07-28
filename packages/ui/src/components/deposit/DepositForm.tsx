import React, { useState } from 'react';
import { Copy, Check, Bitcoin, CreditCard } from 'lucide-react';

export interface DepositConfig {
  projectName: string;
  projectKey: string;
  primaryColor: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  paymentMethods: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
    address?: string;
    instructions?: string;
  }>;
}

const DepositForm: React.FC<{ config: DepositConfig }> = ({ config }) => {
  const [amount, setAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState(config.paymentMethods[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const primaryColor = config.primaryColor || '#26A17B';

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickAmounts = [500, 1000, 5000, 10000];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full mx-auto">
      <h2 className="text-xl font-bold text-center mb-4" style={{ color: primaryColor }}>
        NẠP TIỀN VÀO VÍ {config.projectName}
      </h2>

      {/* Nhập số tiền */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vui lòng nhập số tiền nạp
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
            {config.currency}
          </span>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
            className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-lg font-semibold"
            style={{ borderColor: primaryColor }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Tối thiểu: {config.minAmount.toLocaleString()} {config.currency}</span>
          <span>Tối đa: {config.maxAmount.toLocaleString()} {config.currency}</span>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {quickAmounts.map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className="px-4 py-1.5 rounded-full border border-gray-300 text-sm hover:border-primary transition-colors"
              style={{ borderColor: amount === val ? primaryColor : '#d1d5db' }}
            >
              {val.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Chọn phương thức */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn kênh thanh toán
        </label>
        <div className="space-y-2">
          {config.paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                selectedMethod === method.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={selectedMethod === method.id ? { borderColor: primaryColor } : {}}
            >
              {method.icon}
              <div className="flex-1 text-left">
                <div className="font-medium">{method.name}</div>
                {method.instructions && (
                  <div className="text-xs text-gray-400">{method.instructions}</div>
                )}
              </div>
              {selectedMethod === method.id && (
                <Check size={18} style={{ color: primaryColor }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hiển thị địa chỉ ví nếu có */}
      {selectedMethod && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Địa chỉ ví:</span>
            <button
              onClick={() => {
                const method = config.paymentMethods.find(m => m.id === selectedMethod);
                if (method?.address) handleCopy(method.address);
              }}
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: primaryColor }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </button>
          </div>
          <div className="text-xs font-mono bg-white p-2 rounded border border-gray-200 mt-1 break-all">
            {config.paymentMethods.find(m => m.id === selectedMethod)?.address || '...'}
          </div>
        </div>
      )}

      {/* Nút tiếp tục */}
      <button
        className="w-full py-3 rounded-lg text-white font-bold text-lg transition-colors disabled:opacity-50"
        style={{ backgroundColor: primaryColor }}
        disabled={!amount || amount < config.minAmount}
      >
        Tiếp tục
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Bằng việc nạp tiền, bạn đồng ý với điều khoản và điều kiện của {config.projectName}
      </p>
    </div>
  );
};

export default DepositForm;
