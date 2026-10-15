import { describe, expect, it } from 'vitest';
import { DEFAULT_EVENT_ID, isValidEventId, paths } from './eventPaths';

describe('event paths', () => {
  it('nests event data under events/{eventId}', () => {
    expect(paths.content('hans-and-czay', 'siteText')).toBe('events/hans-and-czay/content/siteText');
    expect(paths.guest('hans-and-czay', 'K7MPQ2')).toBe('events/hans-and-czay/guests/K7MPQ2');
    expect(paths.giftSelections('hans-and-czay')).toBe('events/hans-and-czay/giftSelections');
    expect(paths.setting('hans-and-czay', 'inviteTemplate')).toBe('events/hans-and-czay/settings/inviteTemplate');
    expect(paths.member('hans-and-czay', 'uid1')).toBe('events/hans-and-czay/members/uid1');
    expect(paths.auditLog('hans-and-czay')).toBe('events/hans-and-czay/auditLog');
  });

  it('keeps admin accounts global', () => {
    expect(paths.admin('uid1')).toBe('admins/uid1');
    expect(paths.adminAllowlistEntry('a@b.co')).toBe('adminAllowlist/a@b.co');
  });

  it('accepts slug-like event IDs only', () => {
    expect(isValidEventId(DEFAULT_EVENT_ID)).toBe(true);
    expect(isValidEventId('ana-18th-2027')).toBe(true);
    for (const bad of ['', 'Ana', 'a/b', '-a', 'a-', 'a_b', 'a'.repeat(65), 42, null]) {
      expect(isValidEventId(bad)).toBe(false);
    }
  });

  it('rejects IDs that would point at another document', () => {
    expect(() => paths.guest('x/guests/y', 'K7MPQ2')).toThrow();
    expect(() => paths.guest('hans-and-czay', 'A/B')).toThrow();
    expect(() => paths.content('hans-and-czay', '')).toThrow();
  });
});
