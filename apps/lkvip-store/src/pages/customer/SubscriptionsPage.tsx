import { RefreshCw, Calendar } from 'lucide-react';
import { useSubscriptions } from '../../hooks/useStore';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label: 'Đang hoạt động', bg: '#dcfce7', color: '#15803d' },
  paused:    { label: 'Tạm dừng',       bg: '#fef9c3', color: '#92400e' },
  expired:   { label: 'Hết hạn',        bg: '#fee2e2', color: '#b91c1c' },
  cancelled: { label: 'Đã huỷ',         bg: '#f1f5f9', color: '#475569' },
};

export default function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions();
  const subs = data?.data ?? data ?? [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--store-text)', marginBottom: 24 }}>Subscriptions</h1>
      {isLoading ? (
        <div style={{ color: 'var(--store-muted)', padding: '40px 0', textAlign: 'center' }}>Đang tải...</div>
      ) : subs.length === 0 ? (
        <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <RefreshCw size={36} color="var(--store-border)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--store-muted)' }}>Bạn chưa có subscription nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subs.map((sub: { id: string; productId: string; status: string; startDate: string; endDate: string; autoRenew: boolean }) => {
            const statusInfo = STATUS_MAP[sub.status] ?? STATUS_MAP.expired;
            return (
              <div key={sub.id} style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', marginBottom: 6 }}>Subscription #{sub.id.slice(-6).toUpperCase()}</p>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--store-muted)' }}>
                        <Calendar size={11} /> Từ: {new Date(sub.startDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--store-muted)' }}>
                        Đến: {new Date(sub.endDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span style={{ fontSize: 12, color: sub.autoRenew ? '#15803d' : 'var(--store-muted)' }}>
                        {sub.autoRenew ? '↺ Tự gia hạn' : 'Không tự gia hạn'}
                      </span>
                    </div>
                  </div>
                  <span style={{ padding: '5px 12px', background: statusInfo.bg, color: statusInfo.color, borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
