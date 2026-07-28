import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getShopItems, getMyShopOrders, exchangeShopItem, getSigninRewardStatus } from '@/api/trade';
import { formatCoins, formatDate } from '@ui/formatters';
import type { ShopItem, ShopOrder } from '@/types';
import {
  ShoppingBag, Star, Package, CheckCircle2,
  XCircle, Clock, X, Loader2, ShoppingCart, Gift,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Helper styles ──────────────────────────────────────────────────────────────
const surface  = { background: 'var(--bn-bg-surface)',  border: '1px solid var(--bn-border)' };
const elevated = { background: 'var(--bn-bg-elevated)', border: '1px solid var(--bn-border)' };

// ── Order status config ────────────────────────────────────────────────────────
function OrderStatusBadge({ status }: { status: string }) {
  const cfg = {
    pending:   { color: '#eab308', bg: 'rgba(234,179,8,0.12)',    icon: Clock,        label: 'Đang xử lý' },
    completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    icon: CheckCircle2, label: 'Hoàn thành' },
    rejected:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: XCircle,      label: 'Từ chối'    },
  }[status] ?? { color: 'var(--bn-muted)', bg: 'var(--bn-bg-elevated)', icon: Clock, label: status };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ── Exchange modal ─────────────────────────────────────────────────────────────
function ExchangeModal({
  item, userPoints, onConfirm, onClose, isLoading,
}: {
  item: ShopItem;
  userPoints: number;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  const canAfford = userPoints >= item.pointsCost;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-5" style={surface}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{item.title}</h3>
            {item.description && (
              <p className="text-xs mt-1" style={{ color: 'var(--bn-muted)' }}>{item.description}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--bn-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Cost + balance */}
        <div className="rounded-xl p-4 space-y-2.5" style={elevated}>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--bn-muted)' }}>Chi phí đổi thưởng</span>
            <span className="font-bold" style={{ color: 'var(--bn-primary)' }}>
              -{formatCoins(item.pointsCost)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--bn-muted)' }}>Điểm hiện có</span>
            <span className="font-bold text-white">{formatCoins(userPoints)}</span>
          </div>
          <div className="border-t pt-2.5 flex items-center justify-between text-sm"
            style={{ borderColor: 'var(--bn-border)' }}>
            <span style={{ color: 'var(--bn-muted)' }}>Điểm còn lại</span>
            <span className="font-bold" style={{ color: canAfford ? 'var(--bn-green)' : 'var(--bn-red)' }}>
              {formatCoins(Math.max(0, userPoints - item.pointsCost))}
            </span>
          </div>
        </div>

        {!canAfford && (
          <p className="text-xs text-center p-2.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--bn-red)' }}>
            Không đủ điểm để đổi thưởng này
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'var(--bn-bg-elevated)', color: 'var(--bn-muted)' }}>
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford || isLoading}
            className="py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--bn-primary)', color: '#0b0e11' }}
          >
            {isLoading
              ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý…</>
              : <><ShoppingCart size={14} /> Đổi ngay</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shop Page ──────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab]       = useState<'items' | 'orders'>('items');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['shopItems'],
    queryFn:  getShopItems,
    staleTime: 60_000,
  });
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['shopOrders'],
    queryFn:  getMyShopOrders,
    enabled:  activeTab === 'orders',
  });
  // Get user points from signin-reward status (available points)
  const { data: rewardData } = useQuery({
    queryKey: ['signinRewardStatus'],
    queryFn:  getSigninRewardStatus,
    staleTime: 30_000,
  });

  const items:  ShopItem[]  = itemsData?.data  ?? [];
  const orders: ShopOrder[] = ordersData?.data  ?? [];
  const userPoints: number  = (rewardData?.data as any)?.points ?? 0;

  // ── Exchange mutation ─────────────────────────────────────────────────────────
  const exchangeMut = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) => exchangeShopItem({ itemId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopOrders'] });
      qc.invalidateQueries({ queryKey: ['signinRewardStatus'] });
      setSelectedItem(null);
      toast.success('🎁 Đổi thưởng thành công!');
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Không thể đổi thưởng'),
  });

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)' }}>
              <ShoppingBag size={18} style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Cửa hàng điểm</h1>
              <p className="text-xs" style={{ color: 'var(--bn-muted)' }}>
                Dùng điểm tích luỹ để đổi lấy phần thưởng
              </p>
            </div>
          </div>
          {/* User points badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={surface}>
            <Star size={14} fill="var(--bn-primary)" style={{ color: 'var(--bn-primary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--bn-primary)' }}>
              {formatCoins(userPoints)}
            </span>
            <span className="text-xs" style={{ color: 'var(--bn-muted)' }}>điểm của bạn</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bn-bg-elevated)' }}>
          {([
            { key: 'items',  label: 'Cửa hàng',         icon: ShoppingBag },
            { key: 'orders', label: 'Lịch sử đổi thưởng', icon: Package },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === key
                ? { background: 'var(--bn-bg-surface)', color: 'var(--bn-primary)' }
                : { color: 'var(--bn-muted)' }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Items ── */}
        {activeTab === 'items' && (
          <div>
            {itemsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-5 animate-pulse space-y-3" style={surface}>
                    <div className="h-32 rounded-xl" style={{ background: 'var(--bn-bg-elevated)' }} />
                    <div className="h-4 rounded-lg w-3/4" style={{ background: 'var(--bn-bg-elevated)' }} />
                    <div className="h-3 rounded-lg w-1/2" style={{ background: 'var(--bn-bg-elevated)' }} />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl py-16 text-center" style={surface}>
                <ShoppingBag size={36} className="mx-auto mb-3" style={{ color: 'var(--bn-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--bn-muted)' }}>Cửa hàng đang cập nhật</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => {
                  const canAfford = userPoints >= item.pointsCost;
                  const outOfStock = item.stock === 0;
                  return (
                    <div key={item.id}
                      className="rounded-2xl overflow-hidden flex flex-col transition-all hover:ring-1 hover:ring-yellow-400/30"
                      style={surface}>
                      {/* Item image */}
                      {item.image ? (
                        <img src={item.image} alt={item.title}
                          className="w-full h-36 object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-36 flex items-center justify-center"
                          style={{ background: 'var(--bn-bg-elevated)' }}>
                          <Gift size={40} style={{ color: 'var(--bn-muted)' }} />
                        </div>
                      )}

                      <div className="p-4 flex flex-col flex-1 gap-3">
                        {/* Title + stock badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            {item.description && (
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--bn-muted)' }}>
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={outOfStock
                              ? { background: 'var(--bn-bg-elevated)', color: 'var(--bn-muted)' }
                              : { background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                            {outOfStock ? 'Hết hàng' : `Còn ${item.stock}`}
                          </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-sm font-bold flex items-center gap-1"
                            style={{ color: 'var(--bn-primary)' }}>
                            <Star size={13} fill="var(--bn-primary)" />
                            {formatCoins(item.pointsCost)}
                          </span>
                          <button
                            onClick={() => setSelectedItem(item)}
                            disabled={outOfStock || !canAfford}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                            style={canAfford && !outOfStock
                              ? { background: 'var(--bn-primary)', color: '#0b0e11' }
                              : { background: 'var(--bn-bg-elevated)', color: 'var(--bn-muted)' }}
                          >
                            {outOfStock ? 'Hết hàng' : !canAfford ? 'Không đủ điểm' : 'Đổi ngay'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Orders ── */}
        {activeTab === 'orders' && (
          <div className="rounded-2xl overflow-hidden" style={surface}>
            {/* Table header */}
            <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--bn-muted)', borderBottom: '1px solid var(--bn-border)' }}>
              <span className="col-span-5">Phần thưởng</span>
              <span className="col-span-2 text-right">Điểm</span>
              <span className="col-span-2 text-center">Số lượng</span>
              <span className="col-span-2 text-center">Trạng thái</span>
              <span className="col-span-1 text-right">Ngày</span>
            </div>

            {ordersLoading ? (
              <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="h-4 flex-1 rounded-lg" style={{ background: 'var(--bn-bg-elevated)' }} />
                    <div className="h-4 w-20 rounded-lg" style={{ background: 'var(--bn-bg-elevated)' }} />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center">
                <Package size={32} className="mx-auto mb-3" style={{ color: 'var(--bn-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--bn-muted)' }}>Chưa có lịch sử đổi thưởng</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--bn-border)' }}>
                {orders.map((order) => (
                  <div key={order.id} className="grid grid-cols-12 items-center px-5 py-3.5">
                    <span className="col-span-5 text-sm text-white font-medium">
                      {order.item?.title ?? `#${order.id.slice(-6)}`}
                    </span>
                    <span className="col-span-2 text-right text-sm font-bold"
                      style={{ color: 'var(--bn-primary)' }}>
                      {order.item ? formatCoins(order.item.pointsCost * order.quantity) : '—'}
                    </span>
                    <span className="col-span-2 text-center text-sm text-white">
                      {order.quantity}
                    </span>
                    <div className="col-span-2 flex justify-center">
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <span className="col-span-1 text-right text-[11px]"
                      style={{ color: 'var(--bn-muted)' }}>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exchange confirmation modal */}
      {selectedItem && (
        <ExchangeModal
          item={selectedItem}
          userPoints={userPoints}
          onConfirm={() => exchangeMut.mutate({ itemId: selectedItem.id })}
          onClose={() => setSelectedItem(null)}
          isLoading={exchangeMut.isPending}
        />
      )}
    </>
  );
}
