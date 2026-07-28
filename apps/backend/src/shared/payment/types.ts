export interface DepositOrder {
  id: string;
  userId: string;
  amount: number;
  currency: string;
}

export interface PaymentInstructions {
  type: 'bank_transfer' | 'crypto' | 'redirect' | 'qr_code';
  title: string;
  fields: { label: string; value: string; copyable?: boolean }[];
  qrDataUrl: string | null;
  redirectUrl: string | null;
  expiresAt: string | null;
}

export interface VerifyResult {
  success: boolean;
  amount: number;
  txId: string;
  orderId: string | null;
}

export interface WithdrawResult {
  success: boolean;
  error?: string;
}

export interface StatusResult {
  status: 'pending' | 'completed' | 'failed' | 'unknown';
  amount?: number;
  txId: string;
  note?: string;
}
