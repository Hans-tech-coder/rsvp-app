// Relative imports: vitest has no '@/' alias (see eventTemplates.test.ts)
import type { ScreenConfig } from '../screens';

// The event templates (F12): what the New Event wizard (src/app/admin/new)
// offers and how a new event starts. This file is the light part, safe for
// the browser: names, the picker's cover photo, the wizard's name fields,
// palettes, fonts and screens. The texts each template starts with live in
// ./<type>.ts and are put together by ./index.ts (server).
// Sample photos: public/templates (CC0 / public domain, list in CREDITS.md).

export const EVENT_TYPES = ['wedding', 'debut', 'birthday', 'corporate'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const isEventType = (value: unknown): value is EventType =>
  typeof value === 'string' && (EVENT_TYPES as readonly string[]).includes(value);

/** One name the wizard asks for; it becomes `global.hosts[i]`. */
export type HostField = { role: string; label: string; placeholder: string; optional?: boolean };

export type TemplateInfo = {
  type: EventType;
  name: string;
  /** One line in the picker. */
  summary: string;
  /** The picker's photo; also the welcome background. */
  cover: string;
  /** Example event name in the wizard. */
  namePlaceholder: string;
  /** The names on the cover. Empty: the event name is the cover title. */
  hostFields: HostField[];
  /** `global.coupleNameFormat` (404 page, email, link preview): the hosts' names joined, or the event name. */
  nameFrom: 'hosts' | 'eventName';
  /** Theme presets (src/lib/theme.ts) offered first; the first is the default. */
  palettes: string[];
  /** Font pairing (src/lib/fonts.ts). */
  fontPairing: string;
  /** The `content/screens` doc the event starts with. */
  screens: ScreenConfig[];
  /** Minutes after the start time of each venue in `details.venues` (same order). */
  venueOffsets: number[];
};

const on = (type: ScreenConfig['type'], label = ''): ScreenConfig => ({ type, enabled: true, label });
const off = (type: ScreenConfig['type'], label = ''): ScreenConfig => ({ type, enabled: false, label });

export const TEMPLATES: Record<EventType, TemplateInfo> = {
  wedding: {
    type: 'wedding',
    name: 'Wedding',
    summary: 'Love story, entourage, ceremony and reception, dress code, gift registry.',
    cover: '/templates/wedding-bouquet.webp',
    namePlaceholder: 'e.g. Juan & Maria’s Wedding',
    hostFields: [
      { role: 'Groom', label: 'Groom’s name', placeholder: 'e.g. Juan' },
      { role: 'Bride', label: 'Bride’s name', placeholder: 'e.g. Maria' },
    ],
    nameFrom: 'hosts',
    palettes: ['burgundy-gold', 'sage-cream', 'blush-rose-gold', 'navy-silver', 'emerald-gold', 'black-gold'],
    fontPairing: 'classic',
    screens: [
      on('welcome'), on('ourStory'), on('entourage'), on('details'), on('dressCode'),
      on('gallery'), on('faqs'), on('registry'), on('rsvpCta'), on('rsvp'),
    ],
    venueOffsets: [0, 210],
  },
  debut: {
    type: 'debut',
    name: 'Debut',
    summary: 'Her story, 18 Roses, Candles and Treasures, the grand ball, gifts.',
    cover: '/templates/debut-roses-bouquet.webp',
    namePlaceholder: 'e.g. Ana’s Debut',
    hostFields: [{ role: 'Debutante', label: 'Debutante’s name', placeholder: 'e.g. Ana' }],
    nameFrom: 'eventName',
    palettes: ['blush-rose-gold', 'black-gold', 'navy-silver', 'emerald-gold', 'burgundy-gold', 'sage-cream'],
    fontPairing: 'glamour',
    screens: [
      on('welcome'), on('ourStory', 'Her Story'), on('entourage', 'Her 18s'), on('details'), on('dressCode'),
      on('gallery'), on('faqs'), on('registry', 'Gifts'), on('rsvpCta', 'Join the Night'), on('rsvp'),
    ],
    venueOffsets: [0],
  },
  birthday: {
    type: 'birthday',
    name: 'Birthday / Anniversary',
    summary: 'A milestone party: the years, the venue, the dress code, photos and RSVPs.',
    cover: '/templates/birthday-candles.webp',
    namePlaceholder: 'e.g. Lola Maria’s 80th Birthday',
    hostFields: [
      { role: 'Celebrant', label: 'Celebrant’s name', placeholder: 'e.g. Lola Maria' },
      { role: 'Celebrant', label: 'Second name (for an anniversary)', placeholder: 'e.g. Lolo Jose', optional: true },
    ],
    nameFrom: 'eventName',
    palettes: ['emerald-gold', 'black-gold', 'navy-silver', 'sage-cream', 'burgundy-gold', 'blush-rose-gold'],
    fontPairing: 'garden',
    screens: [
      on('welcome'), on('ourStory', 'Through the Years'), off('entourage'), on('details'), on('dressCode'),
      on('gallery'), on('faqs'), off('registry', 'Gifts'), on('rsvpCta', 'Join Us'), on('rsvp'),
    ],
    venueOffsets: [0],
  },
  corporate: {
    type: 'corporate',
    name: 'Corporate / Seminar',
    summary: 'Program, speakers, venue, attire, FAQs and seat registration.',
    cover: '/templates/corporate-auditorium.webp',
    namePlaceholder: 'e.g. Leadership Summit 2027',
    hostFields: [],
    nameFrom: 'eventName',
    palettes: ['navy-silver', 'black-gold', 'emerald-gold', 'sage-cream', 'burgundy-gold', 'blush-rose-gold'],
    fontPairing: 'modern',
    screens: [
      on('welcome'), on('ourStory', 'Program'), on('entourage', 'Speakers'), on('details', 'Venue'), on('dressCode', 'Attire'),
      off('gallery'), on('faqs'), off('registry'), on('rsvpCta', 'Register'), on('rsvp', 'Registration'),
    ],
    venueOffsets: [-30, 0],
  },
};

/** What the events list calls each type; an unknown type shows as itself. */
export const eventTypeName = (type: string): string => (isEventType(type) ? TEMPLATES[type].name : type);
