import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <p style={{ fontSize: 72, fontWeight: 900, color: 'var(--store-primary)', margin: 0, lineHeight: 1 }}>404</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--store-text)', margin: '12px 0 8px' }}>Trang không tồn tại</p>
      <p style={{ fontSize: 14, color: 'var(--store-muted)', marginBottom: 24 }}>Sản phẩm hoặc trang bạn tìm không tồn tại.</p>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--store-primary)', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
        <Home size={15} />
        Về cửa hàng
      </Link>
    </div>
  );
}
