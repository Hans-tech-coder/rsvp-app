// Relative imports: vitest has no '@/' alias
import { EVENT_TYPES, type EventType } from './catalog';
import type { NewEventDetails } from './index';

// Demo events (F14): one event per template with made-up content, guests,
// RSVPs and gifts, for showing the platform to a prospect. Pure; the owners'
// "Demo events" button on All Events (setUpDemoEvents in
// src/app/actions/events.ts) writes them, and writes them again from scratch
// on every reset, so whatever a prospect changed is undone.
// The event doc gets `demo: true`; an event with a demo ID but without that
// flag is never touched.

/** The demo of each template lives at /demo-<type>. */
export const demoEventId = (type: EventType) => `demo-${type}`;

export const DEMO_EVENT_IDS = EVENT_TYPES.map(demoEventId);

/** Wizard answers for each demo; the date is set from the day it is (re)set up. */
const DEMO_DETAILS: Record<EventType, Omit<NewEventDetails, 'type' | 'start'> & { time: string }> = {
  wedding: {
    name: 'Miguel & Isabel’s Wedding',
    hosts: ['Miguel', 'Isabel'],
    time: '15:00',
    venue: 'Casa Grande Garden',
    address: 'Aguinaldo Highway',
    city: 'Tagaytay',
    palette: 'sage-cream',
  },
  debut: {
    name: 'Sofia’s Debut',
    hosts: ['Sofia'],
    time: '18:00',
    venue: 'The Grand Ballroom',
    address: 'Ayala Avenue',
    city: 'Makati',
    palette: 'blush-rose-gold',
  },
  birthday: {
    name: 'Lola Carmen’s 80th Birthday',
    hosts: ['Lola Carmen', ''],
    time: '11:00',
    venue: 'Villa Rosario',
    address: 'Lakeside Road',
    city: 'Batangas',
    palette: 'emerald-gold',
  },
  corporate: {
    name: 'Leadership Summit 2027',
    hosts: [],
    time: '08:30',
    venue: 'Summit Hall',
    address: 'Bonifacio Global City',
    city: 'Taguig',
    palette: 'navy-silver',
  },
};

/** How far ahead a demo's date is, so its countdown always runs. Moved to the next Saturday. */
const DAYS_AHEAD = 120;

const pad = (n: number) => String(n).padStart(2, '0');

/** The demo's wizard answers, dated about four months after `today` (a Saturday). */
export function demoDetails(type: EventType, today: Date): NewEventDetails {
  const { time, ...details } = DEMO_DETAILS[type];
  const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + DAYS_AHEAD));
  day.setUTCDate(day.getUTCDate() + ((6 - day.getUTCDay() + 7) % 7));
  const start = `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}T${time}`;
  return { type, ...details, start };
}

/** A sample guest: an RSVP already sent, or (no `fullName`) an invite code not used yet. */
export type DemoGuest = {
  inviteCode: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  willAttend?: 'Yes' | 'No';
  proxyName?: string;
  message?: string;
  /** When the RSVP came in. */
  daysAgo?: number;
};

const rsvp = (inviteCode: string, fullName: string, willAttend: 'Yes' | 'No', daysAgo: number, message = '', proxyName = ''): DemoGuest => ({
  inviteCode,
  fullName,
  email: `${fullName.split(' ')[0].toLowerCase()}@example.com`,
  phoneNumber: `+6391700001${pad(daysAgo)}`,
  willAttend,
  proxyName,
  message,
  daysAgo,
});

/**
 * The same guests in every demo. The TRYME codes stay unused, so a prospect
 * can unlock the RSVP form on the guest site with one of them.
 */
export const DEMO_GUESTS: DemoGuest[] = [
  rsvp('K7QX2M', 'Andrea Santos', 'Yes', 12, 'Looking forward to it!'),
  rsvp('P4HW8N', 'Paolo Reyes', 'Yes', 11, 'See you there.'),
  rsvp('R9TD3F', 'Bea Villanueva', 'Yes', 9, '', 'Carlo Villanueva'),
  rsvp('M2JV6C', 'Joshua Cruz', 'No', 8, 'Sorry I can’t make it. Wishing you a wonderful day!'),
  rsvp('H5LZ7S', 'Kristine Garcia', 'Yes', 6, 'Count me in.'),
  rsvp('W3NB4E', 'Mark Dela Rosa', 'Yes', 4),
  rsvp('F8YC2K', 'Liza Mendoza', 'No', 3, 'Out of the country that week. Congratulations!'),
  rsvp('B6GR9P', 'Ramon Aquino', 'Yes', 1, 'Can’t wait!'),
  ...['TRYME2', 'TRYME3', 'TRYME4', 'TRYME5'].map((inviteCode) => ({ inviteCode })),
];

/** A sample registry gift and who claimed it (names from DEMO_GUESTS). */
export type DemoGift = { name: string; link: string; maxCount: number; claimedBy: string[] };

const gift = (name: string, slug: string, maxCount: number, claimedBy: string[] = []): DemoGift => ({
  name,
  link: `https://example.com/gifts/${slug}`,
  maxCount,
  claimedBy,
});

/** Only for the templates whose Registry screen is shown. */
export const DEMO_GIFTS: Partial<Record<EventType, DemoGift[]>> = {
  wedding: [
    gift('Stand Mixer', 'stand-mixer', 1, ['Andrea Santos']),
    gift('Dinnerware Set for 8', 'dinnerware-set', 2, ['Paolo Reyes']),
    gift('Honeymoon Fund', 'honeymoon-fund', 10),
  ],
  debut: [
    gift('Pearl Earrings', 'pearl-earrings', 1, ['Kristine Garcia']),
    gift('Instant Camera', 'instant-camera', 1),
    gift('Travel Fund', 'travel-fund', 10, ['Bea Villanueva']),
  ],
};

