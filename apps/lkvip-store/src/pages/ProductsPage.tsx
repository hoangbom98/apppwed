import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Star, Tag, Code, Cpu, BookOpen, Layers } from 'lucide-react';
import { useProducts } from '../hooks/useStore';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

const CATEGORY_ICONS: Record<string, typeof Tag> = {
  service:       Cpu,
  source_code:   Code,
  template:      Layers,
  api:           Tag,
  course:        BookOpen,
};

const TYPE_LABELS: Record<string, string> = {
  service:       'Dịch vụ',
  digital_asset: 'Tài nguyên số',
  subscription:  'Subscription',
  template:      'Template',
  api:           'API',
  course:        'Khoá học',
};

const CATEGORY_LIST = [
  { value: 'service',     label: 'Dịch vụ số' },
  { value: 'source_code', label: 'Source code' },
  { value: 'template',    label: 'Templates' },
  { value: 'api',         label: 'API & Plugins' },
  { value: 'course',      label: 'Khoá học' },
];

export default function ProductsPage() {
  const [sp, setSp] = useSearchParams();
  const type     = sp.get('type') ?? undefined;
  const q        = sp.get('q') ?? undefined;
  const page     = Number(sp.get('page') ?? 1);
  const { addItem, toggleCart } = useCartStore();

  const { data, isLoading } = useProducts({ type, q, page });
  const products: Product[] = data?.data ?? data ?? [];

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name:      product.name,
      price:     product.price.amount,
      currency:  product.price.currency,
      type:      product.type,
      image:     product.images?.[0],
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
    toggleCart();
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--store-text)', marginBottom: 8 }}>
          {q ? `Kết quả cho "${q}"` : type ? (CATEGORY_LIST.find(c => c.value === type)?.label ?? 'Sản phẩm') : 'Tất cả sản phẩm'}
        </h1>
        {data?.total !== undefined && (
          <p style={{ fontSize: 14, color: 'var(--store-muted)' }}>{data.total} sản phẩm</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar filters */}
        <aside style={{ width: 200, flexShrink: 0 }} className="hidden md:block">
          <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--store-border)', fontWeight: 700, fontSize: 13, color: 'var(--store-text)' }}>Danh mục</div>
            <button
              onClick={() => { sp.delete('type'); setSp(sp); }}
              style={{ display: 'block', width: '100%', padding: '11px 16px', background: !type ? '#eff6ff' : 'transparent', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: !type ? 700 : 400, color: !type ? 'var(--store-primary)' : 'var(--store-text)', cursor: 'pointer', borderLeft: !type ? '3px solid var(--store-primary)' : '3px solid transparent' }}
            >
              Tất cả
            </button>
            {CATEGORY_LIST.map(cat => (
              <button
                key={cat.value}
                onClick={() => { sp.set('type', cat.value); setSp(sp); }}
                style={{ display: 'block', width: '100%', padding: '11px 16px', background: type === cat.value ? '#eff6ff' : 'transparent', border: 'none', textAlign: 'left', fontSize: 13, fontWeight: type === cat.value ? 700 : 400, color: type === cat.value ? 'var(--store-primary)' : 'var(--store-text)', cursor: 'pointer', borderLeft: type === cat.value ? '3px solid var(--store-primary)' : '3px solid transparent' }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Product grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, height: 260, animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 16, color: 'var(--store-muted)', marginBottom: 12 }}>Không tìm thấy sản phẩm nào</p>
              <Link to="/products" style={{ color: 'var(--store-primary)', textDecoration: 'none', fontSize: 14 }}>Xem tất cả sản phẩm</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {products.map((product: Product) => {
                const Icon = CATEGORY_ICONS[product.type] ?? Tag;
                return (
                  <div key={product.id} className="product-card" style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, overflow: 'hidden' }}>
                    {/* Thumbnail */}
                    <div style={{ height: 140, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Icon size={40} color="var(--store-border)" />
                      )}
                      <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 11, fontWeight: 700, padding: '3px 8px', background: 'var(--store-primary)', color: '#fff', borderRadius: 4 }}>
                        {TYPE_LABELS[product.type] ?? product.type}
                      </span>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '14px 14px 12px' }}>
                      <Link to={`/products/${product.slug}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', textDecoration: 'none', lineHeight: 1.4, display: 'block', marginBottom: 6 }}>
                        {product.name}
                      </Link>
                      <p style={{ fontSize: 12, color: 'var(--store-muted)', marginBottom: 10, lineHeight: 1.5 }}>{product.shortDescription?.slice(0, 70)}…</p>
                      {/* Rating */}
                      {product.reviews?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                          <Star size={12} color="#f59e0b" fill="#f59e0b" />
                          <span style={{ fontSize: 12, color: 'var(--store-muted)' }}>
                            {(product.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / product.reviews.length).toFixed(1)}
                            <span style={{ marginLeft: 4 }}>({product.reviews.length})</span>
                          </span>
                        </div>
                      )}
                      {/* Price + Add to cart */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--store-primary)' }}>
                          {product.price.amount === 0 ? 'Miễn phí' : `${product.price.amount.toLocaleString('vi-VN')} ${product.price.currency}`}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          style={{ padding: '7px 10px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <ShoppingCart size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Product {
  id: string; name: string; slug: string; shortDescription: string;
  type: string; images: string[]; price: { amount: number; currency: string };
  reviews: { rating: number }[];
}
