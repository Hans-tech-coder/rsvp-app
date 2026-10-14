// Principal sponsors are stored as pairs: the ninang sits on the left, the
// ninong on the right, and the same row on desktop. `couple` decides the
// phone layout: a couple shares one line, two solo sponsors get a line each.
//
// Older content stored a flat string[] ("Mrs. A", "Mr. B", or a couple as
// "Mr. B & Mrs. A"). `normalizePrincipalSponsors` reads both shapes, so the
// site keeps working until an admin re-saves in the new shape.

export type Sponsor = { title: string; name: string };
export type SponsorPair = { ninang: Sponsor; ninong: Sponsor; couple: boolean };

export const NINANG_TITLES = ['Mrs.', 'Ms.', 'Dra.', 'Dr.', 'Atty.', 'Engr.', 'Arch.', 'Hon.'];
export const NINONG_TITLES = ['Mr.', 'Dr.', 'Atty.', 'Engr.', 'Arch.', 'Hon.'];

const KNOWN_TITLES = Array.from(new Set([...NINANG_TITLES, ...NINONG_TITLES, 'Miss']));
const FEMALE_TITLES = ['mrs.', 'ms.', 'miss', 'dra.'];
const MALE_TITLES = ['mr.'];

export const emptySponsor = (): Sponsor => ({ title: '', name: '' });

export function formatSponsor(sponsor: Sponsor): string {
  return [sponsor.title, sponsor.name].map(s => s.trim()).filter(Boolean).join(' ');
}

export function isPairEmpty(pair: SponsorPair): boolean {
  return !formatSponsor(pair.ninang) && !formatSponsor(pair.ninong);
}

/** "Mrs. Lina Adams" -> { title: "Mrs.", name: "Lina Adams" }; unknown titles stay in the name. */
function parseSponsor(raw: string): Sponsor {
  const text = raw.trim().replace(/\s+/g, ' ');
  const [first, ...rest] = text.split(' ');
  const title = KNOWN_TITLES.find(t => t.toLowerCase() === first?.toLowerCase());
  return title ? { title, name: rest.join(' ') } : { title: '', name: text };
}

type Gender = 'f' | 'm' | null;

function genderOf(sponsor: Sponsor): Gender {
  const title = sponsor.title.toLowerCase();
  if (FEMALE_TITLES.includes(title)) return 'f';
  if (MALE_TITLES.includes(title)) return 'm';
  return null;
}

function coerceSponsor(value: unknown): Sponsor {
  if (typeof value === 'string') return parseSponsor(value);
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    return {
      title: typeof v.title === 'string' ? v.title : '',
      name: typeof v.name === 'string' ? v.name : '',
    };
  }
  return emptySponsor();
}

/** "Mr. Larry Adams & Mrs. Angelina Adams" -> one couple. */
function parseCouple(text: string): SponsorPair {
  const [a, b] = text.split(/\s+&\s+/, 2).map(parseSponsor);
  // "Mr. & Mrs. Larry Adams": the bare title borrows the other half's name
  if (!a.name) a.name = b.name;
  if (!b.name) b.name = a.name;
  const aIsNinang = genderOf(a) === 'f' || genderOf(b) === 'm';
  return aIsNinang
    ? { ninang: a, ninong: b, couple: true }
    : { ninang: b, ninong: a, couple: true };
}

/**
 * Reads principalSponsors in either shape. Returns null when the value is not
 * an array, so callers can fall back with `??`.
 */
export function normalizePrincipalSponsors(raw: unknown): SponsorPair[] | null {
  if (!Array.isArray(raw)) return null;

  const pairs: SponsorPair[] = [];
  let pending: Sponsor | null = null;

  // A solo sponsor left without a partner gets a half-filled row.
  const flush = () => {
    if (!pending) return;
    pairs.push(
      genderOf(pending) === 'm'
        ? { ninang: emptySponsor(), ninong: pending, couple: false }
        : { ninang: pending, ninong: emptySponsor(), couple: false }
    );
    pending = null;
  };

  for (const item of raw) {
    if (item && typeof item === 'object' && ('ninang' in item || 'ninong' in item)) {
      flush();
      const v = item as Record<string, unknown>;
      // `married` was this flag's first name; one save on 2026-10-14 used it
      pairs.push({ ninang: coerceSponsor(v.ninang), ninong: coerceSponsor(v.ninong), couple: v.couple === true || v.married === true });
      continue;
    }
    if (typeof item !== 'string' || !item.trim()) continue;

    if (/\s&\s/.test(item)) {
      flush();
      pairs.push(parseCouple(item));
      continue;
    }

    // Legacy solo entries: a woman next to a man become one solo row.
    const sponsor = parseSponsor(item);
    if (!pending) {
      pending = sponsor;
      continue;
    }
    const g1 = genderOf(pending);
    const g2 = genderOf(sponsor);
    if (g1 !== null && g1 === g2) {
      flush();
      pending = sponsor;
      continue;
    }
    const pendingIsNinang = g1 === 'f' || g2 === 'm' || (g1 === null && g2 === null);
    pairs.push(
      pendingIsNinang
        ? { ninang: pending, ninong: sponsor, couple: false }
        : { ninang: sponsor, ninong: pending, couple: false }
    );
    pending = null;
  }
  flush();

  return pairs;
}
