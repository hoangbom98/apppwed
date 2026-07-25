import api from '@/api/httpClient';

/** Chuyển tiền từ ví chính ↔ ví game (nội bộ tài khoản)
 *  direction: 'in' = nạp vào ví game, 'out' = rút ra ví chính */
export const transferFunds = (body: {
  direction: 'in' | 'out';
  amount: number;
  tradingPassword?: string;
}) => api.post('/game/wallet/transfer', body).then(r => r.data);

/** Chuyển tiền sang tài khoản người dùng khác (P2P) */
export const transferToUser = (body: {
  toUsername: string;
  amount: number;
  tradingPassword: string;
}) => api.post('/game/wallet/transfer-user', body).then(r => r.data);

/** Lịch sử giao dịch loại transfer */
export const getTransferHistory = (params?: Record<string, unknown>) =>
  api.get('/game/wallet/history', { params: { ...params, type: 'transfer' } }).then(r => r.data);

/** Số dư ví chính */
export const getWalletBalance = () => api.get('/game/wallet/balance').then(r => r.data);
