import api from './httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalDeposit: number;
  totalWithdraw: number;
  balance: number;
  totalBet: number;
  winRate: number;
  totalBonus: number;
}

export interface ChartPoint {
  date: string;
  deposit: number;
  withdraw: number;
  bet: number;
}

export interface RecentTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'bonus';
  amount: number;
  status: 'success' | 'pending' | 'failed';
  description: string;
  createdAt: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  chart: ChartPoint[];
  recentTransactions: RecentTransaction[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get('/game/dashboard/summary');
  if (!data) throw new Error('Failed to fetch dashboard summary');
  return data?.data ?? data;
}

export async function fetchDashboardChart(days = 14): Promise<ChartPoint[]> {
  const { data } = await api.get('/game/dashboard/chart', { params: { days } });
  if (!data) throw new Error('Failed to fetch dashboard chart');
  return data?.data ?? data;
}

export async function fetchRecentTransactions(limit = 8): Promise<RecentTransaction[]> {
  const { data } = await api.get('/game/dashboard/transactions', { params: { limit } });
  if (!data) throw new Error('Failed to fetch recent transactions');
  return data?.data ?? data;
}

