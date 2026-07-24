import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { deposit } from '@/api/wallet';
import { PAYMENT_METHODS, QUICK_AMOUNTS, ASSET_UI } from '@/utils/constants';
import { formatVND } from '@/utils/formatters';
import PageHeader from '@/components/common/PageHeader';
import toast from 'react-hot-toast';
import { ChevronRight, Gift, Shield, Clock } from 'lucide-react';

// Pay method with icons from applive18 pattern
const PAY_METHODS = [
  { id:'momo',    label:'MoMo',         icon:'💜', color:'#a50064', note:'Thanh toán tức thì' },
  { id:'zalopay', label:'ZaloPay',      icon:'💙', color:'#0068FF', note:'Thanh toán tức thì' },
  { id:'bank',    label:'Ngân hàng',    icon:'🏦', color:'#1a56db', note:'3 - 15 phút'        },
  { id:'usdt',    label:'USDT',         icon:'💵', color:'#26a17b', note:'5 - 10 phút'        },
];

// Coin packages (applive18 pattern: amount → coin_amount + bonus)
const COIN_PACKAGES = [
  { amount:20_000,   coins:20,   bonus:0,  label:'Gói khởi đầu'  },
  { amount:50_000,   coins:50,   bonus:5,  label:'Gói cơ bản'    },
  { amount:100_000,  coins:100,  bonus:15, label:'Gói phổ biến', hot:true },
  { amount:200_000,  coins:200,  bonus:40, label:'Gói giá trị'   },
  { amount:500_000,  coins:500,  bonus:120,label:'Gói VIP'        },
  { amount:1_000_000,coins:1000, bonus:300,label:'Gói Kim Cương', premium:true },
];

export default function Recharge() {
  const navigate  = useNavigate();
  const [method, setMethod]   = useState('momo');
  const [pkgIdx, setPkgIdx]   = useState(2); // default: popular
  const [customAmt, setCustomAmt] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const selectedPkg = COIN_PACKAGES[pkgIdx];
  const amount = useCustom ? (parseFloat(customAmt) || 0) : selectedPkg.amount;
  const coins  = useCustom ? Math.floor(amount / 1000) : selectedPkg.coins;
  const bonus  = useCustom ? 0 : selectedPkg.bonus;

  const { mutate, isPending } = useMutation({
    mutationFn: () => deposit({ amount, method, currency: 'VND' }),
    onSuccess: (data: any) => {
      toast.success('🎉 Tạo đơn nạp tiền thành công!');
      // If backend returns payment URL, open it
      if (data?.paymentUrl) window.open(data.paymentUrl, '_blank');
      else navigate('/wallet');
    },
    onError: () => toast.error('❌ Lỗi tạo đơn nạp tiền'),
  });

  return (
    <div className="bg-white min-h-screen">
      <PageHeader title="Nạp xu" />

      <div className="px-4 py-4 space-y-5 pb-24">
        {/* Coins package grid */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-amber-500">🪙</span> Chọn gói xu
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {COIN_PACKAGES.map((pkg, idx) => (
              <button key={idx}
                onClick={() => { setPkgIdx(idx); setUseCustom(false); }}
                className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                  !useCustom && pkgIdx === idx
                    ? 'border-pink-400 bg-gradient-to-b from-pink-50 to-rose-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-pink-200'
                }`}
              >
                {pkg.hot && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                    🔥 PHỔ BIẾN
                  </span>
                )}
                {pkg.premium && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                    💎 VIP
                  </span>
                )}
                <p className="text-2xl font-black text-amber-500">🪙 {pkg.coins.toLocaleString()}</p>
                {pkg.bonus > 0 && (
                  <p className="text-xs text-green-600 font-semibold mt-0.5">+{pkg.bonus} xu thưởng</p>
                )}
                <p className="text-sm font-bold text-gray-800 mt-1">{formatVND(pkg.amount)}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{pkg.label}</p>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className={`mt-3 border-2 rounded-2xl p-3 transition-all ${useCustom ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}`}>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">Nhập số tiền tùy chọn</label>
            <input type="number"
              value={customAmt}
              onChange={e => { setCustomAmt(e.target.value); setUseCustom(true); }}
              placeholder="Tối thiểu 20,000 ₫"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400 bg-white"
            />
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>💳</span> Phương thức thanh toán
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {PAY_METHODS.map(pm => (
              <button key={pm.id} onClick={() => setMethod(pm.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all ${
                  method === pm.id ? 'border-pink-400 bg-pink-50' : 'border-gray-200 bg-white hover:border-pink-200'
                }`}>
                <span className="text-2xl">{pm.icon}</span>
                <div className="text-left">
                  <p className={`font-semibold text-sm leading-tight ${method === pm.id ? 'text-pink-600' : 'text-gray-700'}`}>{pm.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{pm.note}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary & benefits */}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Tóm tắt đơn hàng</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Số tiền nạp:</span>
              <span className="font-bold text-gray-900">{formatVND(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Xu nhận được:</span>
              <span className="font-bold text-amber-500">🪙 {coins.toLocaleString()} xu</span>
            </div>
            {bonus > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Xu thưởng:</span>
                <span className="font-bold text-green-600">+🪙 {bonus} xu</span>
              </div>
            )}
            {(coins + bonus) > 0 && (
              <div className="flex justify-between text-sm border-t border-pink-200 pt-2 mt-2">
                <span className="font-bold text-gray-700">Tổng xu:</span>
                <span className="font-black text-pink-600 text-base">🪙 {(coins + bonus).toLocaleString()} xu</span>
              </div>
            )}
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-green-500" />
            <span>Bảo mật SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-blue-500" />
            <span>Hoàn tiền 24h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gift size={12} className="text-pink-500" />
            <span>Hoàn xu 100%</span>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-area-bottom">
        <button
          onClick={() => mutate()}
          disabled={isPending || amount <= 0}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 disabled:opacity-50 text-white font-black text-base rounded-2xl transition-all shadow-lg shadow-pink-500/30 flex items-center justify-center gap-3"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Nạp {formatVND(amount)}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
