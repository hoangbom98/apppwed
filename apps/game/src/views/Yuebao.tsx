/**
 * Yuebao.tsx — Savings / Money Market (余额宝)
 * Features: product list, invest form, my holdings, interest info
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PiggyBank, TrendingUp, Clock, ChevronRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getYuebaoProducts, getMyYuebao, investYuebao } from '@/api/yuebao';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Đang sinh lãi', cls: 'text-green-400 bg-green-400/10' },
  completed: { label: 'Đã tất toán',   cls: 'text-gray-400  bg-gray-400/10'  },
  cancelled: { label: 'Đã hủy',        cls: 'text-red-400   bg-red-400/10'   },
};

interface InvestFormProps {
  product: any;
  onClose: () => void;
}

function InvestForm({ product, onClose }: InvestFormProps) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const quickAmounts = [100, 500, 1000, 5000, 10000];

  const mut = useMutation({
    mutationFn: investYuebao,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-yuebao'] });
      toast.success('Đầu tư thành công!');
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Có lỗi xảy ra'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full rounded-t-2xl p-5" style={{ background: 'var(--game-card-bg)' }}>
        <h3 className="font-bold text-base text-white mb-1">{product.title}</h3>
        <p className="text-xs text-gray-400 mb-4">
          Lãi suất {product.interestRate}% · Kỳ hạn {product.days} ngày · Tối thiểu {formatVND(product.minAmount)}
        </p>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {quickAmounts.map(a => (
            <button
              key={a}
              onClick={() => setAmount(String(a))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                amount === String(a)
                  ? 'text-black border-transparent'
                  : 'text-gray-400 border-white/10 bg-white/5'
              }`}
              style={amount === String(a) ? { background: 'var(--game-accent)' } : {}}
            >
              {formatVND(a)}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder={`Nhập số tiền (tối thiểu ${formatVND(product.minAmount)})`}
          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3 outline-none"
        />

        {/* Estimated profit */}
        {amount && Number(amount) >= product.minAmount && (
          <div className="bg-white/5 rounded-xl p-3 mb-4 text-xs text-gray-300">
            <div className="flex justify-between"><span>Số tiền đầu tư:</span><span className="text-white font-semibold">{formatVND(Number(amount))}</span></div>
            <div className="flex justify-between mt-1"><span>Lãi dự kiến:</span>
              <span className="font-semibold" style={{ color: 'var(--game-accent)' }}>
                +{formatVND(Number(amount) * product.interestRate / 100)}
              </span>
            </div>
            <div className="flex justify-between mt-1"><span>Đáo hạn:</span>
              <span className="text-white">{new Date(Date.now() + product.days * 86400000).toLocaleDateString('vi')}</span>
            </div>
          </div>
        )}

        <button
          disabled={!amount || Number(amount) < product.minAmount || mut.isPending}
          onClick={() => mut.mutate({ productId: product.id, amount: Number(amount) })}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background: 'var(--game-accent)', color: '#000' }}
        >
          {mut.isPending ? 'Đang xử lý...' : 'Xác nhận đầu tư'}
        </button>
      </div>
    </div>
  );
}

export default function Yuebao() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'products' | 'holdings'>('products');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: products = [], isLoading: pLoading } = useQuery({
    queryKey: ['yuebao-products'],
    queryFn:  getYuebaoProducts,
    select:   (r: any) => r?.data ?? r ?? [],
  });

  const { data: holdings = [], isLoading: hLoading } = useQuery({
    queryKey: ['my-yuebao'],
    queryFn:  getMyYuebao,
    enabled:  !!user && tab === 'holdings',
    select:   (r: any) => r?.data ?? [],
  });

  return (
    <div className="min-h-screen bg-dark pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
           style={{ background: 'var(--game-primary)' }}>
        <button onClick={() => window.history.back()} className="p-1 text-white">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-white font-bold text-base flex-1">Số dư Bảo</h1>
      </div>

      {/* Banner */}
      <div className="mx-4 mt-4 rounded-2xl p-5 text-white"
           style={{ background: 'linear-gradient(135deg, #1a6b45, #2d9e6b)' }}>
        <div className="flex items-center gap-3">
          <PiggyBank size={36} className="opacity-80" />
          <div>
            <p className="text-xs opacity-70">Gửi tiền sinh lãi hàng ngày</p>
            <p className="text-lg font-black mt-0.5">Lãi suất lên đến 15%/năm</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 rounded-xl overflow-hidden border border-white/10">
        {(['products', 'holdings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === t ? 'text-white' : 'text-gray-400 bg-white/5'
            }`}
            style={tab === t ? { background: 'var(--game-primary)' } : {}}
          >
            {t === 'products' ? 'Sản phẩm' : 'Đang nắm giữ'}
          </button>
        ))}
      </div>

      {/* Products */}
      {tab === 'products' && (
        <div className="mx-4 mt-4 space-y-3">
          {pLoading
            ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : products.map((p: any) => (
              <div key={p.id} className="game-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-sm font-bold text-white">{p.title}</span>
                      {p.stars > 0 && (
                        <span className="flex">
                          {[...Array(Math.min(p.stars, 5))].map((_, i) => (
                            <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Kỳ hạn {p.days} ngày · Tối thiểu {formatVND(p.minAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black" style={{ color: 'var(--game-accent)' }}>{p.interestRate}%</p>
                    <p className="text-[10px] text-gray-400">Lãi suất</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <TrendingUp size={12} />
                  <span>Thu nhập: {formatVND(1000 * p.interestRate / 100)} / 1,000 VND</span>
                  <Clock size={12} className="ml-auto" />
                  <span>Đáo hạn sau {p.days} ngày</span>
                </div>

                <button
                  onClick={() => user ? setSelectedProduct(p) : window.location.assign('/login')}
                  className="w-full py-2 rounded-xl text-sm font-bold text-black"
                  style={{ background: 'var(--game-accent)' }}
                >
                  Đầu tư ngay
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Holdings */}
      {tab === 'holdings' && (
        <div className="mx-4 mt-4 space-y-2">
          {!user ? (
            <div className="text-center py-16 text-gray-500 text-sm">
              <a href="/login" style={{ color: 'var(--game-accent)' }}>Đăng nhập</a> để xem
            </div>
          ) : hLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : holdings.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm">Chưa có khoản đầu tư nào</div>
          ) : (
            holdings.map((h: any) => {
              const st = STATUS_MAP[h.status] ?? STATUS_MAP.active;
              return (
                <div key={h.id} className="game-card rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{h.product?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Gốc: {formatVND(h.amount)} · Đáo hạn: {h.endDate?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--game-accent)' }}>
                      +{formatVND(h.profitPaid)}
                    </p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Invest modal */}
      {selectedProduct && (
        <InvestForm product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
