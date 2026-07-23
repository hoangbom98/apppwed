/**
 * layout/DauTrang.tsx — Game Header (re-exported as "Header")
 * -----------------------------------------------------------
 * Thin wrapper that uses H5Header from shared-ui, adding game-specific
 * rightSlot: wallet balance display + dark mode toggle.
 */
import React from 'react';
import { Link, useNavigate }  from 'react-router-dom';
import { useQuery }           from '@tanstack/react-query';
import { Sun, Moon, ChevronRight } from 'lucide-react';
import { H5Header }           from '@ui';
import { useUnreadCount }     from '@ui';
import { useAuthStore }       from '@/store/authStore';
import { useWalletStore }     from '@/store/walletStore';
import { useUIStore }         from '@/store/uiStore';
import { useWallet }          from '@/hooks/useWallet';
import { formatVND }          from '@/utils/dinhDang';
import { HOME_IMGS }          from '@/utils/tainguyen';

const Header: React.FC = () => {
  const { user }              = useAuthStore();
  const { balance }           = useWalletStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate              = useNavigate();
  const unreadCount           = useUnreadCount();

  // Keep wallet balance fresh
  useWallet();

  // Right slot — wallet link + dark toggle (shown only when logged in)
  const rightSlot = user ? (
    <>
      <Link
        to="/deposit"
        className="flex items-center gap-1 bg-accent/10 border border-accent/40 rounded-full px-2.5 py-1 text-xs font-bold text-gray-900 dark:text-accent"
      >
        <img src={HOME_IMGS.wallet} alt="wallet" className="w-4 h-4 object-contain" />
        {formatVND(balance)}
        <ChevronRight className="w-3 h-3 text-accent" />
      </Link>
      <button
        onClick={toggleDarkMode}
        className="p-1.5 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-colors"
        aria-label={darkMode ? 'Light mode' : 'Dark mode'}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </>
  ) : (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('/login')}
        className="px-3 py-1 border border-primary text-primary dark:border-accent dark:text-accent text-xs font-semibold rounded-lg hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-dark transition-colors"
      >
        Đăng nhập
      </button>
    </div>
  );

  return (
    <H5Header
      unreadCount={unreadCount}
      rightSlot={rightSlot}
      onNotif={() => navigate('/notifications')}
      onSearch={() => navigate('/search')}
    />
  );
};

export default Header;
