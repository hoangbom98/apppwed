/**
 * layout/ThanhDieuHuong.tsx — Game Bottom Nav (re-exported as "BottomNav")
 * -------------------------------------------------------------------------
 * "Tải App" tab opens a DownloadModal (OS-aware bottom-sheet) instead of
 * navigating to a separate page — gives a native app-like feel.
 */
import React, { useState } from 'react';
import { H5BottomNav }   from '@ui';
import { DownloadModal } from '@ui/components/DownloadModal';
import { TABBAR_ICONS }  from '@/utils/tainguyen';

// Download links — injected via env or fallback
const ANDROID_LINK = (import.meta as any).env?.VITE_DOWNLOAD_GAMEX_APK
  || 'https://yourdomain.com/downloads/gamex.apk';
const IOS_LINK     = (import.meta as any).env?.VITE_DOWNLOAD_GAMEX_IOS
  || 'itms-services://?action=download-manifest&url=https://yourdomain.com/ios/gamex.plist';

const ITEMS = [
  { to: '/',            activeSrc: TABBAR_ICONS.home.select,       inactiveSrc: TABBAR_ICONS.home.nor,       label: 'Trang chủ' },
  { to: '/promotions',  activeSrc: TABBAR_ICONS.promotions.select,  inactiveSrc: TABBAR_ICONS.promotions.nor, label: 'Khuyến mãi' },
  { to: '/deposit',     activeSrc: TABBAR_ICONS.deposit.select,     inactiveSrc: TABBAR_ICONS.deposit.nor,    label: 'Nạp tiền' },
  {
    // "Tải App" — intercept click, open modal instead of navigating
    to: '/download',
    activeSrc:   TABBAR_ICONS.download.select,
    inactiveSrc: TABBAR_ICONS.download.nor,
    label:       'Tải App',
    onClick:     '__DOWNLOAD_MODAL__' as const,   // special signal
  },
  { to: '/profile',     activeSrc: TABBAR_ICONS.profile.select,     inactiveSrc: TABBAR_ICONS.profile.nor,    label: 'Tôi' },
];

const BottomNav: React.FC = () => {
  const [dlOpen, setDlOpen] = useState(false);

  // Build items, overriding "Tải App" with a modal trigger
  const items = ITEMS.map((item) => {
    if ((item as any).onClick === '__DOWNLOAD_MODAL__') {
      return { ...item, onTabClick: () => setDlOpen(true) };
    }
    return item;
  });

  return (
    <>
      <H5BottomNav items={items} />
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
