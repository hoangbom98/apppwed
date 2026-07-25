/**
 * strategy.factory.ts
 * Maps betType string → IWinChecker instance.
 *
 * Registered types:
 *   de       — Đề (last 2 digits of special prize)
 *   lo       — Lô (any result tail matches)
 *   xien     — Xiên 2/3/4 (all numbers must hit as lô)
 *   xien2    — alias for xien
 *   xien3    — alias for xien
 *   xien4    — alias for xien
 *   dau-duoi — Đầu/đuôi
 *   number   — Generic single-digit / last-digit (simple draws)
 *
 * To add a new type:
 *   1. Create `my.strategy.ts` implementing IWinChecker.
 *   2. Import and add to the `STRATEGIES` map below.
 */
import { DeStrategy }       from './de.strategy';
import { LoStrategy }       from './lo.strategy';
import { XienStrategy }     from './xien.strategy';
import { DauDuoiStrategy }  from './dau-duoi.strategy';
import { NumberStrategy }   from './number.strategy';
import { IWinChecker }      from './win-checker.interface';

const de       = new DeStrategy();
const lo       = new LoStrategy();
const xien     = new XienStrategy();
const dauDuoi  = new DauDuoiStrategy();
const number   = new NumberStrategy();

const STRATEGIES = new Map<string, IWinChecker>([
  ['de',        de],
  ['lo',        lo],
  ['xien',      xien],
  ['xien2',     xien],
  ['xien3',     xien],
  ['xien4',     xien],
  ['dau',       dauDuoi],
  ['duoi',      dauDuoi],
  ['dau-duoi',  dauDuoi],
  ['number',    number],   // simple single-digit draws
]);

export class StrategyFactory {
  /**
   * Get the win-check strategy for a given betType.
   * Falls back to `number` strategy when type is unknown
   * so unknown types don't crash settlement.
   */
  static get(type: string): IWinChecker {
    return STRATEGIES.get(type.toLowerCase()) ?? number;
  }

  /** Register a custom strategy at runtime (e.g. provider-specific). */
  static register(type: string, checker: IWinChecker): void {
    STRATEGIES.set(type.toLowerCase(), checker);
  }

  /** List all registered types (useful for admin UI). */
  static types(): string[] {
    return [...STRATEGIES.keys()];
  }
}
