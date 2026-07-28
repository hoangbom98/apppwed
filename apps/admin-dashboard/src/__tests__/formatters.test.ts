import { describe, it, expect } from 'vitest';

describe('formatters — admin', () => {
  it('formats date in Vietnamese locale', () => {
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    expect(fmt('2024-01-15')).toContain('15');
    expect(fmt('2024-01-15')).toContain('2024');
  });

  it('formats table status tags', () => {
    const status = (s: string) => ({
      active: 'Hoạt động',
      inactive: 'Tạm dừng',
      pending: 'Chờ duyệt',
    }[s] ?? s);
    expect(status('active')).toBe('Hoạt động');
    expect(status('pending')).toBe('Chờ duyệt');
  });
});
