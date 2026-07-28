// @ts-nocheck
// apps/game/src/configs/cskh.config.ts
// Cấu hình CSKH mặc định cho Game project.
// Admin có thể override qua API GET /admin/cskh/game.
import type { CskhConfig } from '@lkvip/ui';

export const gameCskhConfig: CskhConfig = {
  projectName:  'KJC Game',
  projectKey:   'game',
  logoUrl:      '/assets/img/logo.png',
  primaryColor: '#26A17B',
  slogan:       'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Game',
  chatButtons: [
    { id: 'consult',      label: 'Tư Vấn Game',        path: '/cskh/consult',          isExternal: false },
    { id: 'transfer',     label: 'Chuyển Điểm',        path: '/cskh/transfer',         isExternal: false },
    { id: 'forgot-pw',    label: 'Quên Mật Khẩu',      path: '/cskh/forgot-password',  isExternal: false },
    { id: 'forgot-acc',   label: 'Quên Tài Khoản',     path: '/cskh/forgot-account',   isExternal: false },
    { id: 'freeze',       label: 'Mở Đóng Băng',       path: '/cskh/freeze',           isExternal: false },
    { id: 'share-review', label: 'Xét Duyệt Chia Sẻ',  path: '/cskh/share-review',     isExternal: false },
  ],
  experienceButtons: [
    { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
    { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
    { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
  ],
  showCodeSection:  true,
  codePlaceholder:  'Nhập code miễn phí',
  codeSubmitLabel:  'Nhận quà',
  footerText:       'LIÊN MINH QUỐC TẾ KJC Game 2025-2026',
};
