import api from './httpClient';

export interface BankAccount {
  id: number;
  user_id: number;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
  created_at: string;
}

export const getBankAccounts = (): Promise<BankAccount[]> =>
  api.get('/game/bank-accounts').then(r => r.data?.data || []);

export const addBankAccount = (data: {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
}): Promise<BankAccount> =>
  api.post('/game/bank-accounts', data).then(r => r.data?.data);

export const deleteBankAccount = (id: number): Promise<void> =>
  api.delete(`/game/bank-accounts/${id}`).then(() => undefined);

export const setDefaultBankAccount = (id: number): Promise<void> =>
  api.put(`/game/bank-accounts/${id}/default`).then(() => undefined);
