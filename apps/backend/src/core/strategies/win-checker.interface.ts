// packages/backend/src/core/strategies/win-checker.interface.ts
export interface IWinChecker {
  check(betNumbers: number[], resultNumbers: number[]): boolean;
}
