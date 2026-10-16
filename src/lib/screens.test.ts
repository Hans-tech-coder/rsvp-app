import { describe, expect, it } from 'vitest';
import { DEFAULT_SCREENS, SCREEN_TYPES, mergeScreens, screenLabel, visibleScreens } from './screens';
import { DEFAULT_SITE_TEXT } from './weddingContent';

const types = (list: { type: string }[]) => list.map((s) => s.type);

describe('screens', () => {
  it('defaults: every screen, Wedding order, on, site text names', () => {
    expect(mergeScreens(undefined)).toEqual(DEFAULT_SCREENS);
    expect(types(visibleScreens(DEFAULT_SCREENS))).toEqual([...SCREEN_TYPES]);
    expect(DEFAULT_SCREENS.map((s) => screenLabel(s, DEFAULT_SITE_TEXT.menu))).toEqual(
      SCREEN_TYPES.map((t) => DEFAULT_SITE_TEXT.menu[t]),
    );
  });

  it('every screen type has a site text menu name', () => {
    for (const type of SCREEN_TYPES) expect(typeof DEFAULT_SITE_TEXT.menu[type]).toBe('string');
  });

  it('keeps the saved order, switches and names', () => {
    const saved = mergeScreens({
      screens: [
        { type: 'welcome', enabled: true, label: '' },
        { type: 'gallery', enabled: true, label: '  Photos  ' },
        { type: 'ourStory', enabled: false, label: '' },
        ...SCREEN_TYPES.filter((t) => !['welcome', 'gallery', 'ourStory'].includes(t)).map((type) => ({ type, enabled: true, label: '' })),
      ],
    });
    expect(types(saved).slice(0, 3)).toEqual(['welcome', 'gallery', 'ourStory']);
    expect(saved[1].label).toBe('Photos');
    expect(screenLabel(saved[1], DEFAULT_SITE_TEXT.menu)).toBe('Photos');
    expect(types(visibleScreens(saved))).not.toContain('ourStory');
  });

  it('drops unknown and repeated screens, puts a missing one back after its default neighbour', () => {
    const saved = mergeScreens({
      screens: [
        { type: 'welcome', enabled: true, label: '' },
        { type: 'bogus', enabled: true, label: '' },
        { type: 'registry', enabled: false, label: 'Gifts' },
        { type: 'registry', enabled: true, label: 'Again' },
        { type: 'faqs', enabled: true, label: 7 },
      ],
    });
    expect(saved).toHaveLength(SCREEN_TYPES.length);
    expect(saved.find((s) => s.type === 'registry')).toEqual({ type: 'registry', enabled: false, label: 'Gifts' });
    expect(saved.find((s) => s.type === 'faqs')?.label).toBe('');
    // rsvpCta follows registry by default, rsvp follows rsvpCta; faqs keeps its saved place
    expect(types(saved)).toEqual([
      'welcome', 'ourStory', 'entourage', 'details', 'dressCode', 'gallery', 'registry', 'rsvpCta', 'rsvp', 'faqs',
    ]);
  });

  it('keeps Welcome first and on', () => {
    const saved = mergeScreens({
      screens: [
        { type: 'faqs', enabled: true, label: '' },
        { type: 'welcome', enabled: false, label: 'Hi' },
      ],
    });
    expect(saved[0]).toEqual({ type: 'welcome', enabled: true, label: 'Hi' });
  });
});
