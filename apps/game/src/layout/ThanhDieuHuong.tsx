/**
 * layout/ThanhDieuHuong.tsx — Game Bottom Nav (re-exported as "BottomNav")
 * -------------------------------------------------------------------------
 * Uses H5BottomNav from shared-ui. NavItem shape: { label, icon, path }.
 * "Tải App" tab opens a DownloadModal instead of navigating.
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { H5BottomNav }   from '@ui';
import { DownloadModal } from '@ui/components/DownloadModal';
import {
  HomeOutlined, GiftOutlined, WalletOutlined, DownloadOutlined, UserOutlined
} from '@ant-design/icons';

// Download links
const ANDROID_LINK = (import.meta as any).env?.VITE_DOWNLOAD_GAMEX_APK
  || 'https://tc-gaming.live/downloads/gamex.apk';
const IOS_LINK     = (import.meta as any).env?.VITE_DOWNLOAD_GAMEX_IOS
  || 'itms-services://?action=download-manifest&url=https://tc-gaming.live/ios/gamex.plist';

const BASE_ITEMS = [
  { path: '/',           label: 'Trang chủ', icon: <HomeOutlined     style={{ fontSize: 18 }} /> },
  { path: '/promotions', label: 'Khuyến mãi', icon: <GiftOutlined    style={{ fontSize: 18 }} /> },
  { path: '/deposit',    label: 'Nạp tiền',   icon: <WalletOutlined  style={{ fontSize: 18 }} /> },
  { path: '/__download', label: 'Tải App',    icon: <DownloadOutlined style={{ fontSize: 18 }} /> },
  { path: '/profile',    label: 'Tôi',        icon: <UserOutlined    style={{ fontSize: 18 }} /> },
];

const BottomNav: React.FC = () => {
  const [dlOpen, setDlOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleNavigate = (path: string) => {
    if (path === '/__download') {
      setDlOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <H5BottomNav
        items={BASE_ITEMS}
        active={location.pathname}
        onNavigate={handleNavigate}
      />
      <DownloadModal
        open={dlOpen}
        onClose={() => setDlOpen(false)}
        appName="LKVIP Game"
        appIcon="/logo.svg"
        androidLink={ANDROID_LINK}
        iosLink={IOS_LINK}
        primaryColor="#194C38"
      />
    </>
  );
};

export default BottomNav;
