import { describe, it, expect } from 'vitest';

describe('formatters — hub', () => {
  it('formats large numbers with K/M suffix', () => {
    const fmt = (n: number) =>
      n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K`
      : String(n);
    expect(fmt(1_500_000)).toBe('1.5M');
    expect(fmt(3_200)).toBe('3K');
    expect(fmt(500)).toBe('500');
  });

  it('truncates long strings', () => {
    const truncate = (s: string, n: number) =>
      s.length > n ? s.slice(0, n) + '...' : s;
    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Hi', 5)).toBe('Hi');
  });
});
