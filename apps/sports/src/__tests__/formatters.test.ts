import { describe, it, expect } from 'vitest';

describe('formatters — sports', () => {
  it('formats match score', () => {
    const score = (h: number, a: number) => `${h} - ${a}`;
    expect(score(2, 1)).toBe('2 - 1');
    expect(score(0, 0)).toBe('0 - 0');
  });

  it('formats odds as decimal string', () => {
    const fmtOdds = (n: number) => n.toFixed(2);
    expect(fmtOdds(1.85)).toBe('1.85');
    expect(fmtOdds(2.0)).toBe('2.00');
  });
});
