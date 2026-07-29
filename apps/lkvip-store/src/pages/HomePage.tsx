import { ShoppingBag, Package, TrendingUp, Code, Cpu, BookOpen, Layers, ChevronRight, Star, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useStore';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

const FEATURED_CATEGORIES = [
  { type: 'service',     label: 'Dịch vụ số',   icon: Cpu,       color: '#3b82f6', desc: 'Phát triển phần mềm, tư vấn giải pháp, AI' },
  { type: 'source_code', label: 'Source Code',  icon: Code,      color: '#8b5cf6', desc: 'Monorepo, SPA, backend boilerplates' },
  { type: 'template',    label: 'Templates',    icon: Layers,    color: '#10b981', desc: 'UI kits, admin templates, landing pages' },
  { type: 'api',         label: 'API & Plugins', icon: Tag,       color: '#f59e0b', desc: 'REST APIs, Capacitor plugins, SDKs' },
  { type: 'course',      label: 'Khoá học',     icon: BookOpen,  color: '#ec4899', desc: 'Web development, Mobile, AI/ML' },
];

interface Product {
  id: string; name: string; slug: string; shortDescription: string;
  type: string; images: string[]; price: { amount: number; currency: string };
  reviews: { rating: number }[];
}

export default function HomePage() {
  const { data: featured } = useProducts({ page: 1 });
  const featuredProducts: Product[] = Array.isArray(featured?.data) ? featured.data.slice(0, 8) : [];
  const { addItem, toggleCart } = useCartStore();

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id, name: product.name, price: product.price.amount,
      currency: product.price.currency, type: product.type, image: product.images?.[0],
    });
    toast.success(`Đã thêm vào giỏ hàng`);
    toggleCart();
  };

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)', padding: '64px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 20, marginBottom: 20 }}>
            <ShoppingBag size={13} color="#3b82f6" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.5px' }}>DIGITAL MARKETPLACE</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, color: 'var(--store-text)', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
            Mua Bán <span style={{ color: 'var(--store-primary)' }}>Tài Nguyên Số</span>
            <br />& Dịch Vụ Công Nghệ
          </h1>
          <p style={{ fontSize: 15, color: 'var(--store-muted)', lineHeight: 1.7, marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
            Source code, templates, API, khoá học và dịch vụ phát triển phần mềm chất lượng cao từ đội ngũ LKVIP Group.
          </p>
          <Link
            to="/products"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: 'var(--store-primary)', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}
          >
            Khám phá ngay <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section style={{ padding: '48px 20px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--store-text)', marginBottom: 20 }}>Danh Mục Sản Phẩm</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
          {FEATURED_CATEGORIES.map(cat => (
            <Link
              key={cat.type}
              to={`/products?type=${cat.type}`}
              style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 10, padding: '18px 16px', textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <cat.icon size={20} color="#fff" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', marginBottom: 4 }}>{cat.label}</p>
              <p style={{ fontSize: 12, color: 'var(--store-muted)', lineHeight: 1.5 }}>{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section style={{ padding: '0 20px 56px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--store-text)' }}>Sản Phẩm Nổi Bật</h2>
            <Link to="/products" style={{ fontSize: 13, color: 'var(--store-primary)', textDecoration: 'none', fontWeight: 600 }}>Xem tất cả →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {featuredProducts.map(product => (
              <div key={product.id} className="product-card" style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, overflow: 'hidden' }}>
                <Link to={`/products/${product.slug}`} style={{ display: 'block', height: 130, background: '#f1f5f9', textDecoration: 'none' }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={36} color="#cbd5e1" />
                    </div>
                  )}
                </Link>
                <div style={{ padding: '14px 14px 12px' }}>
                  <Link to={`/products/${product.slug}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', textDecoration: 'none', lineHeight: 1.4, display: 'block', marginBottom: 8 }}>
                    {product.name}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--store-primary)' }}>
                      {product.price.amount === 0 ? 'Miễn phí' : `${product.price.amount.toLocaleString('vi-VN')} ${product.price.currency}`}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      style={{ padding: '6px 10px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <ShoppingBag size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Trust Banner ──────────────────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid var(--store-border)', padding: '40px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, textAlign: 'center' }}>
          {[
            { icon: Star,        label: 'Chất lượng cao',     sub: 'Kiểm duyệt kỹ trước khi đăng' },
            { icon: TrendingUp,  label: 'Cập nhật liên tục',  sub: 'Source code được bảo trì thường xuyên' },
            { icon: Package,     label: 'Giao hàng tức thì',  sub: 'Download ngay sau khi thanh toán' },
            { icon: ChevronRight,label: 'Hỗ trợ 24/7',       sub: 'Đội ngũ kỹ thuật luôn sẵn sàng' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label}>
              <Icon size={24} color="var(--store-primary)" style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 12, color: 'var(--store-muted)' }}>{sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
