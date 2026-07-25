/**
 * dau-duoi.strategy.ts — Đầu / Đuôi (head or tail digit matching)
 * betNumbers[0] = selected digit (0-9)
 * betNumbers[1] = 0 for "đầu" (first digit of last 2), 1 for "đuôi" (last digit)
 *
 * Counts how many results match; win if at least 1 matches.
 */
import { IWinChecker } from './win-checker.interface';

export class DauDuoiStrategy implements IWinChecker {
  check(betNumbers: number[], resultNumbers: number[]): boolean {
    const [digit, position] = betNumbers; // position: 0=đầu, 1=đuôi
    if (digit === undefined) return false;

    for (let i = 0; i + 1 < resultNumbers.length; i += 2) {
      const head = resultNumbers[i];
      const tail = resultNumbers[i + 1];
      const match = (position === 0) ? (head === digit) : (tail === digit);
      if (match) return true;
    }
    return false;
  }
}
