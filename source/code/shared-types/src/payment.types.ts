/**
 * @lkvip/types — src/payment.types.ts
 *
 * Payment gateway, deposit, withdrawal, wallet and transaction types.
 * Covers LKvip, MoMo, ZaloPay, VNPay, VietQR, bank transfer, crypto (USDT).
 */

// ── Gateway ──────────────────────────────────────────────────────────────────

export type PaymentGatewayCode =
  | 'lkvip'
  | 'usdt'
  | 'momo'
  | 'zalopay'
  | 'vnpay'
  | 'okpay'
  | 'vietqr'
  | 'bank_transfer';

export type PaymentGatewayType = 'bank' | 'crypto' | 'ewallet' | 'card';
export type PaymentGateway     = PaymentGatewayCode;

export interface IPaymentGateway {
  id:        string | number;
  code:      PaymentGatewayCode;
  name:      string;
  type:      PaymentGatewayType;
  status:    'active' | 'inactive' | 'maintenance';
  iconUrl?:  string | null;
  logo_url?: string | null;
  is_active?: boolean;
  fees?:  { percentage: number; fixed: number; min: number; max: number; } | null;
  limits?: { min: number; max: number; daily: number; } | null;
  min_amount?: number;
  max_amount?: number;
  fee_pct?:    number;
  sortOrder:   number;
}

// ── Deposit ──────────────────────────────────────────────────────────────────

export interface IDepositRequest {
  gatewayCode?: PaymentGatewayCode;
  gateway?:     PaymentGatewayCode;
  amount:       number;
  currency?:    string;
  note?:        string;
}

export interface IDepositResponse {
  orderId?:      string;
  order_id?:     string;
  redirectUrl?:  string | null;
  pay_url?:      string | null;
  qrCode?:       string | null;
  qr_code_url?:  string | null;
  expiresAt?:    string | null;
  expires_at?:   string | null;
}

// ── Withdrawal ──────────────────────────────────────────────────────────────

export interface IWithdrawRequest {
  gatewayCode?: PaymentGatewayCode;
  gateway?:     PaymentGatewayCode;
  amount:       number;
  currency?:    string;
  address?:     string;
  bankInfo?: {
    bankCode:    string;
    accountNo:   string;
    accountName: string;
    branch?:     string;
  };
  note?: string;
}

// ── Transaction ──────────────────────────────────────────────────────────────

export type TransactionType =
  | 'deposit'
  | 'withdraw'
  | 'transfer'
  | 'bonus'
  | 'commission'
  | 'payment'
  | 'refund'
  | 'bet'
  | 'win'
  | 'adjustment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export type CurrencyCode = 'VND' | 'USD' | 'USDT' | 'COIN' | 'DIAMOND';

export interface ITransaction {
  id:            string;
  userId?:       string | number;
  user_id?:      number;
  type:          TransactionType;
  amount:        number;
  fee?:          number;
  currency:      CurrencyCode | string;
  status:        TransactionStatus;
  referenceId?:  string | null;
  ref_id?:       string | null;
  description?:  string | null;
  gateway?:      PaymentGatewayCode | null;
  createdAt?:    string | Date;
  created_at?:   string | Date;
  updatedAt?:    string | Date;
  updated_at?:   string | Date;
}

// ── Wallet ───────────────────────────────────────────────────────────────────

export interface IWallet {
  userId:       string | number;
  balance:      number;
  coins:        number;
  diamonds:     number;
  currency:     CurrencyCode;
  transactions: ITransaction[];
}

export interface IWalletBalance {
  balance:   number;
  frozen?:   number;
  locked?:   number;
  coins?:    number;
  diamonds?: number;
  currency:  CurrencyCode | string;
}

// ── Bank info (for Vietnamese bank transfer) ─────────────────────────────────

export interface IBankInfo {
  bankCode:    string;
  bankName:    string;
  accountNo:   string;
  accountName: string;
  branch?:     string | null;
  qrCode?:     string | null;
}

// ── LKvip internal gateway ───────────────────────────────────────────────────

export interface ILkvipDepositRequest {
  amount:      number;
  gateway:     'momo' | 'zalopay' | 'vnpay' | 'vietqr' | 'bank_transfer';
  note?:       string;
}

export interface ILkvipWithdrawRequest {
  amount:      number;
  bankCode:    string;
  accountNo:   string;
  accountName: string;
  note?:       string;
}

export type LkvipTransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'aml_hold';

export interface ILkvipTransaction {
  id:         string;
  userId:     number;
  type:       'deposit' | 'withdraw';
  amount:     number;
  fee:        number;
  net:        number;
  gateway:    string;
  status:     LkvipTransactionStatus;
  reference?: string | null;
  note?:      string | null;
  processedAt?: string | Date | null;
  createdAt:  string | Date;
}

// ── MoMo IPN (webhook payload) ───────────────────────────────────────────────

export interface IMoMoIpnPayload {
  partnerCode:   string;
  orderId:       string;
  requestId:     string;
  amount:        number;
  resultCode:    number;
  message:       string;
  transId:       string;
  signature:     string;
  payType?:      string;
  responseTime?: number;
  extraData?:    string;
}

// ── ZaloPay callback ─────────────────────────────────────────────────────────

export interface IZaloPayCallback {
  app_id:         number;
  app_trans_id:   string;
  app_user:       string;
  app_time:       number;
  embed_data:     string;
  item:           string;
  zp_trans_id:    string;
  server_time:    number;
  channel:        number;
  merchant_user_id: string;
  user_fee_amount:  number;
  discount_amount:  number;
  mac:            string;
}

// ── VNPay return data ────────────────────────────────────────────────────────

export interface IVNPayReturnData {
  vnp_Amount:        string;
  vnp_BankCode:      string;
  vnp_BankTranNo?:   string;
  vnp_CardType?:     string;
  vnp_OrderInfo:     string;
  vnp_PayDate:       string;
  vnp_ResponseCode:  string;
  vnp_TmnCode:       string;
  vnp_TransactionNo: string;
  vnp_TxnRef:        string;
  vnp_SecureHash:    string;
}
