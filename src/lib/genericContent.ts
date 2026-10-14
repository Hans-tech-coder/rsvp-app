// Generic content shapes, so one site can serve any event type:
//
//   global.hosts[]        who the event is for (a couple, a debutante, a company)
//   entourage.groups[]    "People": any number of titled groups of names
//   details.venues[]      any number of venues / program stops
//   dressCode.guidelines[] any number of titled attire notes
//
// Content saved before Oct 2026 has the wedding-only shape (groomName /
// brideName, fixed entourage lists, ceremony + reception, ladies / gentlemen
// guidelines). The `*FromLegacy` adapters read it, so a doc that was never
// migrated or re-saved keeps rendering. The F5 migration script
// (scripts/migrate-content-f5.js) loads this file too, so keep it free of
// `@/` imports and browser/server-only code.

import { normalizePrincipalSponsors, type Sponsor } from './principalSponsors';

export type Host = { name: string; role: string };

export type Person = { title: string; name: string; role: string; photo: string };
/** Two people facing each other on desktop; `together` puts them on one line on phones. */
export type PersonPair = { left: Person; right: Person; together: boolean };

export const PEOPLE_LAYOUTS = ['pairs', 'list', 'featured'] as const;
export type PeopleLayout = (typeof PEOPLE_LAYOUTS)[number];
/** `people` is used by list / featured groups, `pairs` by pairs groups. */
export type PeopleGroup = { id: string; title: string; layout: PeopleLayout; people: Person[]; pairs: PersonPair[] };

export type Venue = {
  id: string; title: string; subtitle: string; time: string; location: string; address: string;
  description: string; mapLink: string; calendarStart: string; calendarLoc: string; calendarDesc: string;
};

export type Guideline = { id: string; title: string; text: string };

/** Honorifics offered in the editor for people in a pairs group. */
export const PERSON_TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Dra.', 'Atty.', 'Engr.', 'Arch.', 'Hon.'];

type Raw = Record<string, unknown>;

const str = (value: unknown): string => (typeof value === 'string' ? value : '');
const isObject = (value: unknown): value is Raw => !!value && typeof value === 'object' && !Array.isArray(value);
const rawOf = (value: unknown): Raw => (isObject(value) ? value : {});

export const emptyPerson = (): Person => ({ title: '', name: '', role: '', photo: '' });
export const emptyVenue = (id: string): Venue => ({
  id, title: '', subtitle: '', time: '', location: '', address: '',
  description: '', mapLink: '', calendarStart: '', calendarLoc: '', calendarDesc: '',
});

// ---------------------------------------------------------------- display

/** "Mrs." + "Lina Adams" -> "Mrs. Lina Adams"; blanks skipped. */
export function formatPerson(person: Pick<Person, 'title' | 'name'>): string {
  return [person.title, person.name].map((s) => s.trim()).filter(Boolean).join(' ');
}

export function isPairEmpty(pair: PersonPair): boolean {
  return !formatPerson(pair.left) && !formatPerson(pair.right);
}

/** A group with nothing to show is hidden on the site. */
export function groupHasPeople(group: PeopleGroup): boolean {
  return group.layout === 'pairs'
    ? group.pairs.some((pair) => !isPairEmpty(pair))
    : group.people.some((person) => !!formatPerson(person));
}

/** ["Hans", "Czay"] -> "Hans & Czay"; three or more: "A, B & C". */
export function joinNames(names: string[]): string {
  if (names.length <= 2) return names.join(' & ');
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

export const hostNames = (hosts: Host[]): string[] => hosts.map((h) => h.name.trim()).filter(Boolean);

/** First letter of each host's name, upper case: the loader and footer monogram. */
export const hostInitials = (hosts: Host[]): string[] => hostNames(hosts).map((name) => name.charAt(0).toUpperCase());

// ---------------------------------------------------------------- readers (new shape)

function toPerson(value: unknown): Person {
  if (typeof value === 'string') return { ...emptyPerson(), name: value };
  const v = rawOf(value);
  return { title: str(v.title), name: str(v.name), role: str(v.role), photo: str(v.photo) };
}

function toPair(value: unknown): PersonPair {
  const v = rawOf(value);
  return { left: toPerson(v.left), right: toPerson(v.right), together: v.together === true };
}

/** Saved hosts with a name, or null (not a list, or nobody named) so callers fall back. */
export function readHosts(raw: unknown): Host[] | null {
  if (!Array.isArray(raw)) return null;
  const hosts = raw
    .map((h) => ({ name: str(rawOf(h).name), role: str(rawOf(h).role) }))
    .filter((h) => h.name.trim() !== '');
  return hosts.length ? hosts : null;
}

/** The saved groups (an empty list is valid), or null when the doc has none. */
export function readPeopleGroups(raw: unknown): PeopleGroup[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(isObject).map((g, i) => ({
    id: str(g.id) || `group-${i + 1}`,
    title: str(g.title),
    layout: (PEOPLE_LAYOUTS as readonly string[]).includes(str(g.layout)) ? (g.layout as PeopleLayout) : 'list',
    people: Array.isArray(g.people) ? g.people.map(toPerson) : [],
    pairs: Array.isArray(g.pairs) ? g.pairs.map(toPair) : [],
  }));
}

function toVenue(value: Raw, fallbackId: string): Venue {
  const venue = emptyVenue(str(value.id) || fallbackId);
  for (const key of Object.keys(venue) as (keyof Venue)[]) {
    if (key !== 'id') venue[key] = str(value[key]);
  }
  return venue;
}

export function readVenues(raw: unknown): Venue[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(isObject).map((v, i) => toVenue(v, `venue-${i + 1}`));
}

export function readGuidelines(raw: unknown): Guideline[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter(isObject).map((g, i) => ({ id: str(g.id) || `guideline-${i + 1}`, title: str(g.title), text: str(g.text) }));
}

// ---------------------------------------------------------------- legacy adapters

/** `groomName` / `brideName` -> two hosts (groom first, as the site wrote "Hans & Czay"). */
export function hostsFromLegacy(globalDoc: unknown): Host[] | null {
  const g = rawOf(globalDoc);
  return readHosts([
    { name: str(g.groomName).trim(), role: 'Groom' },
    { name: str(g.brideName).trim(), role: 'Bride' },
  ]);
}

/** English group titles used when the event's site text has none (keys of the old `siteText.entourage`). */
export const LEGACY_PEOPLE_TITLES = {
  parentsOfBride: 'Parents of the Bride',
  parentsOfGroom: 'Parents of the Groom',
  principalSponsors: 'Principal Sponsors',
  maidOfHonor: 'Maid of Honor',
  bestMan: 'Best Man',
  bridesmaids: 'Bridesmaids',
  groomsmen: 'Groomsmen',
  flowerGirls: 'Flower Girls',
  ringBearer: 'Ring Bearer',
};

const LEGACY_ENTOURAGE_KEYS = ['parents', 'principalSponsors', 'honorAttendants', 'bridesmaids', 'groomsmen', 'flowerGirls', 'ringBearers'];

const namesToPeople = (value: unknown): Person[] =>
  (Array.isArray(value) ? value : [value])
    .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
    .map((name) => ({ ...emptyPerson(), name }));

const sponsorToPerson = (sponsor: Sponsor): Person => ({ ...emptyPerson(), title: sponsor.title, name: sponsor.name });

/**
 * The fixed wedding entourage as People groups, in the order the old screen
 * showed them. `titles` is the event's old `siteText.entourage` (any missing
 * title falls back to English). Null when the doc has no legacy lists.
 */
export function peopleGroupsFromLegacy(entourageDoc: unknown, titles?: unknown): PeopleGroup[] | null {
  const doc = rawOf(entourageDoc);
  if (!LEGACY_ENTOURAGE_KEYS.some((key) => key in doc)) return null;

  const t = rawOf(titles);
  const title = (key: keyof typeof LEGACY_PEOPLE_TITLES) => str(t[key]).trim() || LEGACY_PEOPLE_TITLES[key];
  const parents = rawOf(doc.parents);
  const honor = rawOf(doc.honorAttendants);
  const group = (id: string, key: keyof typeof LEGACY_PEOPLE_TITLES, layout: PeopleLayout, people: Person[]): PeopleGroup =>
    ({ id, title: title(key), layout, people, pairs: [] });

  return [
    group('parents-bride', 'parentsOfBride', 'featured', namesToPeople(parents.bride)),
    group('parents-groom', 'parentsOfGroom', 'featured', namesToPeople(parents.groom)),
    {
      id: 'principal-sponsors', title: title('principalSponsors'), layout: 'pairs', people: [],
      // Ninang on the left, ninong on the right, as before
      pairs: (normalizePrincipalSponsors(doc.principalSponsors) ?? []).map((pair) => ({
        left: sponsorToPerson(pair.ninang), right: sponsorToPerson(pair.ninong), together: pair.couple,
      })),
    },
    group('maid-of-honor', 'maidOfHonor', 'featured', namesToPeople(honor.maidOfHonor)),
    group('best-man', 'bestMan', 'featured', namesToPeople(honor.bestMan)),
    group('bridesmaids', 'bridesmaids', 'list', namesToPeople(doc.bridesmaids)),
    group('groomsmen', 'groomsmen', 'list', namesToPeople(doc.groomsmen)),
    group('flower-girls', 'flowerGirls', 'list', namesToPeople(doc.flowerGirls)),
    group('ring-bearers', 'ringBearer', 'list', namesToPeople(doc.ringBearers)),
  ];
}

/**
 * `details.ceremony` + `details.reception` as two venues. Time, location and
 * address were edited in Global Settings and win when set there (the old
 * rule). Null when the details doc has neither.
 */
export function venuesFromLegacy(detailsDoc: unknown, globalDoc: unknown): Venue[] | null {
  const doc = rawOf(detailsDoc);
  const g = rawOf(globalDoc);
  const keys = (['ceremony', 'reception'] as const).filter((key) => isObject(doc[key]));
  if (!keys.length) return null;

  return keys.map((key) => {
    const venue = toVenue({ ...rawOf(doc[key]), id: key }, key);
    venue.time = str(g[`${key}Time`]) || venue.time;
    venue.location = str(g[`${key}Location`]) || venue.location;
    venue.address = str(g[`${key}Address`]) || venue.address;
    return venue;
  });
}

/** English guideline titles used when the event's site text has none (old `siteText.dressCode`). */
export const LEGACY_GUIDELINE_TITLES = { ladies: 'For Ladies', gentlemen: 'For Gentlemen' };

/** `ladiesGuideline` / `gentlemenGuideline` as two guidelines. Null when the doc has neither. */
export function guidelinesFromLegacy(dressCodeDoc: unknown, titles?: unknown): Guideline[] | null {
  const doc = rawOf(dressCodeDoc);
  if (typeof doc.ladiesGuideline !== 'string' && typeof doc.gentlemenGuideline !== 'string') return null;
  const t = rawOf(titles);
  return [
    { id: 'ladies', title: str(t.ladies).trim() || LEGACY_GUIDELINE_TITLES.ladies, text: str(doc.ladiesGuideline) },
    { id: 'gentlemen', title: str(t.gentlemen).trim() || LEGACY_GUIDELINE_TITLES.gentlemen, text: str(doc.gentlemenGuideline) },
  ];
}
