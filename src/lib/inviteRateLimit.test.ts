import { describe, expect, it } from 'vitest';
import { MAX_FAILURES, WINDOW_MS, afterFailure, isBlocked, visitorIp } from './inviteRateLimit';

describe('invite rate limit', () => {
  const now = 1_000_000_000;

  it('blocks after MAX_FAILURES wrong codes inside the window', () => {
    let state = null;
    for (let i = 0; i < MAX_FAILURES - 1; i++) state = afterFailure(state, now + i);
    expect(isBlocked(state, now + 100)).toBe(false);
    state = afterFailure(state, now + 100);
    expect(state).toEqual({ failures: MAX_FAILURES, windowStart: now });
    expect(isBlocked(state, now + 200)).toBe(true);
  });

  it('lets the visitor try again once the window is over', () => {
    const state = { failures: MAX_FAILURES, windowStart: now };
    expect(isBlocked(state, now + WINDOW_MS)).toBe(false);
    expect(afterFailure(state, now + WINDOW_MS)).toEqual({ failures: 1, windowStart: now + WINDOW_MS });
  });

  it('never blocks a visitor with no wrong codes', () => {
    expect(isBlocked(null, now)).toBe(false);
  });

  it('reads the IP Vercel passes', () => {
    expect(visitorIp(new Headers({ 'x-real-ip': '203.0.113.5', 'x-forwarded-for': '198.51.100.1' }))).toBe('203.0.113.5');
    expect(visitorIp(new Headers({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' }))).toBe('198.51.100.1');
    expect(visitorIp(new Headers())).toBe('unknown');
  });
});
