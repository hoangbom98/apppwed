/**
 * lo.strategy.ts — Lô (2-số xuất hiện trong 18 cặp của kết quả)
 * Win condition: betNumbers[0] matches the last 2 digits of ANY prize row.
 */
import { IWinChecker } from './win-checker.interface';

export class LoStrategy implements IWinChecker {
  /** resultNumbers: flat array of all prize digits, 2 digits per entry.
   *  e.g. [3,5, 6,2, 1,4, …]  (each consecutive pair = one result tail)
   */
  check(betNumbers: number[], resultNumbers: number[]): boolean {
    const betTail = betNumbers.join('');
    for (let i = 0; i + 1 < resultNumbers.length; i += 2) {
      const tail = `${resultNumbers[i]}${resultNumbers[i + 1]}`;
      if (betTail === tail) return true;
    }
    return false;
  }
}
