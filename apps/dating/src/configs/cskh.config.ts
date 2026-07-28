// @ts-nocheck
// apps/dating/src/configs/cskh.config.ts
import type { CskhConfig } from '@lkvip/ui';

export const datingCskhConfig: CskhConfig = {
  projectName:  'KJC Dating',
  projectKey:   'dating',
  logoUrl:      '/assets/img/logo.png',
  primaryColor: '#EC4899',
  slogan:       'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Dating',
  chatButtons: [
    { id: 'consult',    label: 'Tư Vấn Dating',      path: '/cskh/consult',          isExternal: false },
    { id: 'transfer',   label: 'Chuyển Điểm',        path: '/cskh/transfer',         isExternal: false },
    { id: 'forgot-pw',  label: 'Quên Mật Khẩu',      path: '/cskh/forgot-password',  isExternal: false },
    { id: 'forgot-acc', label: 'Quên Tài Khoản',     path: '/cskh/forgot-account',   isExternal: false },
    { id: 'unban',      label: 'Mở Khóa TK',         path: '/cskh/unban',            isExternal: false },
    { id: 'report',     label: 'Báo Cáo Vi Phạm',    path: '/cskh/report',           isExternal: false },
  ],
  experienceButtons: [
    { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
    { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
    { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
  ],
  showCodeSection:  true,
  codePlaceholder:  'Nhập code hội viên',
  codeSubmitLabel:  'Nhận quà',
  footerText:       'LIÊN MINH QUỐC TẾ KJC Dating 2025-2026',
};
