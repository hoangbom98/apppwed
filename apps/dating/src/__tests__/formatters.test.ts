import { describe, it, expect } from 'vitest';

describe('formatters — dating', () => {
  it('formats age from birthdate', () => {
    const age = (dob: string) => {
      const diff = Date.now() - new Date(dob).getTime();
      return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };
    expect(age('2000-01-01')).toBeGreaterThan(20);
    expect(age('1990-01-01')).toBeGreaterThan(30);
  });

  it('truncates bio text', () => {
    const truncate = (s: string, n = 100) =>
      s.length > n ? s.slice(0, n) + '…' : s;
    const long = 'a'.repeat(150);
    expect(truncate(long)).toHaveLength(101);
  });
});
