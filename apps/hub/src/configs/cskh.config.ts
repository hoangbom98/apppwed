// @ts-nocheck
// apps/hub/src/configs/cskh.config.ts
import type { CskhConfig } from '@lkvip/ui';

export const hubCskhConfig: CskhConfig = {
  projectName:  'KJC Hub',
  projectKey:   'hub',
  logoUrl:      '/assets/img/logo.png',
  primaryColor: '#2563EB',
  slogan:       'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Hub',
  chatButtons: [
    { id: 'consult',    label: 'Tư Vấn Hub',      path: '/cskh/consult',          isExternal: false },
    { id: 'transfer',   label: 'Chuyển Điểm',     path: '/cskh/transfer',         isExternal: false },
    { id: 'forgot-pw',  label: 'Quên Mật Khẩu',   path: '/cskh/forgot-password',  isExternal: false },
    { id: 'forgot-acc', label: 'Quên Tài Khoản',  path: '/cskh/forgot-account',   isExternal: false },
    { id: 'report',     label: 'Báo Cáo Lỗi',     path: '/cskh/report',           isExternal: false },
    { id: 'feedback',   label: 'Góp Ý',           path: '/cskh/feedback',         isExternal: false },
  ],
  experienceButtons: [
    { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
    { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
    { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
  ],
  showCodeSection:  true,
  codePlaceholder:  'Nhập code khuyến mãi',
  codeSubmitLabel:  'Nhận quà',
  footerText:       'LIÊN MINH QUỐC TẾ KJC Hub 2025-2026',
};
