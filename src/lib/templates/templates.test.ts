import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildEventSite } from '../eventSite';
import { EDITABLE_DOC_IDS } from '../contentDrafts';
import { CONTENT_DEFAULTS, DEFAULT_SITE_TEXT } from '../weddingContent';
import { THEME_PRESETS } from '../theme';
import { getFontPairing } from '../fonts';
import { visibleScreens } from '../screens';
import { EVENT_TYPES, TEMPLATES, eventTypeName, type EventType } from './catalog';
import { buildTemplateDocs, checkNewEventDetails, type NewEventDetails } from './index';

const details = (type: EventType, extra: Partial<NewEventDetails> = {}): NewEventDetails => ({
  type,
  name: 'Sample Event',
  hosts: TEMPLATES[type].hostFields.map((_, i) => ['Ana', 'Ben'][i]),
  start: '2027-02-14T16:30',
  venue: 'Grand Hall',
  address: '1 Rizal Ave',
  city: 'Quezon City',
  palette: TEMPLATES[type].palettes[0],
  ...extra,
});

// Things only the first couple's site has (src/data/wedding-content.json).
const PERSONAL = ['Hans', 'Czay', 'Tarlac', 'Camiling', 'Paniqui', 'Obena', 'Presto', 'blob.vercel-storage', 'hansandczay', '995 179', 'December 20, 2026'];

const OUR_PLACEHOLDERS = /\{(eventName|hostNames|host1|eventDate|eventDay|eventTime|venueName|eventCity|rsvpDate)\}/;

function leaves(value: unknown, path: string[] = []): [string[], unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, [...path, k]));
  }
  return [[path, value]];
}

describe('event templates', () => {
  it.each(EVENT_TYPES)('%s: nothing of the first couple shows', (type) => {
    // Everything the page sends to the browser, shown or not
    const shown = JSON.stringify(buildEventSite(buildTemplateDocs(details(type)), CONTENT_DEFAULTS));
    for (const word of PERSONAL) expect(shown, word).not.toContain(word);
    expect(shown).not.toMatch(OUR_PLACEHOLDERS);
  });

  it.each(EVENT_TYPES)('%s: only known docs and site text keys', (type) => {
    const docs = buildTemplateDocs(details(type));
    for (const id of Object.keys(docs)) expect(EDITABLE_DOC_IDS).toContain(id);
    for (const [path, value] of leaves(docs.siteText ?? {})) {
      const fallback = path.reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], DEFAULT_SITE_TEXT);
      expect(typeof fallback, path.join('.')).toBe('string');
      expect(typeof value, path.join('.')).toBe('string');
    }
  });

  it.each(EVENT_TYPES)('%s: every photo exists in public/', (type) => {
    const shown = JSON.stringify(buildTemplateDocs(details(type)));
    const files = [...shown.matchAll(/"(\/templates\/[^"]+)"/g)].map((m) => m[1]);
    expect(files.length).toBeGreaterThan(5);
    for (const file of [...files, TEMPLATES[type].cover]) {
      expect(existsSync(join(process.cwd(), 'public', file)), file).toBe(true);
    }
  });

  it.each(EVENT_TYPES)('%s: catalog settings are valid', (type) => {
    const t = TEMPLATES[type];
    for (const id of t.palettes) expect(THEME_PRESETS.some((p) => p.id === id), id).toBe(true);
    expect(getFontPairing(t.fontPairing).id).toBe(t.fontPairing);
    expect(t.screens[0]).toMatchObject({ type: 'welcome', enabled: true });
    expect(visibleScreens(t.screens).some((s) => s.type === 'rsvp')).toBe(true);
    const site = buildEventSite(buildTemplateDocs(details(type)), CONTENT_DEFAULTS);
    expect(site.content.details.venues).toHaveLength(t.venueOffsets.length);
    expect(site.screens).toEqual(t.screens);
    expect(eventTypeName(type)).toBe(t.name);
  });

  it('fills the wizard answers in', () => {
    const site = buildEventSite(buildTemplateDocs(details('wedding', { palette: 'sage-cream' })), CONTENT_DEFAULTS);
    expect(site.content.global.hosts).toEqual([{ name: 'Ana', role: 'Groom' }, { name: 'Ben', role: 'Bride' }]);
    expect(site.content.global.coupleNameFormat).toBe('Ana & Ben');
    expect(site.content.global.targetDate).toBe('February 14, 2027 16:30:00');
    expect(site.content.welcomeScreen.targetDate).toBe('February 14, 2027 16:30:00');
    expect(site.content.welcomeScreen.bottomText2).toBe('Sunday, February 14, 2027');
    expect(site.content.global.venueShort).toBe('Quezon City');
    expect(site.content.rsvpCta.description).toContain('January 15, 2027');
    const [ceremony, reception] = site.content.details.venues;
    expect(ceremony).toMatchObject({ time: '4:30 PM', calendarStart: '2027-02-14T16:30:00', location: 'Grand Hall', address: '1 Rizal Ave, Quezon City' });
    expect(reception).toMatchObject({ time: '8:00 PM', calendarStart: '2027-02-14T20:00:00' });
    expect(ceremony.mapLink).toContain(encodeURIComponent('Grand Hall, 1 Rizal Ave, Quezon City'));
    expect(site.theme.preset).toBe('sage-cream');
    expect(site.theme.colors.primary).toBe(THEME_PRESETS.find((p) => p.id === 'sage-cream')!.colors.primary);
    expect(site.theme.fontPairing).toBe('classic');
    expect(site.content.dressCode.colors.map((c) => c.name)).toEqual(['Deep Sage', 'Sage', 'Cream', 'Light Cream', 'Ivory']);
  });

  it('uses the event name where a template has no host names', () => {
    const corporate = buildEventSite(buildTemplateDocs(details('corporate', { name: 'Leadership Summit 2027' })), CONTENT_DEFAULTS);
    expect(corporate.content.global.hosts).toEqual([{ name: 'Leadership Summit 2027', role: 'Event' }]);
    expect(corporate.content.global.coupleNameFormat).toBe('Leadership Summit 2027');
    expect(corporate.music.enabled).toBe(false);
    expect(corporate.content.details.venues[0].time).toBe('4:00 PM');

    const debut = buildEventSite(buildTemplateDocs(details('debut', { name: 'Ana’s Debut' })), CONTENT_DEFAULTS);
    expect(debut.content.global.coupleNameFormat).toBe('Ana’s Debut');
    expect(debut.content.global.hosts).toEqual([{ name: 'Ana', role: 'Debutante' }]);
  });

  it('skips an empty optional name', () => {
    const one = buildEventSite(buildTemplateDocs(details('birthday', { hosts: ['Lola Maria', ''] })), CONTENT_DEFAULTS);
    expect(one.content.global.hosts).toEqual([{ name: 'Lola Maria', role: 'Celebrant' }]);
    const two = buildEventSite(buildTemplateDocs(details('birthday', { hosts: ['Lola Maria', 'Lolo Jose'] })), CONTENT_DEFAULTS);
    expect(two.content.ourStory.items[2].description).toContain('Lola Maria & Lolo Jose');
  });

  it('checks the wizard answers', () => {
    const ok = details('wedding');
    expect(checkNewEventDetails({ ...ok, name: '  Sample Event  ' })).toEqual(ok);
    expect(checkNewEventDetails({ ...ok, type: 'gala' })).toBe('Pick a template.');
    expect(checkNewEventDetails({ ...ok, name: ' ' })).toBe('Give the event a name.');
    expect(checkNewEventDetails({ ...ok, hosts: ['Ana'] })).toMatch(/bride/i);
    expect(checkNewEventDetails({ ...ok, start: '2027-02-30T10:00' })).toMatch(/date/);
    expect(checkNewEventDetails({ ...ok, start: '2027-02-14' })).toMatch(/date/);
    expect(checkNewEventDetails({ ...ok, venue: '' })).toMatch(/venue/);
    expect(checkNewEventDetails({ ...ok, city: '' })).toMatch(/city/);
    expect(checkNewEventDetails({ ...ok, palette: 'neon' })).toMatch(/palette/);
    expect(checkNewEventDetails({ ...details('birthday'), hosts: ['Lola Maria'] })).toMatchObject({ hosts: ['Lola Maria', ''] });
    expect(checkNewEventDetails({ ...details('corporate'), hosts: ['ignored'] })).toMatchObject({ hosts: [] });
    expect(checkNewEventDetails(null)).toBe('Pick a template.');
  });
});
