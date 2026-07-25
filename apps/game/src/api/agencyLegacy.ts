import api from './httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AgentInfo {
  isAgent: boolean;
  agentId?: string;
  level?: number;
  commissionRate?: number;
  totalCommission?: number;
  status?: string;
  referralCode?: string | null;
  referralCount?: number;
  totalReferralBonus?: number;
  createdAt?: string;
}

export interface AgentOverview {
  isAgent: boolean;
  referralCode: string | null;
  referralCount: number;
  totalCommission: number;
  commissionRate: number;
  level: number;
  pendingCommission: number;
  downlineCount: number;
}

export interface CommissionRecord {
  id: string;
  agentId: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  description?: string;
}

export interface DownlineUser {
  id: string;
  username: string;
  email?: string;
  totalDeposit: number;
  createdAt: string;
}

export interface AgentTreeNode {
  agentId: string;
  userId: string;
  username: string;
  level: number;
  commissionRate: number;
  totalCommission: number;
  totalDeposit: number;
  joinedAt: string;
  children: AgentTreeNode[];
}

export interface AgentMyStats {
  betVolume?: number;
  commissionTotal?: number;
  referralCount?: number;
  activeDownlines?: number;
  startDate?: string;
  endDate?: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

/** Thông tin cơ bản của đại lý (tên, level, tỉ lệ hoa hồng, referralCode) */
export const getAgentInfo = (): Promise<AgentInfo> =>
  api.get('/game/agent/info').then(r => r.data?.data ?? r.data);

/**
 * Overview toàn diện: tổng cộng số referral, hoa hồng pending, downlines, v.v.
 * Dùng cùng endpoint /agent/info — backend trả đủ fields.
 */
export const getAgentOverview = (): Promise<AgentOverview> =>
  api.get('/game/agent/info').then(r => r.data?.data ?? r.data);

/** Danh sách giới thiệu trực tiếp (paged) */
export const getReferrals = (params?: Record<string, unknown>) =>
  api.get('/game/agent/referrals', { params }).then(r => r.data);

/**
 * Danh sách tuyến dưới dạng phẳng (paged)
 * Backend: GET /game/agent/downlines
 */
export const getDownlines = (params?: Record<string, unknown>) =>
  api.get('/game/agent/downlines', { params }).then(r => r.data);

/**
 * Cây tuyến dưới đệ quy (depth ≤ 3)
 * Backend: GET /game/agent/tree
 */
export const getAgentTree = (): Promise<{ agentId: string; tree: AgentTreeNode[] }> =>
  api.get('/game/agent/tree').then(r => r.data?.data ?? r.data);

/**
 * Lịch sử hoa hồng (paged)
 * Backend: GET /game/agent/commissions
 */
export const getCommissions = (params?: Record<string, unknown>) =>
  api.get('/game/agent/commissions', { params }).then(r => r.data);

/**
 * Số liệu cá nhân theo khoảng ngày (validBet, commissionTotal, v.v.)
 * Backend: GET /game/agent/info?startDate=...&endDate=...
 */
export const getMyStats = (params?: { startDate?: string; endDate?: string }): Promise<AgentMyStats> =>
  api.get('/game/agent/info', { params }).then(r => r.data?.data ?? r.data);

/**
 * Nhận hoa hồng pending — POST /game/agent/claim-commission
 */
export const claimCommission = (): Promise<{ claimed: boolean; amount: number }> =>
  api.post('/game/agent/claim-commission').then(r => r.data?.data ?? r.data);

/** Đăng ký làm đại lý */
export const registerAgent = (referralCode?: string) =>
  api.post('/game/agent/register', { referralCode }).then(r => r.data);

/** Kiểm tra trạng thái đại lý */
export const checkAgent = (): Promise<{ isAgent: boolean; agent?: AgentInfo }> =>
  api.get('/game/agent/check').then(r => r.data?.data ?? r.data);
