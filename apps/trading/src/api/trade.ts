import api from './client';
import type {
  ApiEnvelope,
  TradePair,
  TradeOrder,
  CreateOrderPayload,
  WalletSummary,
  WalletTx,
  WithdrawPayload,
  DepositPayload,
  DepositRecord,
  InvestmentPackage,
  MyInvestment,
  ReferralSummary,
  ReferralMember,
  ReferralCommission,
  TradeNotification,
  PortfolioApiData,
  KycRecord,
  KycSubmitPayload,
  TradeUserProfile,
  YuebaoProduct,
  YuebaoInvestment,
  MiningMachine,
  MiningInvestment,
  PrizeConfig,
  PrizeRecord,
  ShopItem,
  ShopOrder,
  WatchlistItem,
  SavingsVaultProduct,
  SavingsVaultInvestment,
  NewsItem,
} from '@/types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (data: { email: string; password: string }) =>
  api.post<ApiEnvelope<{ access_token: string; refresh_token: string; user: TradeUserProfile }>>(
    '/trade/auth/login', data
  ).then((r) => r.data);

export const register = (data: {
  email:        string;
  password:     string;
  fullName?:    string;
  phone?:       string;
  referralCode?: string;
}) =>
  api.post<ApiEnvelope<{ access_token: string; refresh_token: string; user: TradeUserProfile }>>(
    '/trade/auth/register', data
  ).then((r) => r.data);

export const getMe = () =>
  api.get<ApiEnvelope<TradeUserProfile>>('/trade/auth/me').then((r) => r.data);

export const refreshToken = (refresh_token: string) =>
  api.post<ApiEnvelope<{ access_token: string; refresh_token: string }>>(
    '/trade/auth/refresh', { refresh_token }
  ).then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post<ApiEnvelope<null>>('/trade/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (data: { token: string; password: string }) =>
  api.post<ApiEnvelope<null>>('/trade/auth/reset-password', data).then((r) => r.data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.put<ApiEnvelope<null>>('/trade/auth/password', data).then((r) => r.data);

// ── Market / Pairs ────────────────────────────────────────────────────────────
export const getPairs = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<TradePair[]>>('/trade/pairs', { params }).then((r) => r.data);

export const getPairBySymbol = (symbol: string) =>
  api.get<ApiEnvelope<TradePair>>(`/trade/pairs/${symbol}`).then((r) => r.data);

// ── Orders ────────────────────────────────────────────────────────────────────
export const getOrders = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<TradeOrder[]>>('/trade/orders', { params }).then((r) => r.data);

export const getOrder = (id: string) =>
  api.get<ApiEnvelope<TradeOrder>>(`/trade/orders/${id}`).then((r) => r.data);

export const createOrder = (data: CreateOrderPayload) =>
  api.post<ApiEnvelope<TradeOrder>>('/trade/orders', data).then((r) => r.data);

export const cancelOrder = (id: string | number) =>
  api.delete<ApiEnvelope<void>>(`/trade/orders/${id}`).then((r) => r.data);

// ── Wallet ────────────────────────────────────────────────────────────────────
export const getWallet = () =>
  api.get<ApiEnvelope<WalletSummary>>('/trade/wallet').then((r) => r.data);

export const getWalletHistory = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<WalletTx[]>>('/trade/wallet/history', { params }).then((r) => r.data);

export const createWithdrawal = (data: WithdrawPayload) =>
  api.post<ApiEnvelope<void>>('/trade/wallet/withdraw', data).then((r) => r.data);

// ── Deposit ───────────────────────────────────────────────────────────────────
export const getDeposits = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<DepositRecord[]>>('/trade/deposit', { params }).then((r) => r.data);

export const createDeposit = (data: DepositPayload) =>
  api.post<ApiEnvelope<void>>('/trade/deposit', data).then((r) => r.data);

// ── Investment packages ───────────────────────────────────────────────────────
export const getInvestmentPackages = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<InvestmentPackage[]>>('/trade/investment/packages', { params }).then((r) => r.data);

export const getInvestmentPackage = (id: string) =>
  api.get<ApiEnvelope<InvestmentPackage>>(`/trade/investment/packages/${id}`).then((r) => r.data);

// ── Investment (user) ─────────────────────────────────────────────────────────
export const getMyInvestments = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<MyInvestment[]>>('/trade/investment/my', { params }).then((r) => r.data);

export const buyInvestment = (data: { packageId: string; amount: number }) =>
  api.post<ApiEnvelope<MyInvestment>>('/trade/investment/buy', data).then((r) => r.data);

// ── Referral ──────────────────────────────────────────────────────────────────
export const getReferralCode = () =>
  api.get<ApiEnvelope<{ code: string; referralUrl: string }>>('/trade/referral/code').then((r) => r.data);

export const getReferralTree = () =>
  api.get<ApiEnvelope<{ f1: ReferralMember[]; f2: ReferralMember[] }>>('/trade/referral/tree').then((r) => r.data);

export const getReferralCommissions = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<ReferralCommission[]>>('/trade/referral/commissions', { params }).then((r) => r.data);

export const getReferralSummary = () =>
  api.get<ApiEnvelope<ReferralSummary>>('/trade/referral/summary').then((r) => r.data);

// ── KYC ───────────────────────────────────────────────────────────────────────
export const getKycStatus = () =>
  api.get<ApiEnvelope<KycRecord>>('/trade/kyc').then((r) => r.data);

export const submitKyc = (data: KycSubmitPayload) =>
  api.post<ApiEnvelope<void>>('/trade/kyc', data).then((r) => r.data);

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = () =>
  api.get<ApiEnvelope<TradeNotification[]>>('/trade/notifications').then((r) => r.data);

export const getUnreadCount = () =>
  api.get<ApiEnvelope<{ count: number }>>('/trade/notifications/unread-count').then((r) => r.data);

export const markNotifRead = (id: string | number) =>
  api.put<ApiEnvelope<void>>(`/trade/notifications/${id}/read`).then((r) => r.data);

// ── Positions ─────────────────────────────────────────────────────────────────
export const getPositions = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<PortfolioApiData['positions']>>('/trade/positions', { params }).then((r) => r.data);

export const getPositionById = (id: string | number) =>
  api.get<ApiEnvelope<PortfolioApiData['positions'][number]>>(`/trade/positions/${id}`).then((r) => r.data);

export const closePosition = (id: string | number, data?: Record<string, unknown>) =>
  api.post<ApiEnvelope<void>>(`/trade/positions/${id}/close`, data).then((r) => r.data);

// ── Portfolio ─────────────────────────────────────────────────────────────────
export const getPortfolio = () =>
  api.get<ApiEnvelope<PortfolioApiData>>('/trade/portfolio').then((r) => r.data);

// ── User / Profile ────────────────────────────────────────────────────────────
/** Alias for getMe — kept for backward compat */
export const getUserProfile = () =>
  api.get<ApiEnvelope<TradeUserProfile>>('/trade/auth/me').then((r) => r.data);

export const updateProfile = (data: { fullName?: string; phone?: string }) =>
  api.patch<ApiEnvelope<TradeUserProfile>>('/trade/profile', data).then((r) => r.data);

export const uploadAvatar = (file: File) => {
  const form = new FormData();
  form.append('avatar', file);
  return api.patch<ApiEnvelope<TradeUserProfile>>('/trade/profile/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

// ── Bank Accounts ─────────────────────────────────────────────────────────────
export interface BankAccountPayload {
  bank_code:      string;
  bank_name:      string;
  account_number: string;
  account_holder: string;
  branch?:        string;
}

export interface BankAccountItem {
  id:            string;
  bankName:      string;
  accountNumber: string;
  accountName:   string;
  isDefault:     boolean;
}

export const getBankAccounts = () =>
  api.get<ApiEnvelope<BankAccountItem[]>>('/trade/bank-accounts').then((r) => r.data?.data ?? []);

export const addBankAccount = (data: BankAccountPayload) =>
  api.post<ApiEnvelope<BankAccountItem>>('/trade/bank-accounts', data).then((r) => r.data?.data);

export const setDefaultBankAccount = (id: string) =>
  api.put<ApiEnvelope<BankAccountItem>>(`/trade/bank-accounts/${id}/default`, {}).then((r) => r.data?.data);

export const deleteBankAccount = (id: string): Promise<void> =>
  api.delete(`/trade/bank-accounts/${id}`).then(() => undefined);

// ── Yuebao / Money Market ─────────────────────────────────────────────────────
export const getYuebaoProducts = () =>
  api.get<ApiEnvelope<YuebaoProduct[]>>('/trade/yuebao/products').then((r) => r.data);

export const getMyYuebaoInvestments = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<YuebaoInvestment[]>>('/trade/yuebao/my', { params }).then((r) => r.data);

export const investYuebao = (data: { productId: string; amount: number }) =>
  api.post<ApiEnvelope<YuebaoInvestment>>('/trade/yuebao/invest', data).then((r) => r.data);

// ── Mining Machines ───────────────────────────────────────────────────────────
export const getMiningMachines = () =>
  api.get<ApiEnvelope<MiningMachine[]>>('/trade/mining/machines').then((r) => r.data);

export const getMiningMachine = (id: string) =>
  api.get<ApiEnvelope<MiningMachine>>(`/trade/mining/machines/${id}`).then((r) => r.data);

export const getMyMiningInvestments = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<MiningInvestment[]>>('/trade/mining/my', { params }).then((r) => r.data);

export const buyMiningMachine = (data: { machineId: string; quantity?: number }) =>
  api.post<ApiEnvelope<MiningInvestment>>('/trade/mining/invest', data).then((r) => r.data);

// ── Prize Draw ────────────────────────────────────────────────────────────────
export const getPrizeConfigs = () =>
  api.get<ApiEnvelope<PrizeConfig[]>>('/trade/prize/configs').then((r) => r.data);

export const getRecentWinners = () =>
  api.get<ApiEnvelope<PrizeRecord[]>>('/trade/prize/recent').then((r) => r.data);

export const getMyPrizeRecords = () =>
  api.get<ApiEnvelope<PrizeRecord[]>>('/trade/prize/records').then((r) => r.data);

export const drawPrize = (data: { prizeId: string }) =>
  api.post<ApiEnvelope<PrizeRecord>>('/trade/prize/draw', data).then((r) => r.data);

// ── Shop (Points Exchange) ────────────────────────────────────────────────────
export const getShopItems = () =>
  api.get<ApiEnvelope<ShopItem[]>>('/trade/shop').then((r) => r.data);

export const getShopItem = (id: string) =>
  api.get<ApiEnvelope<ShopItem>>(`/trade/shop/${id}`).then((r) => r.data);

export const getMyShopOrders = () =>
  api.get<ApiEnvelope<ShopOrder[]>>('/trade/shop/orders').then((r) => r.data);

export const exchangeShopItem = (data: { itemId: string; quantity?: number }) =>
  api.post<ApiEnvelope<ShopOrder>>('/trade/shop/exchange', data).then((r) => r.data);

// ── Watchlists ────────────────────────────────────────────────────────────────
export const getWatchlists = () =>
  api.get<ApiEnvelope<WatchlistItem[]>>('/trade/watchlists').then((r) => r.data);

export const createWatchlist = (data: { name: string }) =>
  api.post<ApiEnvelope<WatchlistItem>>('/trade/watchlists', data).then((r) => r.data);

export const deleteWatchlist = (id: string): Promise<void> =>
  api.delete(`/trade/watchlists/${id}`).then(() => undefined);

export const addToWatchlist = (watchlistId: string, symbolId: string) =>
  api.post<ApiEnvelope<void>>(`/trade/watchlists/${watchlistId}/items`, { symbolId }).then((r) => r.data);

export const removeFromWatchlist = (watchlistId: string, symbolId: string): Promise<void> =>
  api.delete(`/trade/watchlists/${watchlistId}/items/${symbolId}`).then(() => undefined);

// ── Sign-in Reward ────────────────────────────────────────────────────────────
export const claimSigninReward = () =>
  api.post<ApiEnvelope<{ rewarded: boolean; points: number }>>('/trade/reward/signin').then((r) => r.data);

export const getSigninRewardStatus = () =>
  api.get<ApiEnvelope<{ claimed: boolean; streak: number; points: number }>>('/trade/reward/signin/status').then((r) => r.data);

// ── SavingsVault (Flexible Savings) ──────────────────────────────────────────
export const getSavingsVaultProducts = () =>
  api.get<ApiEnvelope<SavingsVaultProduct[]>>('/trade/savings/products').then((r) => r.data);

export const getMySavingsVaultInvestments = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<SavingsVaultInvestment[]>>('/trade/savings/my', { params }).then((r) => r.data);

export const investSavingsVault = (data: { productId: string; amount: number }) =>
  api.post<ApiEnvelope<SavingsVaultInvestment>>('/trade/savings/invest', data).then((r) => r.data);

// ── News (content) ────────────────────────────────────────────────────────────
export const getNewsList = (params?: Record<string, unknown>) =>
  api.get<ApiEnvelope<NewsItem[]>>('/trade/news', { params }).then((r) => r.data);
