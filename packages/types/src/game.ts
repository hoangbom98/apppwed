/**
 * @lkvip/types — src/game.ts
 *
 * Simplified Game interface for the Game module.
 * The richer provider/session/round types live in common.types.ts.
 *
 * Import:
 *   import type { Game } from '@lkvip/types';
 */

export interface Game {
  id:       string;
  name:     string;
  provider: string;
  rtp:      number;
  status:   'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}
