import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, getWallet } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt } from '@/utils/formatters';
import { X, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { TradePair, OrderSide, OrderType } from '@/types';

interface Props {
  pair: TradePair;
  onClose: () => void;
}

const ORDER_TYPES = ['Thị trường', 'Giới hạn', 'Dừng lỗ'] as const;
const LEVERAGES   = [1, 2, 5, 10, 20] as const;

export default function OrderPanel({ pair, onClose }: Props) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [side, setSide]           = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<typeof ORDER_TYPES[number]>('Thị trường');
  const [price, setPrice]         = useState(fmt(pair.lastPrice, 2).replace(/,/g, ''));
  const [qty, setQty]             = useState('');
  const [percent, setPercent]     = useState(0);
  const [leverage, setLeverage]   = useState<typeof LEVERAGES[number]>(1);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');

  // Fetch real wallet balance
  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn:  () => getWallet(),
    enabled:  !!user,
    staleTime: 10_000,
  });
  const balance  = parseFloat(String(walletData?.data?.balance ?? 0));
  const frozen   = parseFloat(String(walletData?.data?.frozen  ?? 0));
  const available = Math.max(0, balance - frozen);

  const isUp  = pair.priceChange >= 0;
  const total = parseFloat(price || '0') * parseFloat(qty || '0');
  const margin = leverage > 1 ? total / leverage : total;

  const handlePercent = (pct: number) => {
    setPercent(pct);
    const cost = (available * pct) / 100;
    const effectivePrice = parseFloat(price || '1');
    // qty = (cost * leverage) / price  → user controls margin, not full size
    setQty((cost * leverage / effectivePrice).toFixed(6));
  };

  const handleSubmit = async () => {
    if (!user) { setMsg('Vui lòng đăng nhập để đặt lệnh'); return; }
    if (!qty || parseFloat(qty) <= 0) { setMsg('Nhập số lượng hợp lệ'); return; }
    if (side === 'buy' && margin > available + 0.01) {
      setMsg(`Số dư khả dụng không đủ (cần ${fmt(margin, 2)} USD)`);
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const typeMap: Record<typeof ORDER_TYPES[number], OrderType> = {
        'Thị trường': 'market',
        'Giới hạn':   'limit',
        'Dừng lỗ':    'stop',
      };
      await createOrder({
        symbol:   pair.symbol,
        side,
        type:     typeMap[orderType],
        price:    orderType !== 'Thị trường' ? parseFloat(price) : undefined,
        quantity: parseFloat(qty),
        leverage,
      } as Parameters<typeof createOrder>[0]);
      setMsg(`Đặt lệnh ${side === 'buy' ? 'MUA' : 'BÁN'} thành công!`);
      setQty('');
      setPercent(0);
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e: unknown) {
      const err = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMsg(err ?? 'Lỗi đặt lệnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-t-2xl md:rounded-2xl shadow-2xl p-5"
      style={{ background: 'var(--bn-bg-surface)', border: '1px solid var(--bn-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-white text-lg">{pair.symbol}</p>
          <p className={`text-sm font-semibold ${isUp ? 'text-[var(--bn-green)]' : 'text-[var(--bn-red)]'}`}>
            {isUp
              ? <TrendingUp size={12} className="inline mr-1" />
              : <TrendingDown size={12} className="inline mr-1" />
            }
            {fmt(pair.lastPrice, 2)} ({pair.priceChange > 0 ? '+' : ''}{pair.priceChange.toFixed(2)}%)
          </p>
          {user && (
            <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: 'var(--bn-text-secondary)' }}>
              <Wallet size={9} /> Khả dụng: <span className="text-white font-semibold">{fmt(available, 2)} USD</span>
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 transition-colors"
          style={{ color: 'var(--bn-text-secondary)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Buy / Sell toggle */}
      <div
        className="flex rounded-xl overflow-hidden mb-4"
        style={{ border: '1px solid var(--bn-border)' }}
      >
        <button
          onClick={() => setSide('buy')}
          className="flex-1 py-2.5 text-sm font-bold transition-colors"
          style={{
            background: side === 'buy' ? 'var(--bn-green)' : 'transparent',
            color: side === 'buy' ? '#0b0e11' : 'var(--bn-text-secondary)',
          }}
        >
          MUA
        </button>
        <button
          onClick={() => setSide('sell')}
          className="flex-1 py-2.5 text-sm font-bold transition-colors"
          style={{
            background: side === 'sell' ? 'var(--bn-red)' : 'transparent',
            color: side === 'sell' ? '#fff' : 'var(--bn-text-secondary)',
          }}
        >
          BÁN
        </button>
      </div>

      {/* Leverage selector */}
      <div className="mb-4">
        <label className="text-xs mb-1.5 block" style={{ color: 'var(--bn-text-secondary)' }}>
          Đòn bẩy (Leverage)
        </label>
        <div className="flex gap-1.5">
          {LEVERAGES.map(lv => (
            <button key={lv} onClick={() => { setLeverage(lv); setQty(''); setPercent(0); }}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={leverage === lv
                ? { background: 'var(--bn-yellow)', color: '#0b0e11' }
                : { background: 'var(--bn-bg-elevated)', color: 'var(--bn-text-secondary)' }
              }>
              {lv}x
            </button>
          ))}
        </div>
      </div>

      {/* Order Type */}
      <div className="flex gap-2 mb-4">
        {ORDER_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={orderType === t
              ? { background: 'rgba(240,185,11,0.12)', color: 'var(--bn-yellow)', border: '1px solid rgba(240,185,11,0.35)' }
              : { color: 'var(--bn-text-secondary)', border: '1px solid transparent' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Price input */}
      {orderType !== 'Thị trường' && (
        <div className="mb-3">
          <label className="text-xs mb-1 block" style={{ color: 'var(--bn-text-secondary)' }}>
            Giá ({pair.symbol.split('/')[1]})
          </label>
          <input
            type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            style={{
              background: 'var(--bn-bg-elevated)',
              border: '1px solid var(--bn-border)',
            }}
          />
        </div>
      )}

      {/* Quantity input */}
      <div className="mb-3">
        <label className="text-xs mb-1 block" style={{ color: 'var(--bn-text-secondary)' }}>
          Số lượng ({pair.symbol.split('/')[0]})
        </label>
        <input
          type="number" value={qty} onChange={e => setQty(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
          style={{
            background: 'var(--bn-bg-elevated)',
            border: '1px solid var(--bn-border)',
          }}
        />
      </div>

      {/* Percent buttons */}
      <div className="flex gap-2 mb-4">
        {[25, 50, 75, 100].map(p => (
          <button
            key={p}
            onClick={() => handlePercent(p)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={percent === p
              ? { background: 'var(--bn-yellow)', color: '#0b0e11' }
              : { background: 'var(--bn-bg-elevated)', color: 'var(--bn-text-secondary)' }
            }
          >
            {p}%
          </button>
        ))}
      </div>

      {/* Total & Margin */}
      <div className="py-3 mb-4 space-y-1" style={{ borderTop: '1px solid var(--bn-border)' }}>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>Tổng giá trị</span>
          <span className="font-bold text-white text-sm">{fmt(total, 2)} {pair.symbol.split('/')[1]}</span>
        </div>
        {leverage > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>Ký quỹ ({leverage}x)</span>
            <span className="text-xs font-semibold" style={{ color: margin > available ? 'var(--bn-red)' : 'var(--bn-green)' }}>
              {fmt(margin, 2)} {pair.symbol.split('/')[1]}
            </span>
          </div>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div
          className="mb-3 p-2.5 rounded-xl text-xs font-medium"
          style={msg.startsWith('Đặt lệnh')
            ? { background: 'rgba(14,203,129,0.1)', color: 'var(--bn-green)', border: '1px solid rgba(14,203,129,0.25)' }
            : { background: 'rgba(246,70,93,0.1)',  color: 'var(--bn-red)',   border: '1px solid rgba(246,70,93,0.25)'  }
          }
        >
          {msg}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
        style={side === 'buy'
          ? { background: 'var(--bn-green)', color: '#0b0e11' }
          : { background: 'var(--bn-red)',   color: '#fff'    }
        }
      >
        {loading ? 'Đang xử lý...' : `${side === 'buy' ? 'MUA' : 'BÁN'} ${pair.symbol.split('/')[0]}`}
      </button>
    </div>
  );
}
