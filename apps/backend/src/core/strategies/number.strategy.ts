/**
 * number.strategy.ts — Generic single-digit / last-digit win check.
 * Used for simple lottery types where betChoice is the single result digit.
 *
 * betNumbers[0] === resultNumbers[resultNumbers.length - 1]
 */
import { IWinChecker } from './win-checker.interface';

export class NumberStrategy implements IWinChecker {
  check(betNumbers: number[], resultNumbers: number[]): boolean {
    if (betNumbers.length === 0 || resultNumbers.length === 0) return false;
    return betNumbers[0] === resultNumbers[resultNumbers.length - 1];
  }
}
