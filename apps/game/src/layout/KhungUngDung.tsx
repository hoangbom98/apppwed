/**
 * layout/KhungUngDung.tsx — Game AppShell
 * ----------------------------------------
 * Uses H5Layout from shared-ui. Header and BottomNav are injected via
 * the headerProps / bottomNavItems mechanism (H5Layout calls H5Header
 * internally). The game-specific DauTrang and ThanhDieuHuong components
 * are thin wrappers that use the shared versions; the slot-based approach
 * means H5Layout still manages structure.
 *
 * NOTE: We render DauTrang manually instead of passing headerProps so that
 * game-specific logic (wallet, dark-mode toggle) in DauTrang is preserved.
 * H5Layout headerProps is left empty to skip the built-in H5Header;
 * instead we render Header above the main content ourselves.
 */
import React from 'react';
import { Outlet }  from 'react-router-dom';
import { H5BottomNav } from '@ui';
import Header      from './DauTrang';
import { TABBAR_ICONS } from '@/utils/tainguyen';
import { useAppConfig, applyColorConfig } from '@ui';
import { useEffect } from 'react';

const BOTTOM_NAV_ITEMS = [
  { to: '/',           activeSrc: TABBAR_ICONS.home.select,        inactiveSrc: TABBAR_ICONS.home.nor,        label: 'Trang chủ' },
  { to: '/promotions', activeSrc: TABBAR_ICONS.promotions.select,  inactiveSrc: TABBAR_ICONS.promotions.nor,  label: 'Khuyến mãi' },
  { to: '/deposit',    activeSrc: TABBAR_ICONS.deposit.select,     inactiveSrc: TABBAR_ICONS.deposit.nor,     label: 'Nạp tiền' },
  { to: '/download',   activeSrc: TABBAR_ICONS.download.select,    inactiveSrc: TABBAR_ICONS.download.nor,    label: 'Tải App' },
  { to: '/profile',    activeSrc: TABBAR_ICONS.profile.select,     inactiveSrc: TABBAR_ICONS.profile.nor,     label: 'Tôi' },
];

const AppShell: React.FC = () => {
  const { data: colors } = useAppConfig('colors');
  useEffect(() => { applyColorConfig(colors); }, [colors]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark max-w-md mx-auto relative">
      <Header />

      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      <H5BottomNav items={BOTTOM_NAV_ITEMS} />
    </div>
  );
};

export default AppShell;
