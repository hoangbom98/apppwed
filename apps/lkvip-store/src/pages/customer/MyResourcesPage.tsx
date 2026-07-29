import { Download, Key, Calendar } from 'lucide-react';
import { useMyResources } from '../../hooks/useStore';

export default function MyResourcesPage() {
  const { data, isLoading } = useMyResources();
  const resources = data?.data ?? data ?? [];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--store-text)', marginBottom: 24 }}>Tài nguyên của tôi</h1>
      {isLoading ? (
        <div style={{ color: 'var(--store-muted)', padding: '40px 0', textAlign: 'center' }}>Đang tải...</div>
      ) : resources.length === 0 ? (
        <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <Download size={36} color="var(--store-border)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--store-muted)', fontSize: 15 }}>Bạn chưa mua tài nguyên nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resources.map((asset: { id: string; productId: string; licenseKey: string; downloadUrl: string; activatedAt: string; expiresAt?: string; downloads: number }) => (
            <div key={asset.id} style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Key size={15} color="var(--store-primary)" />
                    <code style={{ fontSize: 13, background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, color: 'var(--store-text)', letterSpacing: '0.5px' }}>{asset.licenseKey}</code>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--store-muted)' }}>
                      <Calendar size={12} /> Kích hoạt: {new Date(asset.activatedAt).toLocaleDateString('vi-VN')}
                    </span>
                    {asset.expiresAt && (
                      <span style={{ fontSize: 12, color: 'var(--store-muted)' }}>Hết hạn: {new Date(asset.expiresAt).toLocaleDateString('vi-VN')}</span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--store-muted)' }}>Đã tải: {asset.downloads} lần</span>
                  </div>
                </div>
                <a
                  href={asset.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--store-primary)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
                >
                  <Download size={14} /> Tải về
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
