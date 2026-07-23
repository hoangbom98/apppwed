import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBalance, getHistory } from '@/api/wallet';
import { useWalletStore } from '@/store/walletStore';
import { ArrowDownRight, ArrowUpRight, History, Eye, EyeOff } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { formatTime } from '@/utils/formatters';
import { ASSET_UI } from '@/utils/constants';

export default function Wallet() {
  const navigate = useNavigate();
  const { coins, diamonds, setBalance } = useWalletStore();
  const [showBankNum, setShowBankNum] = useState(false);

  useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const data = await getBalance();
      setBalance(data.coins, data.diamonds);
      return data;
    },
  });

  const { data: historyData } = useQuery({ queryKey: ['wallet-history'], queryFn: getHistory });
  const history = historyData?.transactions || [];
  const bankInfo = historyData?.bankInfo || null;

  // Mock bank info fallback for display
  const bankName   = bankInfo?.bankName   || 'VietcomBank';
  const bankNumber = bankInfo?.bankNumber || '••••••••1234';
  const maskedNum  = showBankNum ? bankNumber : `${bankNumber.slice(0, 4)}****${bankNumber.slice(-4)}`;

  const menuItems = [
    { icon: ASSET_UI.ICO_DEPOSIT,  label: 'Nạp tiền',     path: '/recharge',          bg: 'bg-green-50' },
    { icon: ASSET_UI.ICO_WITHDRAW, label: 'Rút tiền',     path: '/wallet?tab=withdraw', bg: 'bg-blue-50' },
    { icon: ASSET_UI.ICO_ORDERS,   label: 'Lệnh đặt',     path: '/wallet?tab=orders',  bg: 'bg-orange-50' },
    { icon: ASSET_UI.ICO_DEP_HIST, label: 'Lịch sử nạp', path: '/wallet?tab=deposits', bg: 'bg-purple-50' },
    { icon: ASSET_UI.ICO_WD_HIST,  label: 'Lịch sử rút', path: '/wallet?tab=withdrawals', bg: 'bg-rose-50' },
    { icon: ASSET_UI.ICO_WALLET,   label: 'Ngân hàng',   path: '/wallet?tab=bank',     bg: 'bg-gray-50' },
  ];

  return (
    <div>
      <PageHeader title="Ví của tôi" />

      {/* Main balance card */}
      <div className="px-4 mb-4">
        <div className="bg-gradient-to-r from-pink-500 to-rose-400 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm mb-1">Tổng tài sản</p>
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🪙</span>
                <span className="text-2xl font-black">{coins.toLocaleString()}</span>
                <span className="text-sm opacity-80">Xu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">💎</span>
                <span className="text-xl font-bold">{diamonds.toLocaleString()}</span>
                <span className="text-sm opacity-80">Kim cương</span>
              </div>
            </div>
            <button onClick={() => navigate('/recharge')}
              className="px-4 py-2 bg-white/20 border border-white/30 rounded-xl text-xs font-semibold hover:bg-white/30 transition-colors">
              Nạp ngay
            </button>
          </div>
        </div>
      </div>

      {/* Bank card */}
      <div className="px-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tài khoản ngân hàng</p>
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/60 mb-1">Ngân hàng</p>
              <p className="font-bold">{bankName}</p>
            </div>
            <span className="text-xs bg-white/10 px-2 py-1 rounded-lg">BANK</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-mono tracking-widest">{maskedNum}</p>
            <button onClick={() => setShowBankNum(v => !v)} className="ml-2">
              <img
                src={showBankNum ? ASSET_UI.EYE_OPEN : ASSET_UI.EYE_CLOSED}
                alt="toggle"
                className="w-5 h-5 object-contain opacity-70 hover:opacity-100"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                }}
              />
              {/* SVG fallback */}
              {showBankNum
                ? <Eye size={18} className="text-white/70" style={{display:'none'}} />
                : <EyeOff size={18} className="text-white/70" style={{display:'none'}} />}
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
            <button onClick={() => navigate('/wallet?tab=bank')}
              className="text-xs text-white/60 hover:text-white transition-colors">
              Chỉnh sửa ngân hàng
            </button>
            <button onClick={() => navigate('/wallet?tab=withdraw')}
              className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors">
              Rút tiền
            </button>
          </div>
        </div>
      </div>

      {/* Menu icons */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {menuItems.map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:border-pink-200 transition-colors shadow-sm active:scale-95">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
              </div>
              <span className="text-[11px] text-gray-700 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <History size={16} className="text-gray-400" />
          <h3 className="font-bold text-gray-900 text-sm">Lịch sử giao dịch</h3>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có giao dịch nào</div>
        ) : (
          <div className="space-y-2 pb-4">
            {history.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {t.amount > 0
                    ? <ArrowDownRight size={18} className="text-green-500" />
                    : <ArrowUpRight size={18} className="text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-400">{formatTime(t.created_at)}</p>
                </div>
                <span className={`font-bold text-sm ${t.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} xu
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
