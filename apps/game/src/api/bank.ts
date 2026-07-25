// game/src/api/bank.ts — Bank account CRUD
// Bank list is imported statically from @lkvip/constants — zero API call needed.
import api from './httpClient';
import type { VNBank } from '@lkvip/types';

export type { VNBank };
export { VN_BANKS, VN_BANK_MAP, VN_BANKS_TRANSFER } from '@lkvip/constants';

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string | null;
  isDefault: boolean;
  createdAt: string;
}

/** List user's saved bank accounts */
export const getBankAccounts = (): Promise<BankAccount[]> =>
  api.get('/game/bank-accounts').then(r => r.data?.data || []);

/** Add a new bank account */
export const addBankAccount = (data: {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
}): Promise<BankAccount> =>
  api.post('/game/bank-accounts', data).then(r => r.data?.data);

/** Set a bank account as default */
export const setDefaultBankAccount = (id: string): Promise<BankAccount> =>
  api.put(`/game/bank-accounts/${id}/default`, {}).then(r => r.data?.data);

/** Delete a bank account */
export const deleteBankAccount = (id: string): Promise<void> =>
  api.delete(`/game/bank-accounts/${id}`).then(() => undefined);
