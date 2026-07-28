import { describe, it, expect } from 'vitest';

describe('formatters — game', () => {
  it('formats VND currency', () => {
    const fmtVnd = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
    expect(fmtVnd(1_000_000)).toContain('1.000.000');
  });

  it('clamps value between min and max', () => {
    const clamp = (v: number, min: number, max: number) =>
      Math.min(Math.max(v, min), max);
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-1, 0, 100)).toBe(0);
    expect(clamp(200, 0, 100)).toBe(100);
  });
});
