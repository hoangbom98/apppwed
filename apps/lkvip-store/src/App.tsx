import { lazy, Suspense, Component, type ErrorInfo, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StoreLayout from '@/layouts/StoreLayout';
import CustomerLayout from '@/layouts/CustomerLayout';
import { useAuthStore } from '@/store/authStore';

// ── ErrorBoundary ─────────────────────────────────────────────────────────────
interface EBState { error: Error | null }
class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[AppErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <p style={{ color: '#ef4444', fontWeight: 700 }}>Đã xảy ra lỗi. Vui lòng tải lại trang.</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ padding: '8px 20px', background: 'var(--store-primary)', color: '#fff', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Lazy pages — Public Store ─────────────────────────────────────────────────
const HomePage          = lazy(() => import('@/pages/HomePage'));
const ProductsPage      = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage          = lazy(() => import('@/pages/CartPage'));
const CheckoutPage      = lazy(() => import('@/pages/CheckoutPage'));
const LoginPage         = lazy(() => import('@/pages/LoginPage'));
const RegisterPage      = lazy(() => import('@/pages/RegisterPage'));
const NotFoundPage      = lazy(() => import('@/pages/NotFoundPage'));

// ── Lazy pages — Customer Area ────────────────────────────────────────────────
const MyResourcesPage    = lazy(() => import('@/pages/customer/MyResourcesPage'));
const OrdersPage         = lazy(() => import('@/pages/customer/OrdersPage'));
const APIKeysPage        = lazy(() => import('@/pages/customer/APIKeysPage'));
const SubscriptionsPage  = lazy(() => import('@/pages/customer/SubscriptionsPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--store-primary) transparent transparent transparent' }} />
    </div>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public store */}
          <Route element={<StoreLayout />}>
            <Route index                           element={<HomePage />} />
            <Route path="products"                 element={<ProductsPage />} />
            <Route path="products/:slug"           element={<ProductDetailPage />} />
            <Route path="cart"                     element={<CartPage />} />
            <Route path="checkout"                 element={<CheckoutPage />} />
            <Route path="login"                    element={<LoginPage />} />
            <Route path="register"                 element={<RegisterPage />} />
          </Route>

          {/* Customer portal — auth required */}
          <Route element={<AuthGuard><CustomerLayout /></AuthGuard>}>
            <Route path="customer"                 element={<MyResourcesPage />} />
            <Route path="customer/orders"          element={<OrdersPage />} />
            <Route path="customer/api-keys"        element={<APIKeysPage />} />
            <Route path="customer/subscriptions"   element={<SubscriptionsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}
