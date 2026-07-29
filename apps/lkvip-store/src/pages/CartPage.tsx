import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCartStore();
  const nav = useNavigate();

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <ShoppingBag size={48} color="var(--store-border)" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--store-text)', marginBottom: 8 }}>Giỏ hàng trống</p>
        <p style={{ fontSize: 14, color: 'var(--store-muted)', marginBottom: 24 }}>Thêm sản phẩm vào giỏ hàng để tiếp tục</p>
        <button
          onClick={() => nav('/products')}
          style={{ padding: '11px 24px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          Khám phá sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--store-text)', marginBottom: 28 }}>Giỏ hàng ({items.length} sản phẩm)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => (
            <div key={item.productId} style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 8, background: '#f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={24} color="#cbd5e1" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                <p style={{ fontSize: 12, color: 'var(--store-muted)', marginBottom: 8 }}>{item.type}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} style={{ width: 26, height: 26, border: '1px solid var(--store-border)', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: 'var(--store-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} style={{ width: 26, height: 26, border: '1px solid var(--store-border)', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: 'var(--store-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--store-primary)', marginBottom: 8 }}>
                  {(item.price * item.quantity).toLocaleString('vi-VN')} {item.currency}
                </p>
                <button onClick={() => removeItem(item.productId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--store-danger)', padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button onClick={clearCart} style={{ alignSelf: 'flex-start', padding: '7px 14px', background: 'transparent', border: '1px solid var(--store-border)', borderRadius: 8, fontSize: 13, color: 'var(--store-muted)', cursor: 'pointer' }}>
            Xoá tất cả
          </button>
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '22px 20px', alignSelf: 'start' }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--store-text)', marginBottom: 16 }}>Tóm tắt đơn hàng</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
            <span style={{ color: 'var(--store-muted)' }}>Tạm tính</span>
            <span style={{ fontWeight: 600 }}>{totalPrice().toLocaleString('vi-VN')} VND</span>
          </div>
          <div style={{ borderTop: '1px solid var(--store-border)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Tổng cộng</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--store-primary)' }}>{totalPrice().toLocaleString('vi-VN')} VND</span>
          </div>
          <button
            onClick={() => nav('/checkout')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Thanh toán <ArrowRight size={16} />
          </button>
          <button
            onClick={() => nav('/products')}
            style={{ width: '100%', marginTop: 10, padding: '11px', background: 'transparent', border: '1px solid var(--store-border)', borderRadius: 8, fontSize: 14, color: 'var(--store-muted)', cursor: 'pointer' }}
          >
            Tiếp tục mua hàng
          </button>
        </div>
      </div>
    </div>
  );
}
