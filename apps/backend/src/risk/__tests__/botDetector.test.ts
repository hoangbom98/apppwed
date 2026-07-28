/**
 * Unit tests for BotDetector.detect()
 *
 * All logic runs in-process — no DB, no Redis, no logger side-effects.
 * The detect() method is a pure synchronous rule engine.
 */

import BotDetector from '../botDetector';
import type { SessionMeta } from '../types';

describe('BotDetector.detect()', () => {
  const detector = new BotDetector();

  // ── Rule 1: high-frequency click in very short time ──────────────────────
  it('flags high-frequency click (> 100 clicks in < 10 s) as bot', () => {
    const session: SessionMeta = { clickCount: 150, timeSpent: 5_000 /* 5 s */ };
    const result = detector.detect(session);
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe('high_frequency_click');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  // ── Rule 2: clicks with virtually no mouse movement ───────────────────────
  it('flags clicks without mouse movement as bot', () => {
    const session: SessionMeta = { clickCount: 30, mouseMovements: 2, timeSpent: 60_000 };
    const result = detector.detect(session);
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe('no_mouse_movement');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  // ── Rule 3: clicks without preceding hover events ────────────────────────
  it('flags click-without-hover pattern as bot', () => {
    const session: SessionMeta = {
      clickCount:     15,
      mouseMovements: 10,
      timeSpent:      30_000,
      eventSequence:  ['click', 'keydown'],   // no 'mouseover' / 'mousemove'
    };
    const result = detector.detect(session);
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe('missing_hover');
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  // ── Rule 4: click rate > 10 clicks/s ────────────────────────────────────
  it('flags click rate > 10/s as bot', () => {
    const session: SessionMeta = {
      clickCount:     500,
      timeSpent:      10_000, // 10 s → 50 clicks/s
      mouseMovements: 300,
      eventSequence:  ['mousemove', 'click'],
    };
    const result = detector.detect(session);
    expect(result.isBot).toBe(true);
    expect(result.reason).toBe('click_rate_exceeded');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  // ── Human baseline ────────────────────────────────────────────────────────
  it('returns isBot=false for normal human interaction', () => {
    const session: SessionMeta = {
      clickCount:     5,
      mouseMovements: 80,
      timeSpent:      120_000,
      eventSequence:  ['mousemove', 'mouseover', 'click', 'keydown'],
    };
    const result = detector.detect(session);
    expect(result.isBot).toBe(false);
    expect(result.reason).toBeNull();
    expect(result.confidence).toBe(0);
  });

  // ── Empty session (no data sent) ─────────────────────────────────────────
  it('returns isBot=false for empty session meta', () => {
    const result = detector.detect({});
    expect(result.isBot).toBe(false);
    expect(result.confidence).toBe(0);
  });
});
