import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  ChevronRight,
  LineChart,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getPairs, getPortfolio } from '@/api/trade';
import { useAuthStore } from '@/store/authStore';
import { fmt, fmtPct } from '@/utils/formatters';
import type { TradePair } from '@/types';

function Metric({ label, value, tone = 'primary' }: { label: string; value: string; tone?: 'primary' | 'green' | 'muted' }) {
  const color = tone === 'green' ? 'var(--bn-trading-up)' : tone === 'muted' ? 'var(--bn-muted)' : 'var(--bn-primary)';
  return (
    <div>
      <p className="text-[10px] bn-muted">{label}</p>
      <p className="mt-1 text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function PairRow({ pair, onOpen }: { pair: TradePair; onOpen: () => void }) {
  const positive = pair.priceChange >= 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between border-b py-3 text-left last:border-0"
      style={{ borderColor: 'var(--bn-hairline-dark)' }}
    >
      <div>
        <p className="text-sm font-semibold text-white">{pair.symbol}</p>
        <p className="mt-0.5 text-[11px] bn-muted">
          {pair.baseAsset}
        </p>
      </div>
      <div className="text-right">
        <p className="bn-number text-sm font-semibold text-white">
          {fmt(pair.lastPrice, pair.lastPrice < 1 ? 6 : 2)}
        </p>
        <p className={`mt-0.5 text-xs font-semibold ${positive ? 'bn-green' : 'bn-red'}`}>
          {fmtPct(pair.priceChange)}
        </p>
      </div>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { data: pairsData, isLoading: pairsLoading } = useQuery({
    queryKey: ['home-pairs'],
    queryFn: () => getPairs(),
    refetchInterval: 5000,
  });
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['home-portfolio'],
    queryFn: () => getPortfolio(),
    enabled: Boolean(token),
    refetchInterval: 10000,
  });

  const pairs = (pairsData?.data ?? []).slice(0, 5);
  const portfolio = portfolioData?.data;
  const balance = Number(portfolio?.balance ?? 0);
  const frozen = Number(portfolio?.frozen ?? 0);
  const pnl = Number(portfolio?.unrealisedPnl ?? 0);
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'bạn';

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="flex items-center justify-between md:hidden">
        <div>
          <p className="text-[11px] bn-muted">Chào mừng trở lại</p>
          <h1 className="mt-0.5 text-lg font-bold text-white">Xin chào, {displayName}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/notifications" className="rounded-[var(--bn-rounded-md)] p-2 bn-muted" aria-label="Thông báo">
            <Bell size={19} />
          </Link>
          <Link to="/profile" className="rounded-[var(--bn-rounded-md)] p-2 bn-yellow" aria-label="Cá nhân">
            <User size={19} />
          </Link>
        </div>
      </header>

      <section className="rounded-[var(--bn-rounded-xl)] p-5 shadow-lg" style={{ background: 'var(--bn-surface-card-dark)', border: '1px solid var(--bn-hairline-dark)' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs bn-muted">Tổng tài sản</p>
          {token ? <Wallet size={16} className="bn-yellow" /> : <Zap size={16} className="bn-yellow" />}
        </div>
        {token ? (
          <>
            <p className="bn-number mt-2 text-3xl font-bold text-white">
              {portfolioLoading ? '—' : `${fmt(balance, 2)} USDT`}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label="Khả dụng" value={portfolioLoading ? '—' : `${fmt(balance - frozen, 2)}`} />
              <Metric label="Đang khóa" value={portfolioLoading ? '—' : `${fmt(frozen, 2)}`} tone="muted" />
              <Metric label="P&L chưa thực hiện" value={portfolioLoading ? '—' : `${pnl >= 0 ? '+' : ''}${fmt(pnl, 2)}`} tone={pnl >= 0 ? 'green' : 'muted'} />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-2xl font-bold text-white">Đăng nhập để xem số dư</p>
            <Link to="/login" className="mt-4 inline-flex items-center gap-2 rounded-[var(--bn-rounded-md)] px-4 py-2 text-sm font-bold bn-btn-primary">
              Đăng nhập <ChevronRight size={15} />
            </Link>
          </>
        )}
      </section>

      <section className="grid grid-cols-4 gap-2">
        {[
          { label: 'Nạp tiền', icon: ArrowDownToLine, to: '/deposit', color: 'var(--bn-trading-up)' },
          { label: 'Ví', icon: Wallet, to: '/wallet', color: 'var(--bn-primary)' },
          { label: 'AI Quant', icon: Zap, to: '/investment', color: '#a78bfa' },
          { label: 'Danh mục', icon: LineChart, to: '/portfolio', color: '#60a5fa' },
        ].map(({ label, icon: Icon, to, color }) => (
          <Link key={to} to={to} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[var(--bn-rounded-md)] p-2 text-center bn-surface-dark" style={{ border: '1px solid var(--bn-hairline-dark)' }}>
            <Icon size={19} style={{ color }} />
            <span className="text-[11px] font-medium text-white">{label}</span>
          </Link>
        ))}
      </section>

      <section className="rounded-[var(--bn-rounded-xl)] p-4 bn-surface-dark" style={{ border: '1px solid var(--bn-hairline-dark)' }}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Thị trường nổi bật</h2>
          <Link to="/markets" className="flex items-center gap-1 text-xs bn-yellow">Xem tất cả <ChevronRight size={13} /></Link>
        </div>
        {pairsLoading && <p className="py-6 text-center text-xs bn-muted">Đang tải dữ liệu thị trường…</p>}
        {!pairsLoading && pairs.length === 0 && <p className="py-6 text-center text-xs bn-muted">Chưa có dữ liệu thị trường</p>}
        {pairs.map((pair) => <PairRow key={pair.symbol} pair={pair} onOpen={() => navigate('/terminal')} />)}
      </section>
    </div>
  );
}
