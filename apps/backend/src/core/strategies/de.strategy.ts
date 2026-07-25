// packages/backend/src/core/strategies/de.strategy.ts
import { IWinChecker } from './win-checker.interface';

export class DeStrategy implements IWinChecker {
  check(betNumbers: number[], resultNumbers: number[]): boolean {
    const lastTwo = resultNumbers.slice(-2).join('');
    return betNumbers.join('') === lastTwo;
  }
}
