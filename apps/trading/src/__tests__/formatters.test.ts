import { describe, it, expect } from 'vitest';

describe('formatters — trading', () => {
  it('formats percentage correctly', () => {
    const fmtPct = (v: number) =>
      `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
    expect(fmtPct(2.35)).toBe('+2.35%');
    expect(fmtPct(-1.5)).toBe('-1.50%');
  });

  it('maps trading symbol to TradingView format', () => {
    const toTv = (s: string) => 'BINANCE:' + s.replace('/', '');
    expect(toTv('BTC/USDT')).toBe('BINANCE:BTCUSDT');
    expect(toTv('ETH/USDT')).toBe('BINANCE:ETHUSDT');
  });
});
