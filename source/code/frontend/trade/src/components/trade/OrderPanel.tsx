import { useState } from 'react';
import { createOrder } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt } from '@/utils/formatters';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

interface Pair {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  high24h: number;
  low24h: number;
}

interface Props {
  pair: Pair;
  onClose: () => void;
}

const ORDER_TYPES = ['Thị trường', 'Giới hạn', 'Dừng lỗ'] as const;

export default function OrderPanel({ pair, onClose }: Props) {
  const { user } = useAuthStore();
  const [side, setSide]           = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<typeof ORDER_TYPES[number]>('Thị trường');
  const [price, setPrice]         = useState(fmt(pair.lastPrice, 2).replace(/,/g, ''));
  const [qty, setQty]             = useState('');
  const [percent, setPercent]     = useState(0);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');

  const isUp  = pair.priceChange >= 0;
  const total = parseFloat(price || '0') * parseFloat(qty || '0');

  const handlePercent = (pct: number) => {
    setPercent(pct);
    const available = 1000; // mock balance
    const cost = (available * pct) / 100;
    setQty((cost / parseFloat(price || '1')).toFixed(6));
  };

  const handleSubmit = async () => {
    if (!user) { setMsg('Vui lòng đăng nhập để đặt lệnh'); return; }
    if (!qty || parseFloat(qty) <= 0) { setMsg('Nhập số lượng hợp lệ'); return; }
    setLoading(true);
    setMsg('');
    try {
      const typeMap: Record<typeof ORDER_TYPES[number], string> = {
        'Thị trường': 'market',
        'Giới hạn':   'limit',
        'Dừng lỗ':    'stop',
      };
      // Backend orderController accepts symbol code (e.g. "BTCUSDT" or "BTC/USDT")
      await createOrder({
        symbol:   pair.symbol,
        side,
        type:     typeMap[orderType],
        price:    orderType !== 'Thị trường' ? parseFloat(price) : undefined,
        quantity: parseFloat(qty),
      });
      setMsg(`✅ Đặt lệnh ${side === 'buy' ? 'MUA' : 'BÁN'} thành công!`);
      setQty('');
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Lỗi đặt lệnh');
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

      {/* Total */}
      <div
        className="flex justify-between items-center py-3 mb-4"
        style={{ borderTop: '1px solid var(--bn-border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--bn-text-secondary)' }}>Tổng giá trị</span>
        <span className="font-bold text-white">{fmt(total, 2)} {pair.symbol.split('/')[1]}</span>
      </div>

      {/* Message */}
      {msg && (
        <div
          className="mb-3 p-2.5 rounded-xl text-xs font-medium"
          style={msg.startsWith('✅')
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
