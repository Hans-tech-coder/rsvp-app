import { describe, expect, it } from 'vitest';
import { fillText, mergeSiteText } from './siteText';
import { DEFAULT_SITE_TEXT } from './weddingContent';
import { SITE_TEXT_GROUPS } from '../app/admin/content/siteTextFields';
import { SCREEN_TYPES } from './screens';

function leafPaths(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : leafPaths(value, `${prefix}${key}.`),
  );
}

describe('mergeSiteText', () => {
  it('takes saved text and keeps defaults for missing, empty or wrong-typed values', () => {
    const merged = mergeSiteText(DEFAULT_SITE_TEXT, {
      common: { continue: 'Next' },
      entrance: { button: '   ', errors: { used: 42 } },
      unknownGroup: { x: 'ignored' },
    });
    expect(merged.common.continue).toBe('Next');
    expect(merged.entrance.button).toBe(DEFAULT_SITE_TEXT.entrance.button);
    expect(merged.entrance.errors.used).toBe(DEFAULT_SITE_TEXT.entrance.errors.used);
    expect(merged.menu).toEqual(DEFAULT_SITE_TEXT.menu);
    expect('unknownGroup' in merged).toBe(false);
  });

  it('returns the defaults when there is no saved doc', () => {
    expect(mergeSiteText(DEFAULT_SITE_TEXT, undefined)).toBe(DEFAULT_SITE_TEXT);
  });
});

describe('fillText', () => {
  it('replaces known placeholders and leaves unknown ones as typed', () => {
    expect(fillText('{count} more digits, {other}', { count: 3 })).toBe('3 more digits, {other}');
  });
});

describe('Site Text editor fields', () => {
  it('lists every siteText key exactly once (menu names: the Screens & Menu tab)', () => {
    const editable = SITE_TEXT_GROUPS.flatMap((group) => group.fields.map((field) => field.path));
    const menu = SCREEN_TYPES.map((type) => `menu.${type}`);
    expect([...editable, ...menu].sort()).toEqual(leafPaths(DEFAULT_SITE_TEXT).sort());
  });
});
