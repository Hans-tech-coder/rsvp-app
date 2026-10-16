// Relative imports: vitest has no '@/' alias
import type { Guideline, PeopleGroup, PeopleLayout, Person, Venue } from '../genericContent';

// Small builders for the template docs (./wedding.ts and the others).

export const photo = (file: string) => `/templates/${file}.webp`;

/** The logo of every template event until the client uploads theirs. */
export const EMBLEM = '/templates/emblem.svg';

export const person = (name: string, role = '', title = ''): Person => ({ title, name, role, photo: '' });

export function group(id: string, title: string, layout: Exclude<PeopleLayout, 'pairs'>, people: Person[]): PeopleGroup {
  return { id, title, layout, people, pairs: [] };
}

export function pairsGroup(id: string, title: string, pairs: [Person, Person][]): PeopleGroup {
  return { id, title, layout: 'pairs', people: [], pairs: pairs.map(([left, right]) => ({ left, right, together: false })) };
}

/** A venue card; time, place, map and calendar fields are filled from the wizard (./index.ts). */
export function venue(id: string, title: string, subtitle: string, description: string, calendarDesc: string): Venue {
  return {
    id, title, subtitle, description, calendarDesc,
    time: '', location: '', address: '', mapLink: '', calendarStart: '', calendarLoc: '',
  };
}

export const guideline = (id: string, title: string, text: string): Guideline => ({ id, title, text });

export const faq = (q: string, a: string) => ({ q, a });

/** Bank cards with no QR code yet: the guest site shows "Place {bank} QR Code Here". */
export const SAMPLE_BANKS = [
  { name: 'GCash', qrImage: '' },
  { name: 'Maya', qrImage: '' },
  { name: 'Bank Transfer', qrImage: '' },
];

/** RSVP form labels shared by the celebrations (wedding, debut, birthday). */
export const RSVP_LABELS = {
  fullName: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  attendance: 'Will you attend?',
  proxy: 'Proxy Name (If Any)',
  proxyPlaceholder: 'Enter proxy name or N/A',
  message: 'Message for {hostNames}',
  messagePlaceholder: 'Share your warm thoughts...',
};

export const privacyText = (purpose: string) =>
  `I agree to the collection and processing of the personal information provided in this form for the sole purpose of ${purpose}, in accordance with the Data Privacy Act.`;
