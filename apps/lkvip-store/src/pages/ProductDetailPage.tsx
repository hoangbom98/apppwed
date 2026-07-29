import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, ArrowLeft, Download, Globe } from 'lucide-react';
import { useProductDetail } from '../hooks/useStore';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProductDetail(slug!);
  const { addItem, toggleCart }      = useCartStore();

  if (isLoading) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--store-muted)' }}>Đang tải...</div>;
  if (!product)  return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--store-muted)' }}>Không tìm thấy sản phẩm. <Link to="/products" style={{ color: 'var(--store-primary)' }}>← Quay lại</Link></div>;

  const avgRating = product.reviews?.length > 0
    ? (product.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  const handleAddToCart = () => {
    addItem({ productId: product.id, name: product.name, price: product.price.amount, currency: product.price.currency, type: product.type, image: product.images?.[0] });
    toast.success('Đã thêm vào giỏ hàng');
    toggleCart();
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--store-muted)', textDecoration: 'none', marginBottom: 24, fontWeight: 500 }}>
        <ArrowLeft size={15} /> Quay lại
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        {/* Left: detail */}
        <div>
          {/* Images */}
          <div style={{ background: '#f1f5f9', borderRadius: 14, overflow: 'hidden', marginBottom: 24, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Download size={48} color="#cbd5e1" />
            )}
          </div>

          {/* Description */}
          <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--store-text)', marginBottom: 12 }}>{product.name}</h1>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Star size={15} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>{avgRating}</span>
              <span style={{ fontSize: 13, color: 'var(--store-muted)' }}>({product.reviews.length} đánh giá)</span>
            </div>
          )}
          <p style={{ fontSize: 15, color: 'var(--store-muted)', lineHeight: 1.7, marginBottom: 20 }}>{product.description ?? product.shortDescription}</p>

          {/* Features */}
          {product.features?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', marginBottom: 10 }}>Tính năng</p>
              <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {product.features.map((f: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: 'var(--store-text)' }}>
                    <span style={{ color: 'var(--store-accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Demo link */}
          {product.demoUrl && (
            <a href={product.demoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--store-primary)', textDecoration: 'none', fontWeight: 600, marginBottom: 20 }}>
              <Globe size={14} /> Xem demo →
            </a>
          )}
        </div>

        {/* Right: purchase */}
        <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 14, padding: '24px', alignSelf: 'start', position: 'sticky', top: 80 }}>
          <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--store-primary)', marginBottom: 6 }}>
            {product.price.amount === 0 ? 'Miễn phí' : `${product.price.amount.toLocaleString('vi-VN')} ${product.price.currency}`}
          </p>
          {product.price.discount && (
            <p style={{ fontSize: 13, color: 'var(--store-danger)', marginBottom: 10 }}>Giảm {product.price.discount}%</p>
          )}
          {product.price.subscription && (
            <p style={{ fontSize: 12, color: 'var(--store-muted)', marginBottom: 14 }}>
              Hoặc {product.price.subscription.price.toLocaleString('vi-VN')} {product.price.currency}/{product.price.subscription.interval === 'monthly' ? 'tháng' : 'năm'}
            </p>
          )}
          <button
            onClick={handleAddToCart}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}
          >
            <ShoppingCart size={16} /> Thêm vào giỏ
          </button>
          <p style={{ fontSize: 12, color: 'var(--store-muted)', textAlign: 'center' }}>Giao hàng kỹ thuật số ngay lập tức</p>
          {/* Requirements */}
          {product.requirements?.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--store-border)' }}>
              <p style={{ fontWeight: 700, fontSize: 12, color: 'var(--store-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Yêu cầu</p>
              {product.requirements.map((r: string, i: number) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--store-muted)', marginBottom: 4 }}>• {r}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
