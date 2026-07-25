import { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

export const useWallet = () => {
  const store = useWalletStore() as any;
  const { balance, isLoading, setBalance, fetchBalance, reset } = store;
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && fetchBalance) fetchBalance();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return { balance, isLoading, fetchBalance, setBalance, reset };
};
