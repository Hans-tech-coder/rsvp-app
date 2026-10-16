// Relative imports: vitest has no '@/' alias (see eventTemplates.test.ts)
import type { DocumentData } from 'firebase/firestore';
import type { EditableDocId } from '../contentDrafts';
import type { Venue } from '../genericContent';
import { joinNames } from '../genericContent';
import { fillText } from '../siteText';
import { THEME_PRESETS, type ThemeColors } from '../theme';
import { TEMPLATES, isEventType, type EventType } from './catalog';
import { weddingDocs } from './wedding';
import { debutDocs } from './debut';
import { birthdayDocs } from './birthday';
import { corporateDocs } from './corporate';

// The content an event made from a template starts with (F12): the template's
// docs with the wizard's answers filled in. Pure; createEvent
// (src/app/actions/events.ts) writes the result as the event's live
// `content/{doc}` docs. Every doc is written whole, so nothing of the
// built-in defaults (src/data/wedding-content.json, the first couple's site)
// shows on a new event.
//
// Template texts may use these placeholders, filled from the wizard:
//   {eventName} {hostNames} {host1} {eventDate} "December 20, 2026"
//   {eventDay} "Sunday, December 20, 2026" {eventTime} "3:00 PM"
//   {venueName} {eventCity} {rsvpDate} (30 days before the event)
// Placeholders the guest site fills itself ({couple}, {days}, ...) stay as typed.

/** A template's content docs. `screens` and `theme` come from the catalog and the wizard. */
export type TemplateDocs = Partial<Record<Exclude<EditableDocId, 'screens' | 'theme'>, DocumentData>>;

const TEMPLATE_DOCS: Record<EventType, TemplateDocs> = {
  wedding: weddingDocs,
  debut: debutDocs,
  birthday: birthdayDocs,
  corporate: corporateDocs,
};

/** The wizard's answers. */
export type NewEventDetails = {
  type: EventType;
  name: string;
  /** One per `hostFields` entry ('' for a skipped optional one). */
  hosts: string[];
  /** Local date and time, `YYYY-MM-DDTHH:mm` (an `<input type="datetime-local">` value). */
  start: string;
  venue: string;
  address: string;
  city: string;
  /** A theme preset id. */
  palette: string;
};

export const NEW_EVENT_LIMITS = { name: 80, host: 60, venue: 120, address: 200, city: 60 } as const;

const START = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** The wizard's answers checked and trimmed, or the first problem in words. */
export function checkNewEventDetails(raw: unknown): NewEventDetails | string {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const text = (key: string) => (typeof input[key] === 'string' ? (input[key] as string).trim() : '');

  if (!isEventType(input.type)) return 'Pick a template.';
  const template = TEMPLATES[input.type];

  const name = text('name');
  if (!name) return 'Give the event a name.';
  if (name.length > NEW_EVENT_LIMITS.name) return `Keep the name under ${NEW_EVENT_LIMITS.name} characters.`;

  const rawHosts = Array.isArray(input.hosts) ? input.hosts : [];
  const hosts = template.hostFields.map((_, i) => (typeof rawHosts[i] === 'string' ? (rawHosts[i] as string).trim() : ''));
  for (const [i, field] of template.hostFields.entries()) {
    if (!hosts[i] && !field.optional) return `Fill in the ${field.label.toLowerCase()}.`;
    if (hosts[i].length > NEW_EVENT_LIMITS.host) return `Keep each name under ${NEW_EVENT_LIMITS.host} characters.`;
  }

  const start = text('start');
  if (!parseStart(start)) return 'Pick the date and start time.';

  const venue = text('venue');
  const address = text('address');
  const city = text('city');
  if (!venue) return 'Fill in the venue.';
  if (!city) return 'Fill in the town or city.';
  if (venue.length > NEW_EVENT_LIMITS.venue || address.length > NEW_EVENT_LIMITS.address || city.length > NEW_EVENT_LIMITS.city) {
    return 'The venue, address or city is too long.';
  }

  const palette = text('palette');
  if (!THEME_PRESETS.some((p) => p.id === palette)) return 'Pick a color palette.';

  return { type: input.type, name, hosts, start, venue, address, city, palette };
}

/** "2026-12-20T15:00" as a UTC Date that stands for that local wall time, or null. */
function parseStart(start: string): Date | null {
  const m = START.exec(start);
  if (!m) return null;
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && hour < 24 && minute < 60;
  return valid ? date : null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => String(n).padStart(2, '0');

// Wall-time formatting from the UTC fields, so the server's time zone never shifts the event.
const longDate = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
const clock = (d: Date) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
const time12 = (d: Date) => `${d.getUTCHours() % 12 || 12}:${pad(d.getUTCMinutes())} ${d.getUTCHours() < 12 ? 'AM' : 'PM'}`;
const isoLocal = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${clock(d)}`;
const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

/** Replaces the placeholders in every string of a doc. */
function fillDeep<T>(value: T, values: Record<string, string>): T {
  if (typeof value === 'string') return fillText(value, values) as T;
  if (Array.isArray(value)) return value.map((v) => fillDeep(v, values)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillDeep(v, values)])) as T;
  }
  return value;
}

/**
 * The dress code swatches in the chosen palette, named from the preset:
 * "Sage & Cream" -> Deep Sage, Sage, Cream, Light Cream, Ivory.
 */
function paletteSwatches(name: string, colors: ThemeColors) {
  const [main, accent = main] = name.split('&').map((s) => s.trim());
  return [
    { hex: colors.primaryDeep, name: `Deep ${main}` },
    { hex: colors.primary, name: main },
    { hex: colors.accent, name: accent },
    { hex: colors.accentLight, name: `Light ${accent}` },
    { hex: colors.ink, name: 'Ivory' },
  ];
}

/** Every content doc a new event starts with, by doc ID. `details` must be checked. */
export function buildTemplateDocs(details: NewEventDetails): Partial<Record<EditableDocId, DocumentData>> {
  const template = TEMPLATES[details.type];
  const start = parseStart(details.start)!;
  const preset = THEME_PRESETS.find((p) => p.id === details.palette)!;

  const hosts = template.hostFields.length
    ? template.hostFields
        .map((field, i) => ({ name: details.hosts[i] ?? '', role: field.role }))
        .filter((h) => h.name)
    : [{ name: details.name, role: 'Event' }];
  const hostNames = joinNames(hosts.map((h) => h.name));

  const values: Record<string, string> = {
    eventName: details.name,
    hostNames,
    host1: hosts[0].name,
    eventDate: longDate(start),
    eventDay: `${WEEKDAYS[start.getUTCDay()]}, ${longDate(start)}`,
    eventTime: time12(start),
    venueName: details.venue,
    eventCity: details.city,
    rsvpDate: longDate(addMinutes(start, -30 * 24 * 60)),
  };
  const docs = fillDeep(TEMPLATE_DOCS[details.type], values) as Partial<Record<EditableDocId, DocumentData>>;

  const targetDate = `${longDate(start)} ${clock(start)}`;
  docs.globalSettings = {
    ...docs.globalSettings,
    hosts,
    coupleNameFormat: template.nameFrom === 'hosts' ? hostNames : details.name,
    targetDate,
    venueShort: details.city,
  };
  docs.welcomeScreen = { ...docs.welcomeScreen, targetDate };

  const place = [details.venue, details.address, details.city].filter(Boolean).join(', ');
  const query = encodeURIComponent(place);
  const venues = ((docs.details?.venues ?? []) as Venue[]).map((venue, i) => {
    const at = addMinutes(start, template.venueOffsets[i] ?? 0);
    return {
      ...venue,
      time: time12(at),
      location: details.venue,
      address: [details.address, details.city].filter(Boolean).join(', '),
      mapLink: `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&output=embed`,
      calendarStart: isoLocal(at),
      calendarLoc: `https://www.google.com/maps/search/?api=1&query=${query}`,
    };
  });
  docs.details = { ...docs.details, venues };
  docs.dressCode = { ...docs.dressCode, colors: paletteSwatches(preset.name, preset.colors) };

  docs.theme = { preset: preset.id, colors: { ...preset.colors }, fontPairing: template.fontPairing };
  docs.screens = { screens: template.screens.map((s) => ({ ...s })) };
  return docs;
}
