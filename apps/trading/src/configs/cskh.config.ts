// @ts-nocheck
// apps/trading/src/configs/cskh.config.ts
import type { CskhConfig } from '@lkvip/ui';

export const tradeCskhConfig: CskhConfig = {
  projectName:  'KJC Trade',
  projectKey:   'trade',
  logoUrl:      '/assets/img/logo.png',
  primaryColor: '#D97706',
  slogan:       'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Trade',
  chatButtons: [
    { id: 'consult',  label: 'Tư Vấn Trade',    path: '/cskh/consult',            isExternal: false },
    { id: 'transfer', label: 'Chuyển Điểm',     path: '/cskh/transfer',           isExternal: false },
    { id: 'forgot-pw',label: 'Quên Mật Khẩu',   path: '/cskh/forgot-password',    isExternal: false },
    { id: 'kyc',      label: 'Hỗ Trợ KYC',      path: '/cskh/kyc',                isExternal: false },
    { id: 'withdraw', label: 'Khiếu Nại Rút',   path: '/cskh/withdraw-dispute',   isExternal: false },
    { id: 'freeze',   label: 'Mở Đóng Băng',    path: '/cskh/freeze',             isExternal: false },
  ],
  experienceButtons: [
    { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
    { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
    { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
  ],
  showCodeSection:  true,
  codePlaceholder:  'Nhập code giao dịch',
  codeSubmitLabel:  'Nhận quà',
  footerText:       'LIÊN MINH QUỐC TẾ KJC Trade 2025-2026',
};
