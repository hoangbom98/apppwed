/**
 * layout/KhungUngDung.tsx — Game AppShell
 * ----------------------------------------
 * Uses H5BottomNav from shared-ui. NavItem requires { label, icon, path }.
 */
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { H5BottomNav } from '@ui';
import Header from './DauTrang';
import { useAppConfig, applyColorConfig } from '@ui';
import {
  HomeOutlined, GiftOutlined, WalletOutlined, DownloadOutlined, UserOutlined
} from '@ant-design/icons';

const NAV_ITEMS = [
  { path: '/',           label: 'Trang chủ', icon: <HomeOutlined     style={{ fontSize: 18 }} /> },
  { path: '/promotions', label: 'Khuyến mãi', icon: <GiftOutlined    style={{ fontSize: 18 }} /> },
  { path: '/deposit',    label: 'Nạp tiền',   icon: <WalletOutlined  style={{ fontSize: 18 }} /> },
  { path: '/download',   label: 'Tải App',    icon: <DownloadOutlined style={{ fontSize: 18 }} /> },
  { path: '/profile',    label: 'Tôi',        icon: <UserOutlined    style={{ fontSize: 18 }} /> },
];

const AppShell: React.FC = () => {
  const { data: colors } = useAppConfig('colors');
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => { applyColorConfig(colors as any); }, [colors]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-dark max-w-md mx-auto relative">
      <Header />

      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      <H5BottomNav
        items={NAV_ITEMS}
        active={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};

export default AppShell;
