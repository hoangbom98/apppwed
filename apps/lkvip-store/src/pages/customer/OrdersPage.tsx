import { ShoppingBag, Calendar } from 'lucide-react';
import { useOrders } from '../../hooks/useStore';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Chờ xử lý',  bg: '#fef9c3', color: '#92400e' },
  paid:       { label: 'Đã thanh toán', bg: '#dbeafe', color: '#1d4ed8' },
  processing: { label: 'Đang xử lý', bg: '#ede9fe', color: '#6d28d9' },
  completed:  { label: 'Hoàn thành', bg: '#dcfce7', color: '#15803d' },
  cancelled:  { label: 'Đã huỷ',     bg: '#fee2e2', color: '#b91c1c' },
  refunded:   { label: 'Hoàn tiền',  bg: '#f1f5f9', color: '#475569' },
};

export default function OrdersPage() {
  const { data, isLoading } = useOrders();
  const orders = data?.data ?? data ?? [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--store-text)', marginBottom: 24 }}>Lịch sử đơn hàng</h1>
      {isLoading ? (
        <div style={{ color: 'var(--store-muted)', padding: '40px 0', textAlign: 'center' }}>Đang tải...</div>
      ) : orders.length === 0 ? (
        <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <ShoppingBag size={36} color="var(--store-border)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--store-muted)' }}>Bạn chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order: { id: string; total: number; currency: string; status: string; createdAt: string; items: { productName: string; quantity: number; price: number }[] }) => {
            const statusInfo = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
            return (
              <div key={order.id} style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', marginBottom: 2 }}>#{order.id.slice(-8).toUpperCase()}</p>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--store-muted)' }}>
                      <Calendar size={11} /> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', background: statusInfo.bg, color: statusInfo.color, borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{statusInfo.label}</span>
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--store-primary)' }}>{order.total.toLocaleString('vi-VN')} {order.currency}</span>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--store-border)', paddingTop: 10 }}>
                  {order.items?.map((item, i) => (
                    <p key={i} style={{ fontSize: 13, color: 'var(--store-muted)', marginBottom: 3 }}>
                      {item.productName} ×{item.quantity} — {item.price.toLocaleString('vi-VN')}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
