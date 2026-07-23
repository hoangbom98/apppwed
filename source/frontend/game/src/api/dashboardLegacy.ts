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

// ─── Mock Data ────────────────────────────────────────────────────────────────
const generateChartData = (): ChartPoint[] => {
  const data: ChartPoint[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      deposit: Math.floor(Math.random() * 5000000) + 500000,
      withdraw: Math.floor(Math.random() * 3000000) + 200000,
      bet: Math.floor(Math.random() * 8000000) + 1000000,
    });
  }
  return data;
};

const MOCK_DATA: DashboardData = {
  summary: {
    totalDeposit: 25_500_000,
    totalWithdraw: 12_300_000,
    balance: 3_750_000,
    totalBet: 45_200_000,
    winRate: 52.4,
    totalBonus: 1_250_000,
  },
  chart: generateChartData(),
  recentTransactions: [
    { id: 'TXN001', type: 'deposit',  amount: 2_000_000, status: 'success', description: 'Nạp tiền qua ngân hàng',  createdAt: '2026-07-20T03:00:00Z' },
    { id: 'TXN002', type: 'bet',      amount: 500_000,   status: 'success', description: 'Đặt cược Nổ Hũ',         createdAt: '2026-07-20T02:30:00Z' },
    { id: 'TXN003', type: 'win',      amount: 750_000,   status: 'success', description: 'Thắng cược – Nổ Hũ',    createdAt: '2026-07-20T02:31:00Z' },
    { id: 'TXN004', type: 'withdraw', amount: 1_000_000, status: 'pending', description: 'Rút tiền về VCB',        createdAt: '2026-07-20T01:45:00Z' },
    { id: 'TXN005', type: 'bonus',    amount: 200_000,   status: 'success', description: 'Thưởng nạp lần đầu',     createdAt: '2026-07-19T22:00:00Z' },
    { id: 'TXN006', type: 'deposit',  amount: 5_000_000, status: 'success', description: 'Nạp tiền qua USDT',      createdAt: '2026-07-19T20:00:00Z' },
    { id: 'TXN007', type: 'bet',      amount: 1_000_000, status: 'success', description: 'Đặt cược Bắn Cá',        createdAt: '2026-07-19T18:00:00Z' },
    { id: 'TXN008', type: 'withdraw', amount: 2_500_000, status: 'failed',  description: 'Rút tiền – từ chối',     createdAt: '2026-07-19T16:00:00Z' },
  ],
};

const USE_MOCK = false;

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 400));
    return MOCK_DATA.summary;
  }
  const { data } = await api.get('/game/dashboard/summary');
  return data?.data ?? data;
}

export async function fetchDashboardChart(days = 14): Promise<ChartPoint[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 600));
    return MOCK_DATA.chart;
  }
  const { data } = await api.get('/game/dashboard/chart', { params: { days } });
  return data?.data ?? data;
}

export async function fetchRecentTransactions(limit = 8): Promise<RecentTransaction[]> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_DATA.recentTransactions.slice(0, limit);
  }
  const { data } = await api.get('/game/dashboard/transactions', { params: { limit } });
  return data?.data ?? data;
}

