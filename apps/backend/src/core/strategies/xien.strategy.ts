/**
 * xien.strategy.ts — Xiên (all selected numbers must hit as lô)
 * Xiên 2: 2 numbers, both must appear in results
 * Xiên 3: 3 numbers, all must appear
 * Xiên 4: 4 numbers, all must appear
 *
 * betNumbers: [n1, n2] or [n1, n2, n3] or [n1, n2, n3, n4]
 * resultNumbers: flat 2-per-pair array (same as LoStrategy)
 */
import { IWinChecker } from './win-checker.interface';
import { LoStrategy } from './lo.strategy';

const loChecker = new LoStrategy();

export class XienStrategy implements IWinChecker {
  check(betNumbers: number[], resultNumbers: number[]): boolean {
    // Each element of betNumbers is a 2-digit number (e.g. 35 → [3,5] or stored as 35)
    return betNumbers.every((n) => {
      const digits = n < 10 ? [0, n] : [Math.floor(n / 10), n % 10];
      return loChecker.check(digits, resultNumbers);
    });
  }
}
