import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useCheckout } from '../hooks/useStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { ShieldCheck, Smartphone, CreditCard, Banknote } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'momo',          label: 'MoMo',          icon: Smartphone,  desc: 'Thanh toán qua ví MoMo' },
  { id: 'usdt',          label: 'USDT (TRC20)',   icon: CreditCard,  desc: 'Stablecoin USDT – phí thấp' },
  { id: 'bank_transfer', label: 'Chuyển khoản',  icon: Banknote,    desc: 'Vietcombank, Techcombank...' },
];

export default function CheckoutPage() {
  const [method, setMethod] = useState('momo');
  const { items, totalPrice, clearCart } = useCartStore();
  const { isLoggedIn }                   = useAuthStore();
  const checkout                         = useCheckout();
  const nav                              = useNavigate();

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <p style={{ fontSize: 16, color: 'var(--store-muted)' }}>Vui lòng đăng nhập để thanh toán</p>
        <button onClick={() => nav('/login')} style={{ padding: '10px 24px', background: 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Đăng nhập</button>
      </div>
    );
  }

  if (items.length === 0) {
    nav('/products');
    return null;
  }

  const handleOrder = async () => {
    try {
      await checkout.mutateAsync({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: method,
      });
      clearCart();
      toast.success('Đặt hàng thành công! Kiểm tra tài nguyên của bạn.');
      nav('/customer');
    } catch {
      toast.error('Thanh toán thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--store-text)', marginBottom: 28 }}>Thanh Toán</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Payment method */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--store-text)', marginBottom: 14 }}>Phương thức thanh toán</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
              <label
                key={id}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--store-surface)', border: `2px solid ${method === id ? 'var(--store-primary)' : 'var(--store-border)'}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <input type="radio" name="payment" value={id} checked={method === id} onChange={() => setMethod(id)} style={{ accentColor: 'var(--store-primary)', width: 18, height: 18 }} />
                <Icon size={22} color={method === id ? 'var(--store-primary)' : 'var(--store-muted)'} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--store-text)', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--store-muted)', margin: 0 }}>{desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#15803d' }}>
            <ShieldCheck size={16} />
            Giao dịch được mã hoá và bảo mật. Tài nguyên được giao ngay sau khi thanh toán.
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background: 'var(--store-surface)', border: '1px solid var(--store-border)', borderRadius: 12, padding: '20px', alignSelf: 'start' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--store-text)', marginBottom: 14 }}>Đơn hàng ({items.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {items.map(item => (
              <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--store-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>{item.name} ×{item.quantity}</span>
                <span style={{ fontWeight: 600, flexShrink: 0 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--store-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontWeight: 700 }}>Tổng cộng</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--store-primary)' }}>{totalPrice().toLocaleString('vi-VN')} VND</span>
          </div>
          <button
            onClick={handleOrder}
            disabled={checkout.isPending}
            style={{ width: '100%', padding: '13px', background: checkout.isPending ? '#6b7280' : 'var(--store-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: checkout.isPending ? 'not-allowed' : 'pointer' }}
          >
            {checkout.isPending ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
