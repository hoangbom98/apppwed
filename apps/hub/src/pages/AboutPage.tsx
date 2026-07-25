// frontend/hub/src/pages/AboutPage.tsx
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { title: 'Games',    desc: 'Hàng trăm game được tuyển chọn' },
  { title: 'Websites', desc: 'Tổng hợp website hữu ích' },
  { title: 'Tools',    desc: 'Công cụ hỗ trợ mọi nhu cầu' },
  { title: 'Tin tức',  desc: 'Cập nhật tin tức mỗi ngày' },
];

export default function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="hub-page">
      <button onClick={() => navigate(-1)} className="hub-view-all" style={{ marginBottom: 16 }}>
        ← Quay lại
      </button>

      <h1 className="hub-page-title">Giới thiệu về OKVIP Hub</h1>

      {/* Brand block */}
      <div style={{ background: 'var(--hub-bg-secondary)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <img src="/assets/gif/header-logo.gif" alt="OKVIP Hub Logo"
          style={{ height: 36, marginBottom: 14 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--hub-text-secondary)', margin: '0 0 10px' }}>
          <strong style={{ color: 'var(--hub-text)' }}>OKVIP Hub</strong> là cổng thông tin tổng hợp hàng đầu,
          cung cấp đầy đủ thông tin về games, websites, công cụ hữu ích và tin tức mới nhất.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--hub-text-secondary)', margin: 0 }}>
          Chúng tôi cam kết mang đến trải nghiệm tốt nhất, nội dung chất lượng và cập nhật liên tục mỗi ngày.
        </p>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{
            background: 'var(--hub-bg-secondary)', borderRadius: 12,
            padding: '14px 12px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: 'var(--hub-text)' }}>{f.title}</p>
            <p style={{ fontSize: 11, color: 'var(--hub-text-muted)', margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div style={{ background: 'var(--hub-bg-secondary)', borderRadius: 14, padding: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--hub-primary)' }}>Liên hệ</h2>
        <p style={{ fontSize: 13, color: 'var(--hub-text-secondary)', margin: '0 0 6px', lineHeight: 1.6 }}>
          Email: support@okviphub.com
        </p>
        <p style={{ fontSize: 13, color: 'var(--hub-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Fanpage:{' '}
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--hub-primary)', fontWeight: 700 }}>
            OKVIP Hub Official
          </a>
        </p>
      </div>
    </div>
  );
}
