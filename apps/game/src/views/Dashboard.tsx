import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import SummaryCards from '@/components/dashboard/SummaryCards';
import TransactionChart from '@/components/dashboard/TransactionChart';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Skeleton } from '@/components/chung/KhungTaiTrang';
import {
  fetchDashboardSummary,
  fetchDashboardChart,
  fetchRecentTransactions,
} from '@/api/apiBangDieuKhien';
import { formatVND } from '@/utils/dinhDang';
import { ACTION_ICONS } from '@/utils/tainguyen';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { balance } = useWalletStore();

  const summaryQ = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 60_000,
  });

  const chartQ = useQuery({
    queryKey: ['dashboard', 'chart'],
    queryFn: () => fetchDashboardChart(14),
    staleTime: 60_000,
  });

  const txQ = useQuery({
    queryKey: ['dashboard', 'transactions'],
    queryFn: () => fetchRecentTransactions(8),
    staleTime: 30_000,
  });

  const isLoading = summaryQ.isLoading || chartQ.isLoading || txQ.isLoading;

  const QUICK_ACTIONS = [
    { label: 'Nạp tiền',   to: '/deposit',    img: ACTION_ICONS.deposit },
    { label: 'Rút tiền',   to: '/withdraw',   img: ACTION_ICONS.withdraw },
    { label: 'Chơi game',  to: '/games',      img: ACTION_ICONS.games },
    { label: 'Khuyến mãi', to: '/promotions', img: ACTION_ICONS.promotions },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Welcome header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Chào mừng trở lại</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
            {user?.username ?? 'Người chơi'}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Số dư khả dụng</p>
          <p className="text-2xl font-black text-primary dark:text-accent">
            {formatVND(summaryQ.data?.balance ?? balance)}
          </p>
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ label, to, img }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-accent transition-all active:scale-95"
          >
            <img src={img} alt={label} className="w-8 h-8 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }} />
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 text-center">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── KPI Summary Cards ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : summaryQ.data ? (
        <SummaryCards data={summaryQ.data} />
      ) : null}

      {/* ── Transaction Chart ───────────────────────────────────────── */}
      {isLoading ? (
        <Skeleton className="h-72" />
      ) : chartQ.data ? (
        <TransactionChart data={chartQ.data} />
      ) : null}

      {/* ── Two-column: recent transactions + quick stats ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {isLoading ? (
          <Skeleton className="h-96" />
        ) : txQ.data ? (
          <RecentTransactions data={txQ.data} />
        ) : null}

        {/* Quick stats bars */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Thống kê nhanh</h3>
          {summaryQ.data && (
            <div className="space-y-4">
              {[
                { label: 'Tổng nạp',  value: summaryQ.data.totalDeposit,  color: 'bg-green-500',  pct: 100 },
                { label: 'Tổng rút',  value: summaryQ.data.totalWithdraw,  color: 'bg-red-500',    pct: Math.round((summaryQ.data.totalWithdraw  / summaryQ.data.totalDeposit) * 100) },
                { label: 'Tổng cược', value: summaryQ.data.totalBet,       color: 'bg-secondary',  pct: Math.min(100, Math.round((summaryQ.data.totalBet / summaryQ.data.totalDeposit) * 100)) },
                { label: 'Thưởng',   value: summaryQ.data.totalBonus,     color: 'bg-accent',     pct: Math.round((summaryQ.data.totalBonus   / summaryQ.data.totalDeposit) * 100) },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatVND(row.value)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ thắng tổng</span>
                <span className="text-2xl font-black text-accent">{summaryQ.data.winRate.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
