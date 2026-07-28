// @ts-nocheck
// apps/sports/src/configs/cskh.config.ts
import type { CskhConfig } from '@lkvip/ui';

export const sportsCskhConfig: CskhConfig = {
  projectName:  'KJC Sports',
  projectKey:   'sports',
  logoUrl:      '/assets/img/logo.png',
  primaryColor: '#16A34A',
  slogan:       'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Sports',
  chatButtons: [
    { id: 'consult',     label: 'Tư Vấn Sports',    path: '/cskh/consult',          isExternal: false },
    { id: 'transfer',    label: 'Chuyển Điểm',      path: '/cskh/transfer',         isExternal: false },
    { id: 'forgot-pw',   label: 'Quên Mật Khẩu',    path: '/cskh/forgot-password',  isExternal: false },
    { id: 'forgot-acc',  label: 'Quên Tài Khoản',   path: '/cskh/forgot-account',   isExternal: false },
    { id: 'bet-dispute', label: 'Khiếu Nại Cược',   path: '/cskh/bet-dispute',      isExternal: false },
    { id: 'freeze',      label: 'Mở Đóng Băng',     path: '/cskh/freeze',           isExternal: false },
  ],
  experienceButtons: [
    { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
    { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
    { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
  ],
  showCodeSection:  true,
  codePlaceholder:  'Nhập code thể thao',
  codeSubmitLabel:  'Nhận quà',
  footerText:       'LIÊN MINH QUỐC TẾ KJC Sports 2025-2026',
};
