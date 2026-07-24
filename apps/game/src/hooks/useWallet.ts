import { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

export const useWallet = () => {
  const { balance, isLoading, fetchBalance, setBalance } = useWalletStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) fetchBalance();
  }, [user]);

  return { balance, isLoading, fetchBalance, setBalance };
};
