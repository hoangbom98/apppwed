// @ts-nocheck
// admin/services/cskhService.ts
// Business logic cho CSKH config management — lưu/đọc qua ContentItem model

const CONTENT_TYPE = 'cskh';

// Cấu hình mặc định cho mỗi project khi chưa có bản ghi DB
const DEFAULTS = {
  game: {
    projectName: 'KJC Game',
    primaryColor: '#26A17B',
    slogan: 'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Game',
    chatButtons: [
      { id: 'consult',        label: 'Tư Vấn Game',           path: '/cskh/consult',         isExternal: false },
      { id: 'transfer',       label: 'Chuyển Điểm',           path: '/cskh/transfer',        isExternal: false },
      { id: 'forgot-pw',      label: 'Quên Mật Khẩu',         path: '/cskh/forgot-password', isExternal: false },
      { id: 'forgot-acc',     label: 'Quên Tài Khoản',        path: '/cskh/forgot-account',  isExternal: false },
      { id: 'freeze',         label: 'Mở Đóng Băng',          path: '/cskh/freeze',          isExternal: false },
      { id: 'share-review',   label: 'Xét Duyệt Chia Sẻ',    path: '/cskh/share-review',    isExternal: false },
    ],
    experienceButtons: [
      { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
      { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
      { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
    ],
    showCodeSection: true,
    footerText: 'LIÊN MINH QUỐC TẾ KJC Game 2025-2026',
  },
  hub: {
    projectName: 'KJC Hub',
    primaryColor: '#2563EB',
    slogan: 'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Hub',
    chatButtons: [
      { id: 'consult',    label: 'Tư Vấn Hub',        path: '/cskh/consult',         isExternal: false },
      { id: 'transfer',   label: 'Chuyển Điểm',       path: '/cskh/transfer',        isExternal: false },
      { id: 'forgot-pw',  label: 'Quên Mật Khẩu',     path: '/cskh/forgot-password', isExternal: false },
      { id: 'forgot-acc', label: 'Quên Tài Khoản',    path: '/cskh/forgot-account',  isExternal: false },
      { id: 'report',     label: 'Báo Cáo Lỗi',       path: '/cskh/report',          isExternal: false },
      { id: 'feedback',   label: 'Góp Ý',             path: '/cskh/feedback',        isExternal: false },
    ],
    experienceButtons: [
      { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
      { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
      { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
    ],
    showCodeSection: true,
    footerText: 'LIÊN MINH QUỐC TẾ KJC Hub 2025-2026',
  },
  dating: {
    projectName: 'KJC Dating',
    primaryColor: '#EC4899',
    slogan: 'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Dating',
    chatButtons: [
      { id: 'consult',    label: 'Tư Vấn Dating',     path: '/cskh/consult',         isExternal: false },
      { id: 'transfer',   label: 'Chuyển Điểm',       path: '/cskh/transfer',        isExternal: false },
      { id: 'forgot-pw',  label: 'Quên Mật Khẩu',     path: '/cskh/forgot-password', isExternal: false },
      { id: 'forgot-acc', label: 'Quên Tài Khoản',    path: '/cskh/forgot-account',  isExternal: false },
      { id: 'unban',      label: 'Mở Khóa Tài Khoản', path: '/cskh/unban',           isExternal: false },
      { id: 'report',     label: 'Báo Cáo Vi Phạm',   path: '/cskh/report',          isExternal: false },
    ],
    experienceButtons: [
      { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
      { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
      { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
    ],
    showCodeSection: true,
    footerText: 'LIÊN MINH QUỐC TẾ KJC Dating 2025-2026',
  },
  sports: {
    projectName: 'KJC Sports',
    primaryColor: '#16A34A',
    slogan: 'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Sports',
    chatButtons: [
      { id: 'consult',    label: 'Tư Vấn Sports',     path: '/cskh/consult',         isExternal: false },
      { id: 'transfer',   label: 'Chuyển Điểm',       path: '/cskh/transfer',        isExternal: false },
      { id: 'forgot-pw',  label: 'Quên Mật Khẩu',     path: '/cskh/forgot-password', isExternal: false },
      { id: 'forgot-acc', label: 'Quên Tài Khoản',    path: '/cskh/forgot-account',  isExternal: false },
      { id: 'bet-dispute',label: 'Khiếu Nại Cược',    path: '/cskh/bet-dispute',     isExternal: false },
      { id: 'freeze',     label: 'Mở Đóng Băng',      path: '/cskh/freeze',          isExternal: false },
    ],
    experienceButtons: [
      { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
      { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
      { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
    ],
    showCodeSection: true,
    footerText: 'LIÊN MINH QUỐC TẾ KJC Sports 2025-2026',
  },
  trade: {
    projectName: 'KJC Trade',
    primaryColor: '#D97706',
    slogan: 'Sự hài lòng của bạn chính là thành công của đội ngũ CSKH KJC Trade',
    chatButtons: [
      { id: 'consult',    label: 'Tư Vấn Trade',      path: '/cskh/consult',         isExternal: false },
      { id: 'transfer',   label: 'Chuyển Điểm',       path: '/cskh/transfer',        isExternal: false },
      { id: 'forgot-pw',  label: 'Quên Mật Khẩu',     path: '/cskh/forgot-password', isExternal: false },
      { id: 'kyc',        label: 'Hỗ Trợ KYC',        path: '/cskh/kyc',             isExternal: false },
      { id: 'withdraw',   label: 'Khiếu Nại Rút',     path: '/cskh/withdraw-dispute',isExternal: false },
      { id: 'freeze',     label: 'Mở Đóng Băng',      path: '/cskh/freeze',          isExternal: false },
    ],
    experienceButtons: [
      { id: 'ios',     label: 'TẢI APP IOS',     path: '/download/ios',     isExternal: true  },
      { id: 'android', label: 'TẢI APP ANDROID', path: '/download/android', isExternal: true  },
      { id: 'guide',   label: 'HƯỚNG DẪN',       path: '/guide',            isExternal: false },
    ],
    showCodeSection: true,
    footerText: 'LIÊN MINH QUỐC TẾ KJC Trade 2025-2026',
  },
};

class CskhService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // Tìm Project record theo slug
  async _resolveProject(projectSlug) {
    const project = await this.prisma.project.findUnique({ where: { slug: projectSlug } });
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
    return project;
  }

  // Đọc config CSKH của một project (trả về default nếu chưa có)
  async getConfig(projectSlug) {
    const project = await this._resolveProject(projectSlug);
    const item = await this.prisma.contentItem.findFirst({
      where: { projectId: project.id, contentType: CONTENT_TYPE },
    });
    if (!item) {
      return DEFAULTS[projectSlug] ?? null;
    }
    // Merge DB metadata với default để không mất fields chưa được admin set
    return { ...(DEFAULTS[projectSlug] ?? {}), ...item.metadata };
  }

  // Upsert config — tạo mới hoặc cập nhật bản ghi ContentItem
  async upsertConfig(projectSlug, data) {
    const project = await this._resolveProject(projectSlug);

    const existing = await this.prisma.contentItem.findFirst({
      where: { projectId: project.id, contentType: CONTENT_TYPE },
    });

    if (existing) {
      return this.prisma.contentItem.update({
        where: { id: existing.id },
        data: { metadata: data, updatedAt: new Date() },
      });
    }

    return this.prisma.contentItem.create({
      data: {
        projectId: project.id,
        contentType: CONTENT_TYPE,
        title: `CSKH Config — ${projectSlug}`,
        metadata: data,
        isActive: true,
      },
    });
  }

  // Lấy config của tất cả 5 project (dùng cho trang tổng quan admin)
  async getAllConfigs() {
    const projects = Object.keys(DEFAULTS);
    const results = await Promise.all(projects.map(slug => this.getConfig(slug).catch(() => null)));
    return Object.fromEntries(projects.map((slug, i) => [slug, results[i]]));
  }
}

module.exports = CskhService;
